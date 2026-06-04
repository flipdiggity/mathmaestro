import { CurriculumTopic, TopicSelection } from './curriculum/types';
import { prisma } from './db';
import {
  orderedSequence,
  floorIndexFor,
  getStartFloor,
  seqCountsFor,
  selectSequential,
  SeqMastery,
} from './curriculum/sequencing';

export type Pacing = 'accelerating' | 'steady' | 'reinforcing';

export interface SelectTopicsResult {
  selections: TopicSelection[];
  pacing: Pacing;
  /** Primary new topic IDs that should be excluded in multi-day batches (not fill-ins) */
  primaryNewTopicIds: string[];
}

/**
 * Get pacing recommendation based on recent graded worksheet scores.
 * - avg > 85% → accelerating (up to 90% new)
 * - avg < 60% → reinforcing (down to 40% new)
 * - otherwise → steady (default 70% new)
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
 * Select topics for a worksheet by walking the curriculum IN SEQUENCE.
 *
 * Builds the global teaching order ((gradeLevel, order)), finds the student's
 * frontier (first not-yet-mastered topic at/after their start floor), and picks
 * a FEW focused topics: the next unmastered topics (current), a little review of
 * earlier weak spots, and a small preview ahead. This keeps worksheets
 * sequential and building, instead of scattering across the whole year.
 *
 * @param excludeNewTopicIds - topic IDs to exclude from new selections (for multi-day batches, so each day advances)
 */
export async function selectTopics(
  childId: string,
  topics: CurriculumTopic[],
  totalQuestions: number = 25,
  _targetTestDate?: Date | null,
  excludeNewTopicIds?: Set<string>
): Promise<SelectTopicsResult> {
  const masteryRecords = await prisma.topicMastery.findMany({ where: { childId } });
  const masteryMap = new Map<string, SeqMastery>();
  for (const r of masteryRecords) {
    masteryMap.set(r.topicId, {
      mastery: r.mastery,
      lastPracticedAt: r.lastPracticedAt,
      timesPracticed: r.timesPracticed,
    });
  }

  const child = await prisma.child.findUnique({ where: { id: childId } });
  const baseGrade = child?.grade ?? Math.min(...topics.map((t) => t.gradeLevel));
  const childName = child?.name ?? '';

  const pacing = await getPacingRecommendation(childId);

  const seq = orderedSequence(topics);
  const floorIndex = floorIndexFor(seq, getStartFloor(childName, baseGrade));
  const counts = seqCountsFor(totalQuestions, pacing);

  const { selections, primaryNewTopicIds } = selectSequential(seq, masteryMap, {
    floorIndex,
    counts,
    excludeIds: excludeNewTopicIds,
  });

  return { selections, pacing, primaryNewTopicIds };
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

  const oldMastery = existing?.mastery ?? 0;
  const newMastery = existing
    ? 0.7 * oldMastery + 0.3 * scorePercent
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
