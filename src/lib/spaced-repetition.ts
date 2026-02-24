import { CurriculumTopic, TopicSelection } from './curriculum/types';
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
 * Select topics for a worksheet using spaced repetition.
 * - Base: 70% new topics / 30% review
 * - Auto-pacing adjusts ratio based on recent scores
 * - For kids with upcoming tests, urgency weighting increases new topics
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

  // Get pacing recommendation
  const pacing = await getPacingRecommendation(childId);

  // Base ratio by pacing
  let newTopicRatio: number;
  switch (pacing) {
    case 'accelerating':
      newTopicRatio = 0.9;
      break;
    case 'reinforcing':
      newTopicRatio = 0.4;
      break;
    default:
      newTopicRatio = 0.7;
  }

  // Further adjust for test urgency
  if (targetTestDate) {
    const daysUntilTest = Math.max(1, (targetTestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const totalTopics = topics.length;
    const masteredTopics = masteryRecords.filter((m) => m.mastery >= 70).length;
    const remainingTopics = totalTopics - masteredTopics;
    const topicsPerDay = remainingTopics / daysUntilTest;

    if (topicsPerDay > 0.5) {
      newTopicRatio = Math.min(0.9, newTopicRatio + (topicsPerDay - 0.5) * 0.1);
    }
  }

  const newCount = Math.ceil(totalQuestions * newTopicRatio);
  const reviewCount = totalQuestions - newCount;

  const selections: TopicSelection[] = [];

  // Select NEW topics - next ones in sequence that haven't been mastered
  const newTopics = topics
    .filter((t) => {
      if (excludeNewTopicIds?.has(t.id)) return false;
      const m = masteryMap.get(t.id);
      return !m || m.mastery < 70;
    })
    .sort((a, b) => a.order - b.order)
    .slice(0, newCount);

  // Track only these primary new topics for multi-day exclusion
  const primaryNewTopicIds = newTopics.map((t) => t.id);

  for (const topic of newTopics) {
    selections.push({
      topic,
      reason: 'new',
      priority: 100 - (masteryMap.get(topic.id)?.mastery ?? 0),
    });
  }

  // Select REVIEW topics - highest review priority
  // Priority = (100 - mastery) * daysSinceLastPractice
  const reviewCandidates = topics
    .filter((t) => {
      const m = masteryMap.get(t.id);
      return m && m.timesPracticed > 0 && m.mastery < 90;
    })
    .map((t) => {
      const m = masteryMap.get(t.id)!;
      const daysSince = m.lastPracticedAt
        ? Math.max(1, (now.getTime() - m.lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      return {
        topic: t,
        reason: 'review' as const,
        priority: (100 - m.mastery) * daysSince,
      };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, reviewCount);

  selections.push(...reviewCandidates);

  // If we don't have enough review topics, fill with more new ones
  // These fill-ins are NOT added to primaryNewTopicIds so they can be reused across days
  if (selections.length < totalQuestions) {
    const existingIds = new Set(selections.map((s) => s.topic.id));
    const extras = topics
      .filter((t) => !existingIds.has(t.id))
      .sort((a, b) => a.order - b.order)
      .slice(0, totalQuestions - selections.length);

    for (const topic of extras) {
      selections.push({
        topic,
        reason: 'new',
        priority: 50,
      });
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
