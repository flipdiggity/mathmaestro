import { CurriculumTopic, TopicSelection } from './curriculum/types';
import { getCurrentNineWeeks } from './curriculum/pacing';
import { prisma } from './db';

interface MasteryRecord {
  topicId: string;
  mastery: number;
  lastPracticedAt: Date | null;
  timesPracticed: number;
}

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
 * Select topics for a worksheet using calendar-aware spaced repetition.
 *
 * Topic allocation by nine-weeks period:
 * - ~60% current nine-weeks topics (primary focus)
 * - ~25% previous nine-weeks review (only low-mastery, capped)
 * - ~15% preview/spillover (future topics or if current is mastered)
 *
 * Within each bucket, mastery-based sorting is preserved.
 * Pacing modifiers (accelerating/reinforcing) still apply.
 *
 * @param excludeNewTopicIds - topic IDs to exclude from new selections (for multi-day batches)
 */
export async function selectTopics(
  childId: string,
  topics: CurriculumTopic[],
  totalQuestions: number = 30,
  targetTestDate?: Date | null,
  excludeNewTopicIds?: Set<string>
): Promise<SelectTopicsResult> {
  // Get existing mastery records for this child
  const masteryRecords = await prisma.topicMastery.findMany({
    where: { childId },
  });

  const masteryMap = new Map<string, MasteryRecord>();
  for (const record of masteryRecords) {
    masteryMap.set(record.topicId, {
      topicId: record.topicId,
      mastery: record.mastery,
      lastPracticedAt: record.lastPracticedAt,
      timesPracticed: record.timesPracticed,
    });
  }

  const now = new Date();
  const currentNW = getCurrentNineWeeks(now);

  // Get pacing recommendation
  const pacing = await getPacingRecommendation(childId);

  // Bucket topics by nine-weeks period relative to current
  const currentTopics = topics.filter((t) => t.nineWeeks === currentNW);
  const previousTopics = topics.filter((t) => t.nineWeeks < currentNW);
  const futureTopics = topics.filter((t) => t.nineWeeks > currentNW);

  // Slot allocation — adjust by pacing
  // Allocation ratios: current + review, preview = remainder
  let currentRatio: number;
  let reviewRatio: number;

  switch (pacing) {
    case 'accelerating':
      // Kid is doing great — allow more preview of future topics
      currentRatio = 0.50;
      reviewRatio = 0.15;
      break;
    case 'reinforcing':
      // Kid is struggling — more review of previous, less preview
      currentRatio = 0.50;
      reviewRatio = 0.40;
      break;
    default:
      // Steady — default allocation
      currentRatio = 0.60;
      reviewRatio = 0.25;
  }

  // Further adjust for test urgency
  if (targetTestDate) {
    const daysUntilTest = Math.max(1, (targetTestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const totalTopicCount = topics.length;
    const masteredTopics = masteryRecords.filter((m) => m.mastery >= 70).length;
    const remainingTopics = totalTopicCount - masteredTopics;
    const topicsPerDay = remainingTopics / daysUntilTest;

    if (topicsPerDay > 0.5) {
      // Push more into current nine-weeks when test is approaching
      const boost = Math.min(0.15, (topicsPerDay - 0.5) * 0.1);
      currentRatio = Math.min(0.85, currentRatio + boost);
      reviewRatio = Math.max(0.05, reviewRatio - boost / 2);
    }
  }

  const currentCount = Math.ceil(totalQuestions * currentRatio);
  const reviewCount = Math.ceil(totalQuestions * reviewRatio);
  const previewCount = totalQuestions - currentCount - reviewCount;

  const selections: TopicSelection[] = [];
  const primaryNewTopicIds: string[] = [];

  // ── 1. CURRENT nine-weeks topics ──────────────────────────────────
  // New topics in current period that haven't been mastered
  const currentNew = currentTopics
    .filter((t) => {
      if (excludeNewTopicIds?.has(t.id)) return false;
      const m = masteryMap.get(t.id);
      return !m || m.mastery < 70;
    })
    .sort((a, b) => a.order - b.order);

  // Current period topics needing review (practiced but not mastered)
  const currentReview = currentTopics
    .filter((t) => {
      const m = masteryMap.get(t.id);
      return m && m.timesPracticed > 0 && m.mastery < 90;
    })
    .map((t) => {
      const m = masteryMap.get(t.id)!;
      const daysSince = m.lastPracticedAt
        ? Math.max(1, (now.getTime() - m.lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      return { topic: t, priority: (100 - m.mastery) * daysSince };
    })
    .sort((a, b) => b.priority - a.priority);

  // Fill current slots: new first, then review within current period
  for (const topic of currentNew.slice(0, currentCount)) {
    selections.push({
      topic,
      reason: 'current',
      priority: 100 - (masteryMap.get(topic.id)?.mastery ?? 0),
    });
    primaryNewTopicIds.push(topic.id);
  }

  const currentNewFilled = Math.min(currentNew.length, currentCount);
  const currentReviewSlots = currentCount - currentNewFilled;
  for (const { topic, priority } of currentReview.slice(0, currentReviewSlots)) {
    if (selections.some((s) => s.topic.id === topic.id)) continue;
    selections.push({ topic, reason: 'review', priority });
  }

  // ── 2. PREVIOUS nine-weeks review ────────────────────────────────
  // Only review topics from previous periods with mastery < 80%
  const prevReviewCandidates = previousTopics
    .filter((t) => {
      const m = masteryMap.get(t.id);
      return m && m.timesPracticed > 0 && m.mastery < 80;
    })
    .map((t) => {
      const m = masteryMap.get(t.id)!;
      const daysSince = m.lastPracticedAt
        ? Math.max(1, (now.getTime() - m.lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      return { topic: t, priority: (100 - m.mastery) * daysSince };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, reviewCount);

  for (const { topic, priority } of prevReviewCandidates) {
    selections.push({ topic, reason: 'review', priority });
  }

  // ── 3. PREVIEW / spillover ───────────────────────────────────────
  // Future topics for advanced students, or fill if current is mastered
  const existingIds = new Set(selections.map((s) => s.topic.id));

  const previewCandidates = futureTopics
    .filter((t) => {
      if (excludeNewTopicIds?.has(t.id)) return false;
      if (existingIds.has(t.id)) return false;
      const m = masteryMap.get(t.id);
      return !m || m.mastery < 70;
    })
    .sort((a, b) => a.order - b.order)
    .slice(0, previewCount);

  for (const topic of previewCandidates) {
    selections.push({
      topic,
      reason: 'preview',
      priority: 30,
    });
  }

  // ── 4. Backfill if we don't have enough topics ───────────────────
  if (selections.length < totalQuestions) {
    const filledIds = new Set(selections.map((s) => s.topic.id));

    // Try more current-period topics first (even mastered ones for reinforcement)
    const currentExtras = currentTopics
      .filter((t) => !filledIds.has(t.id))
      .sort((a, b) => a.order - b.order);

    for (const topic of currentExtras) {
      if (selections.length >= totalQuestions) break;
      selections.push({ topic, reason: 'current', priority: 40 });
      filledIds.add(topic.id);
    }

    // Then previous-period topics with higher mastery threshold
    const prevExtras = previousTopics
      .filter((t) => !filledIds.has(t.id))
      .sort((a, b) => a.order - b.order);

    for (const topic of prevExtras) {
      if (selections.length >= totalQuestions) break;
      selections.push({ topic, reason: 'review', priority: 20 });
      filledIds.add(topic.id);
    }

    // Finally future topics
    const futureExtras = futureTopics
      .filter((t) => !filledIds.has(t.id))
      .sort((a, b) => a.order - b.order);

    for (const topic of futureExtras) {
      if (selections.length >= totalQuestions) break;
      selections.push({ topic, reason: 'preview', priority: 10 });
    }
  }

  return {
    selections: selections.slice(0, totalQuestions),
    pacing,
    primaryNewTopicIds,
  };
}

/**
 * Update mastery after grading.
 * Formula: newMastery = 0.7 * oldMastery + 0.3 * newScore
 */
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
