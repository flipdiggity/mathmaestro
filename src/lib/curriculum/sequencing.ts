// ─────────────────────────────────────────────────────────────────────────────
// Sequential curriculum progression.
//
// Worksheets walk the curriculum IN ORDER — focus on the next few topics the
// student hasn't finished yet (the "frontier"), with review of earlier weak or
// unverified spots and a small preview of what's next.
//
// THE ADVANCE RULE (the core fix for the frozen-curriculum bug): a topic is
// advanced past when EITHER
//   • grading shows mastery (mastery >= 80, includes parent "skip" marks), OR
//   • it has been SERVED on enough worksheets (servesToAdvance, pace-derived)
//     without graded evidence of weakness (graded < 60 holds it in place).
// Previously only graded mastery advanced the frontier — and since almost no
// sheets were photo-graded, the same four topics repeated for weeks at
// difficulty 1-2. Exposure now moves the curriculum forward on schedule, and
// topics that advanced ungraded cycle back later as "unverified review".
//
// The global sequence is the pool sorted by (gradeLevel, order). `order` is the
// teaching sequence within a grade, so e.g. accelerated 7th→8th progresses
// grade-7 (order 1..47) then grade-8 (order 1..35).
// ─────────────────────────────────────────────────────────────────────────────

import { CurriculumTopic, TopicSelection } from './types';
import { DEFAULT_SERVES_TO_ADVANCE } from '../plan';

const MASTERED = 80; // mastery >= this → frontier advances past it (and it becomes "maintenance" review material)

export interface SeqMastery {
  mastery: number;
  lastPracticedAt: Date | null;
  timesPracticed: number;   // graded events only
  timesServed?: number;     // generated-sheet appearances (ungraded exposure)
  servesSinceGrade?: number;
  lastServedAt?: Date | null;
}

// Where in the curriculum a child should START. Keyed by lowercased name; the
// default is the beginning of their base grade. (Legacy personal-mode hack —
// superseded by course presets in curriculum/courses.ts; kept as a fallback
// for children without a courseId.)
export interface StartFloor {
  grade: number;
  fromOrder: number;
}
const START_FLOORS: Record<string, StartFloor> = {
  eliana: { grade: 7, fromOrder: 17 },
};

export function getStartFloor(childName: string, baseGrade: number): StartFloor {
  // Name-keyed floors are a personal-mode convenience for the seeded kids.
  // In saas mode a customer's child who happens to share the name must NOT
  // inherit them — placement comes from the diagnostic instead.
  if (process.env.NEXT_PUBLIC_APP_MODE === 'saas') {
    return { grade: baseGrade, fromOrder: 1 };
  }
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
// (e.g. ~4 current topics × ~5 questions each for a 25-question worksheet).
// `numCurrentOverride` comes from the study plan's pace when one is set.
export function seqCountsFor(
  totalQuestions: number,
  pacing: 'accelerating' | 'steady' | 'reinforcing',
  numCurrentOverride?: number | null
): SeqCounts {
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
  let numCurrent = numCurrentOverride ?? clamp(Math.round(totalQuestions / 8), 2, 6);
  let numReview = clamp(Math.round(totalQuestions / 15), 1, 3);
  let numPreview = 1;
  if (pacing === 'accelerating') {
    numPreview += 1;
    numReview = Math.max(1, numReview - 1);
  } else if (pacing === 'reinforcing') {
    numReview += 1;
    numPreview = 0;
    if (numCurrentOverride == null) numCurrent = Math.max(2, numCurrent - 1);
  }
  return { numCurrent, numReview, numPreview };
}

export interface SelectSequentialResult {
  selections: TopicSelection[];
  primaryNewTopicIds: string[];
}

/**
 * Pure topic selection over an ordered sequence. No I/O — `mastery` is a map of
 * topicId → record. Returns the frontier window (current), a few review topics
 * (weak, unverified, or spaced-maintenance), and a small preview.
 */
export function selectSequential(
  seq: CurriculumTopic[],
  mastery: Map<string, SeqMastery>,
  opts: {
    floorIndex: number;
    counts: SeqCounts;
    excludeIds?: Set<string>;
    now?: Date;
    /**
     * How many worksheet appearances advance a topic past the frontier when
     * there's no graded evidence. Pace-derived (see plan.ts). Batch generation
     * passes Infinity so windowOffset alone drives within-batch progression.
     */
    servesToAdvance?: number;
    /**
     * Slide the CURRENT window forward by this many unadvanced topics.
     * Used for multi-day batches: day N passes windowOffset = N so the week
     * advances gradually (one new topic per day, heavy overlap for real
     * practice) instead of leaping a whole window per day.
     */
    windowOffset?: number;
  }
): SelectSequentialResult {
  const now = opts.now ?? new Date();
  const { floorIndex, counts, excludeIds } = opts;
  const windowOffset = Math.max(0, opts.windowOffset ?? 0);
  const servesToAdvance = opts.servesToAdvance ?? DEFAULT_SERVES_TO_ADVANCE;

  const rec = (t: CurriculumTopic) => mastery.get(t.id);
  // Graded evidence exists (photo-graded, or parent-marked known which sets mastery=100).
  const hasGrades = (t: CurriculumTopic) => {
    const m = rec(t);
    return !!m && (m.timesPracticed > 0 || m.mastery > 0);
  };
  // THE ADVANCE RULE — a topic is finished (frontier moves past it) ONLY when
  // there is EVIDENCE it's mastered: a photo-graded score >= 80, or a parent
  // "I already know this" skip-mark (which sets mastery = 100). Serving a topic
  // on worksheets NEVER advances it on its own.
  //
  // This is the fix for the "raced through the whole curriculum in two weeks"
  // bug: the old rule advanced a topic after 2-3 ungraded exposures, so a kid
  // who wasn't photo-grading marched ~2.5 topics/day into material they'd never
  // learned. Now, without grading, the frontier holds at the current window and
  // the same topics are re-practiced (getting harder each day via difficulty
  // escalation) until they're graded — you "master before you move on", and
  // skipping a week for vacation can't skip you ahead. (Keep in sync with
  // plan.topicAdvanced.)
  void servesToAdvance;
  const isAdvanced = (t: CurriculumTopic) => (rec(t)?.mastery ?? -1) >= MASTERED;

  // Frontier = first not-yet-advanced topic at or after the start floor.
  let frontier = floorIndex;
  while (frontier < seq.length && isAdvanced(seq[frontier])) frontier++;

  // CURRENT — the next `numCurrent` unadvanced topics, in order, starting
  // `windowOffset` unadvanced topics past the frontier (0 for a single sheet).
  const current: CurriculumTopic[] = [];
  let i = frontier;
  let skipped = 0;
  for (; i < seq.length && current.length < counts.numCurrent; i++) {
    const t = seq[i];
    if (isAdvanced(t) || excludeIds?.has(t.id)) continue;
    if (skipped < windowOffset) {
      skipped++;
      continue;
    }
    current.push(t);
  }
  const usedIds = new Set(current.map((t) => t.id));

  // PREVIEW — the next unadvanced topics just past the current window.
  const preview: CurriculumTopic[] = [];
  for (; i < seq.length && preview.length < counts.numPreview; i++) {
    const t = seq[i];
    if (isAdvanced(t) || excludeIds?.has(t.id) || usedIds.has(t.id)) continue;
    preview.push(t);
    usedIds.add(t.id);
  }

  // REVIEW — two flavors:
  //   • remediation: GRADED-weak topics (incl. earlier-grade gaps), weighted by
  //     how weak + how long since practice → comes back EASIER.
  //   • maintenance (spaced repetition): a GRADED-MASTERED topic not seen in a
  //     while, resurfaced at EXPANDING intervals (1→2→4→8→16→30 days) for
  //     retention, then RETIRED once rock-solid (>=95%, 4+ practices). Comes
  //     back harder. Parent-marked "skip" topics (mastery=100, timesPracticed=0)
  //     are never resurfaced. This is the spaced-repetition layer — it only has
  //     material to work with once topics have been graded to mastery.
  // Reserve one slot for maintenance when there are >=2 review slots.
  const daysSince = (t: CurriculumTopic) => {
    const m = rec(t)!;
    const last = m.lastPracticedAt ?? m.lastServedAt;
    return last
      ? Math.max(1, (now.getTime() - new Date(last).getTime()) / 86_400_000)
      : 30;
  };
  // Expanding spaced-review interval: each correct review pushes the next one
  // further out, so a topic seen right repeatedly is shown less and less.
  const maintInterval = (tp: number) => Math.min(30, 2 ** Math.max(0, tp - 1)); // 1d,2d,4d,8d,16d,30d

  const candidates = seq.filter((t) => rec(t) && !usedIds.has(t.id));
  const weak = candidates
    .filter((t) => hasGrades(t) && rec(t)!.mastery < MASTERED)
    .map((t) => ({ topic: t, priority: (100 - rec(t)!.mastery) * daysSince(t), maintenance: false }))
    .sort((a, b) => b.priority - a.priority);
  const strong = candidates
    .filter((t) => {
      const m = rec(t)!;
      const tp = m.timesPracticed ?? 0;
      if (m.mastery < MASTERED || tp <= 0) return false; // unmastered or manually-skipped → never here
      if (m.mastery >= 95 && tp >= 4) return false; // rock solid → stop showing it altogether
      return daysSince(t) >= maintInterval(tp); // only when the spaced interval has elapsed
    })
    .map((t) => ({ topic: t, priority: daysSince(t), maintenance: true }))
    .sort((a, b) => b.priority - a.priority);

  // At most ONE maintenance (mastered) topic per sheet, so spaced review stays a
  // small slice; the generation prompt further caps it to <=10% of questions.
  const wantMaintenance = counts.numReview >= 2 && strong.length > 0 ? 1 : 0;
  const review: { topic: (typeof seq)[number]; priority: number; maintenance: boolean }[] = [];
  const pushUnique = (r: { topic: CurriculumTopic; priority: number; maintenance: boolean }) => {
    if (review.length >= counts.numReview) return;
    if (!review.some((x) => x.topic.id === r.topic.id)) review.push(r);
  };
  for (const r of weak) {
    if (review.length >= counts.numReview - wantMaintenance) break;
    pushUnique(r);
  }
  for (const r of strong) {
    if (review.length >= counts.numReview) break;
    pushUnique(r);
  }
  // Backfill any unused slots with more weak (graded-remediation) topics.
  for (const r of weak) pushUnique(r);

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
      priority: 100 - (rec(topic)?.mastery ?? 0),
      mastery: rec(topic)?.mastery,
    });
  }
  for (const { topic, priority, maintenance } of review) {
    selections.push({ topic, reason: 'review', priority, mastery: rec(topic)?.mastery, maintenance });
  }
  for (const topic of preview) {
    selections.push({ topic, reason: 'preview', priority: 30, mastery: rec(topic)?.mastery });
  }

  return { selections, primaryNewTopicIds: current.map((t) => t.id) };
}
