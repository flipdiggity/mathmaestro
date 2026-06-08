// ─────────────────────────────────────────────────────────────────────────────
// Sequential curriculum progression.
//
// Worksheets should walk the curriculum IN ORDER — focus on the next few topics
// the student hasn't mastered yet (the "frontier"), with light review of earlier
// weak spots and a small peek at what's next. They should NOT scatter across the
// whole year (real numbers + geometry + stats on one sheet).
//
// The global sequence is the pool sorted by (gradeLevel, order). `order` is the
// teaching sequence within a grade, so e.g. accelerated 7th→8th progresses
// grade-7 (order 1..47) then grade-8 (order 1..35).
// ─────────────────────────────────────────────────────────────────────────────

import { CurriculumTopic, TopicSelection } from './types';

const MASTERED = 80;     // mastery >= this → frontier advances past it (and is "maintenance" review material)

export interface SeqMastery {
  mastery: number;
  lastPracticedAt: Date | null;
  timesPracticed: number;
}

// Where in the curriculum a child should START. Keyed by lowercased name; the
// default is the beginning of their base grade. Eliana placed into mid-7 via her
// exam, so she begins in the second half of 7th grade (order 17 = Linear
// Relationships); everything before that becomes light review, not new teaching.
export interface StartFloor {
  grade: number;
  fromOrder: number;
}
const START_FLOORS: Record<string, StartFloor> = {
  eliana: { grade: 7, fromOrder: 17 },
};

export function getStartFloor(childName: string, baseGrade: number): StartFloor {
  return START_FLOORS[childName.trim().toLowerCase()] ?? { grade: baseGrade, fromOrder: 1 };
}

// Global teaching sequence for the pool.
export function orderedSequence(topics: CurriculumTopic[]): CurriculumTopic[] {
  return [...topics].sort((a, b) => a.gradeLevel - b.gradeLevel || a.order - b.order);
}

export function floorIndexFor(seq: CurriculumTopic[], floor: StartFloor): number {
  const idx = seq.findIndex((t) => t.gradeLevel === floor.grade && t.order >= floor.fromOrder);
  return idx < 0 ? 0 : idx;
}

export interface SeqCounts {
  numCurrent: number;
  numReview: number;
  numPreview: number;
}

// Topic-count budget. Few topics per sheet so questions build on each other
// (e.g. ~4 current topics × ~5 questions each for a 30-question worksheet).
export function seqCountsFor(totalQuestions: number, pacing: 'accelerating' | 'steady' | 'reinforcing'): SeqCounts {
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
  let numCurrent = clamp(Math.round(totalQuestions / 8), 2, 6);
  let numReview = clamp(Math.round(totalQuestions / 15), 1, 3);
  let numPreview = 1;
  if (pacing === 'accelerating') {
    numPreview += 1;
    numReview = Math.max(1, numReview - 1);
  } else if (pacing === 'reinforcing') {
    numReview += 1;
    numPreview = 0;
    numCurrent = Math.max(2, numCurrent - 1);
  }
  return { numCurrent, numReview, numPreview };
}

export interface SelectSequentialResult {
  selections: TopicSelection[];
  primaryNewTopicIds: string[];
}

/**
 * Pure topic selection over an ordered sequence. No I/O — `mastery` is a map of
 * topicId → record. Returns the frontier window (current), a few weak-topic
 * reviews, and a small preview, all kept local to the curriculum front.
 */
export function selectSequential(
  seq: CurriculumTopic[],
  mastery: Map<string, SeqMastery>,
  opts: {
    floorIndex: number;
    counts: SeqCounts;
    excludeIds?: Set<string>;
    now?: Date;
  }
): SelectSequentialResult {
  const now = opts.now ?? new Date();
  const { floorIndex, counts, excludeIds } = opts;
  const isMastered = (t: CurriculumTopic) => (mastery.get(t.id)?.mastery ?? -1) >= MASTERED;
  const isPracticed = (t: CurriculumTopic) => mastery.has(t.id);

  // Frontier = first not-yet-mastered topic at or after the start floor.
  let frontier = floorIndex;
  while (frontier < seq.length && isMastered(seq[frontier])) frontier++;

  // CURRENT — the next `numCurrent` unmastered topics, in order.
  const current: CurriculumTopic[] = [];
  let i = frontier;
  for (; i < seq.length && current.length < counts.numCurrent; i++) {
    const t = seq[i];
    if (isMastered(t) || excludeIds?.has(t.id)) continue;
    current.push(t);
  }
  const usedIds = new Set(current.map((t) => t.id));

  // PREVIEW — the next unmastered topics just past the current window.
  const preview: CurriculumTopic[] = [];
  for (; i < seq.length && preview.length < counts.numPreview; i++) {
    const t = seq[i];
    if (isMastered(t) || excludeIds?.has(t.id) || usedIds.has(t.id)) continue;
    preview.push(t);
    usedIds.add(t.id);
  }

  // REVIEW — two flavors:
  //   • remediation: practiced-but-WEAK topics (incl. earlier-grade gaps),
  //     weighted by how weak + how long since practice → comes back EASIER.
  //   • maintenance: a GRADED-MASTERED topic that hasn't been seen in a while,
  //     for spaced retention → comes back HARDER (per the difficulty directive).
  //     Topics the parent manually marked "known/skip" (timesPracticed === 0)
  //     are NEVER resurfaced — "skip" means gone.
  // Reserve one slot for maintenance when there are >=2 review slots.
  const daysSince = (id: string) => {
    const m = mastery.get(id)!;
    return m.lastPracticedAt
      ? Math.max(1, (now.getTime() - new Date(m.lastPracticedAt).getTime()) / 86_400_000)
      : 30;
  };
  // Expanding spaced-review interval: each correct review pushes the next one
  // further out, so a topic seen right repeatedly is shown less and less.
  const maintInterval = (tp: number) => Math.min(30, 2 ** Math.max(0, tp - 1)); // 1d,2d,4d,8d,16d,30d
  const candidates = seq.filter((t) => isPracticed(t) && !usedIds.has(t.id));
  const weak = candidates
    .filter((t) => mastery.get(t.id)!.mastery < MASTERED)
    .map((t) => ({ topic: t, priority: (100 - mastery.get(t.id)!.mastery) * daysSince(t.id), maintenance: false }))
    .sort((a, b) => b.priority - a.priority);
  const strong = candidates
    .filter((t) => {
      const m = mastery.get(t.id)!;
      const tp = m.timesPracticed ?? 0;
      if (m.mastery < MASTERED || tp <= 0) return false; // unmastered or manually-skipped → never here
      if (m.mastery >= 95 && tp >= 4) return false; // rock solid → stop showing it altogether
      return daysSince(t.id) >= maintInterval(tp); // only when the spaced interval has elapsed
    })
    .map((t) => ({ topic: t, priority: daysSince(t.id), maintenance: true }))
    .sort((a, b) => b.priority - a.priority);

  // At most ONE maintenance (mastered) topic per sheet, so spaced review stays a
  // small slice; the generation prompt further caps it to <=10% of questions.
  const wantMaintenance = counts.numReview >= 2 && strong.length > 0 ? 1 : 0;
  const review: { topic: typeof seq[number]; priority: number; maintenance: boolean }[] = [];
  for (const r of weak) {
    if (review.length >= counts.numReview - wantMaintenance) break;
    review.push(r);
  }
  for (const r of strong) {
    if (review.length >= counts.numReview) break;
    review.push(r);
  }
  // Backfill unused slots with more WEAK topics only (not extra maintenance).
  for (const r of weak) {
    if (review.length >= counts.numReview) break;
    if (!review.some((x) => x.topic.id === r.topic.id)) review.push(r);
  }

  // Fallback: curriculum finished (no current topics) → reinforce the last few.
  if (current.length === 0 && review.length === 0 && seq.length > 0) {
    const tail = seq.slice(Math.max(0, seq.length - counts.numCurrent));
    for (const t of tail) current.push(t);
  }

  const selections: TopicSelection[] = [];
  for (const topic of current) {
    selections.push({
      topic,
      reason: 'current',
      priority: 100 - (mastery.get(topic.id)?.mastery ?? 0),
      mastery: mastery.get(topic.id)?.mastery,
    });
  }
  for (const { topic, priority, maintenance } of review) {
    selections.push({ topic, reason: 'review', priority, mastery: mastery.get(topic.id)?.mastery, maintenance });
  }
  for (const topic of preview) {
    selections.push({ topic, reason: 'preview', priority: 30, mastery: mastery.get(topic.id)?.mastery });
  }

  return { selections, primaryNewTopicIds: current.map((t) => t.id) };
}
