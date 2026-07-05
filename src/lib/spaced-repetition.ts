import { CurriculumTopic, TopicSelection } from './curriculum/types';
import { prisma } from './db';
import { seqCountsFor, selectSequential, SeqMastery } from './curriculum/sequencing';
import { resolveCurriculumForChild, ChildCurriculumRef } from './curriculum/courses';
import { loadAdaptiveStates, AdaptiveTopicState } from './adaptive';
import { computePlanStatus, PlanStatus } from './plan';

export type Pacing = 'accelerating' | 'steady' | 'reinforcing';

export interface SelectTopicsChild extends ChildCurriculumRef {
  planEndDate?: Date | null;
  targetTestDate?: Date | null;
}

export interface SelectTopicsResult {
  selections: TopicSelection[];
  pacing: Pacing;
  /** Primary new topic IDs (the frontier window taught on this sheet). */
  primaryNewTopicIds: string[];
  /** Adaptive per-topic state, for difficulty/variety prompting. */
  states: Map<string, AdaptiveTopicState>;
  /** Study-plan pace status (drives numCurrent + advance rule + dashboards). */
  plan: PlanStatus;
  /** Ordered sequence + floor, so callers don't re-resolve. */
  seq: CurriculumTopic[];
  floorIndex: number;
}

/**
 * Get pacing recommendation based on recent graded worksheet scores.
 * - avg > 85% → accelerating (larger preview)
 * - avg < 60% → reinforcing (more review, no preview)
 * - otherwise → steady
 */
export async function getPacingRecommendation(childId: string): Promise<Pacing> {
  const recentWorksheets = await prisma.worksheet.findMany({
    where: { childId, status: 'graded' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { gradingResult: true },
  });

  const scores = recentWorksheets
    .filter((w) => w.gradingResult)
    .map((w) => w.gradingResult!.scorePercent);

  if (scores.length < 2) return 'steady';

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  if (avg > 85) return 'accelerating';
  if (avg < 60) return 'reinforcing';
  return 'steady';
}

/**
 * Select topics for a worksheet by walking the child's course sequence.
 *
 * Course preset (or legacy grade/track) → ordered sequence + start floor.
 * The frontier advances on graded mastery OR sufficient ungraded exposure
 * (serve counts), paced against the child's plan end date. See sequencing.ts
 * for the advance rule and plan.ts for the pace math.
 */
export async function selectTopics(
  child: SelectTopicsChild,
  totalQuestions: number = 25,
  opts: {
    excludeNewTopicIds?: Set<string>;
    windowOffset?: number;
  } = {}
): Promise<SelectTopicsResult> {
  const { topics, seq, floorIndex } = resolveCurriculumForChild(child);
  const poolIds = new Set(topics.map((t) => t.id));
  // Only rows matching the CURRENT curriculum pool count — old curricula used
  // different topic-ID schemes and those orphans must not steer selection.
  const states = await loadAdaptiveStates(child.id, poolIds);

  const pacing = await getPacingRecommendation(child.id);
  const planEnd = child.planEndDate ?? child.targetTestDate ?? null;
  const plan = computePlanStatus(seq.slice(floorIndex), states, planEnd);

  const counts = seqCountsFor(totalQuestions, pacing, plan.numCurrent);

  const seqMastery = new Map<string, SeqMastery>();
  states.forEach((s, id) =>
    seqMastery.set(id, {
      mastery: s.mastery,
      lastPracticedAt: s.lastPracticedAt,
      timesPracticed: s.timesPracticed,
      timesServed: s.timesServed,
      servesSinceGrade: s.servesSinceGrade,
      lastServedAt: s.lastServedAt,
    })
  );

  const { selections, primaryNewTopicIds } = selectSequential(seq, seqMastery, {
    floorIndex,
    counts,
    excludeIds: opts.excludeNewTopicIds,
    windowOffset: opts.windowOffset,
    servesToAdvance: plan.servesToAdvance,
  });

  return { selections, pacing, primaryNewTopicIds, states, plan, seq, floorIndex };
}

/**
 * Update mastery after grading.
 * Formula: newMastery = 0.7 * oldMastery + 0.3 * newScore
 */
/**
 * Re-apply mastery for a topic after a manual grade correction. The grader
 * already applied `previousScore` for this practice via updateMastery (one EMA
 * step + timesPracticed++). This reverses that single step and re-applies the
 * corrected score in its place, WITHOUT inflating timesPracticed — so a teacher
 * override replaces the grade rather than stacking a second practice event.
 *
 * Assumes no other practice on this topic happened between grading and the
 * override (true for an immediate correction on the results screen).
 */
export async function correctMastery(
  childId: string,
  topicId: string,
  previousScore: number,
  correctedScore: number
): Promise<void> {
  if (Math.abs(previousScore - correctedScore) < 1e-9) return;

  const rec = await prisma.topicMastery.findUnique({
    where: { childId_topicId: { childId, topicId } },
  });
  if (!rec) return;

  let newMastery: number;
  if (rec.timesPracticed <= 1) {
    // The grade was this topic's first practice — mastery was set directly to
    // previousScore. Replace it with the corrected score.
    newMastery = correctedScore;
  } else {
    // Reverse one EMA step (mastery = 0.7*prior + 0.3*previousScore) to recover
    // the prior mastery, then re-apply with the corrected score.
    const prior = (rec.mastery - 0.3 * previousScore) / 0.7;
    newMastery = 0.7 * prior + 0.3 * correctedScore;
  }

  await prisma.topicMastery.update({
    where: { childId_topicId: { childId, topicId } },
    data: {
      mastery: Math.round(Math.max(0, Math.min(100, newMastery)) * 100) / 100,
      lastScore: correctedScore,
    },
  });
}

export async function updateMastery(
  childId: string,
  topicId: string,
  topicName: string,
  gradeLevel: number,
  scorePercent: number
): Promise<void> {
  const existing = await prisma.topicMastery.findUnique({
    where: { childId_topicId: { childId, topicId } },
  });

  // A row that exists from SERVES only (never graded) carries no mastery
  // evidence — the first grade sets mastery directly rather than blending
  // with the zero placeholder.
  const hasEvidence = !!existing && (existing.timesPracticed > 0 || existing.mastery > 0);
  const newMastery = hasEvidence
    ? 0.7 * existing!.mastery + 0.3 * scorePercent
    : scorePercent;

  await prisma.topicMastery.upsert({
    where: { childId_topicId: { childId, topicId } },
    update: {
      mastery: Math.round(newMastery * 100) / 100,
      timesPracticed: { increment: 1 },
      lastPracticedAt: new Date(),
      lastScore: scorePercent,
    },
    create: {
      childId,
      topicId,
      topicName,
      gradeLevel,
      mastery: Math.round(newMastery * 100) / 100,
      timesPracticed: 1,
      lastPracticedAt: new Date(),
      lastScore: scorePercent,
    },
  });
}
