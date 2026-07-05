// ─────────────────────────────────────────────────────────────────────────────
// Adaptive difficulty + variety engine.
//
// The old system only adapted when a sheet was photo-graded — and in practice
// almost none were (6 of 129), so the frontier froze, difficulty never rose
// above 2, and the same four topics repeated for weeks. This module makes the
// engine adapt on BOTH signals:
//
//   • SERVES  — every generated worksheet records, per topic: timesServed,
//     servesSinceGrade, the question FORMATS used, and the FIGURE kinds used.
//     Repeat exposure escalates difficulty (+0.5/serve) and rotates formats
//     even with zero grading. After enough serves a topic "advances" so the
//     curriculum keeps moving (see sequencing.ts).
//
//   • GRADES  — photo grading updates the per-topic difficulty LADDER (1..4):
//     ≥85% at the served level → move up a level; <60% → move down. Wrong
//     answers are stored as MISS records that the next sheet re-attacks with
//     fresh numbers.
//
// Difficulty scale (superset of the old 1-3):
//   1 Foundation  — one-step, friendly numbers, direct skill application
//   2 On-level    — two-step, real grade-level numbers, light word problems
//   3 Rigorous    — multi-step, awkward numbers, mixed representations
//   4 Challenge   — synthesis of skills, backwards reasoning, error analysis
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from './db';
import { CurriculumTopic } from './curriculum/types';

export const DIFFICULTY_RUBRIC = `DIFFICULTY LEVELS (set each question's "difficulty" to 1, 2, 3, or 4):
1 = Foundation: one step, friendly numbers, direct application of the skill.
2 = On-level: two steps, true grade-level numbers (fractions/decimals/negatives where the topic calls for them), light word problems.
3 = Rigorous: multi-step, awkward numbers, mixed representations (table/graph/verbal), student must organize their work.
4 = Challenge: combines 2+ skills, works backwards from an answer, finds an error in shown work, or requires justifying reasoning — placement-test / math-competition flavor.`;

// Question formats the generator can use. Stored per question and remembered
// per topic so the same template can't repeat day after day.
export const QUESTION_FORMATS = [
  'computation',      // pure numeric practice
  'word-problem',     // real-world context
  'visual',           // must read a provided figure/diagram
  'draw',             // student plots/draws/shades on a provided blank figure
  'table',            // read or complete a table
  'error-analysis',   // shown work contains a mistake; find and fix it
  'compare',          // compare / order / classify
  'missing-value',    // find the unknown part, working backwards
  'multi-part',       // (a)/(b) two-part question
  'explain',          // short written justification
] as const;
export type QuestionFormat = (typeof QUESTION_FORMATS)[number];

export interface MissRecord {
  q: string;   // question text
  a: string;   // what the student answered
  fb?: string; // grader feedback
  d?: string;  // ISO date graded
}

export interface AdaptiveTopicState {
  topicId: string;
  mastery: number;
  timesPracticed: number;      // graded events
  timesServed: number;         // generated-sheet appearances
  servesSinceGrade: number;
  difficultyLevel: number;     // graded ladder base 1..4
  lastPracticedAt: Date | null;
  lastServedAt: Date | null;
  recentFormats: string[];     // newest first
  recentFigures: string[];     // figure kind signatures, newest first
  misses: MissRecord[];        // newest first
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

function parseJsonArray<T>(json: string | null | undefined): T[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

/** Load adaptive state for every topic the child has rows for (pool-filtered). */
export async function loadAdaptiveStates(
  childId: string,
  poolIds?: Set<string>
): Promise<Map<string, AdaptiveTopicState>> {
  const rows = await prisma.topicMastery.findMany({ where: { childId } });
  const map = new Map<string, AdaptiveTopicState>();
  for (const r of rows) {
    if (poolIds && !poolIds.has(r.topicId)) continue;
    map.set(r.topicId, {
      topicId: r.topicId,
      mastery: r.mastery,
      timesPracticed: r.timesPracticed,
      timesServed: r.timesServed ?? 0,
      servesSinceGrade: r.servesSinceGrade ?? 0,
      difficultyLevel: r.difficultyLevel ?? 1,
      lastPracticedAt: r.lastPracticedAt,
      lastServedAt: r.lastServedAt ?? null,
      recentFormats: parseJsonArray<string>(r.formatsJson),
      recentFigures: parseJsonArray<string>(r.figuresJson),
      misses: parseJsonArray<MissRecord>(r.missesJson),
    });
  }
  return map;
}

/**
 * The difficulty a topic should be SERVED at today: graded ladder base plus a
 * +0.5-per-repeat-serve escalation, so problems get harder across consecutive
 * practice days even when nothing has been photo-graded yet.
 */
export function effectiveDifficulty(
  state: AdaptiveTopicState | undefined,
  topic?: Pick<CurriculumTopic, 'difficulty'>
): number {
  if (!state || (state.timesServed === 0 && state.timesPracticed === 0)) {
    // Brand-new topic: intro day. Intrinsically harder topics start at 1.5.
    return (topic?.difficulty ?? 1) >= 3 ? 1.5 : 1;
  }
  const serveBump = 0.5 * clamp(state.servesSinceGrade, 0, 4);
  // Without graded evidence we cap at 3; graded strength unlocks Challenge (4),
  // graded weakness caps low until the child recovers.
  let cap = 3;
  if (state.timesPracticed > 0) {
    cap = state.mastery >= 85 ? 4 : state.mastery >= 60 ? 3.5 : 2.5;
  }
  return clamp(round1(state.difficultyLevel + serveBump), 1, cap);
}

/** Integer serve level (what the prompt asks for most questions to be). */
export function serveLevel(state: AdaptiveTopicState | undefined, topic?: Pick<CurriculumTopic, 'difficulty'>): number {
  return clamp(Math.round(effectiveDifficulty(state, topic)), 1, 4);
}

export interface ServeRecord {
  topic: CurriculumTopic;
  formats: string[];     // formats used for this topic on the generated sheet
  figureKinds: string[]; // figure kinds used for this topic
}

const KEEP_FORMATS = 8;
const KEEP_FIGURES = 8;
const KEEP_MISSES = 4;

/**
 * Record that a worksheet containing these topics was generated. Creates the
 * TopicMastery row if needed WITHOUT marking it practiced (timesPracticed stays
 * 0 — grading is the only thing that sets mastery evidence).
 */
export async function recordServes(childId: string, serves: ServeRecord[]): Promise<void> {
  const now = new Date();
  for (const s of serves) {
    const existing = await prisma.topicMastery.findUnique({
      where: { childId_topicId: { childId, topicId: s.topic.id } },
    });
    const formats = [
      ...s.formats,
      ...parseJsonArray<string>(existing?.formatsJson),
    ].slice(0, KEEP_FORMATS);
    const figures = [
      ...s.figureKinds,
      ...parseJsonArray<string>(existing?.figuresJson),
    ].slice(0, KEEP_FIGURES);

    await prisma.topicMastery.upsert({
      where: { childId_topicId: { childId, topicId: s.topic.id } },
      update: {
        timesServed: { increment: 1 },
        servesSinceGrade: { increment: 1 },
        lastServedAt: now,
        formatsJson: JSON.stringify(formats),
        figuresJson: JSON.stringify(figures),
      },
      create: {
        childId,
        topicId: s.topic.id,
        topicName: s.topic.name,
        gradeLevel: s.topic.gradeLevel,
        mastery: 0,
        timesPracticed: 0,
        timesServed: 1,
        servesSinceGrade: 1,
        lastServedAt: now,
        difficultyLevel: 1,
        formatsJson: JSON.stringify(formats),
        figuresJson: JSON.stringify(figures),
      },
    });
  }
}

export interface GradedQuestionOutcome {
  difficulty: number;
  isCorrect: boolean;
  question: string;
  studentAnswer: string;
  feedback?: string;
}

/**
 * Update the difficulty ladder + miss memory for one topic after grading.
 * (Mastery EMA itself is handled by updateMastery in spaced-repetition.ts —
 * this handles the adaptive fields on top of it.)
 */
export async function updateAfterGrade(
  childId: string,
  topicId: string,
  outcomes: GradedQuestionOutcome[]
): Promise<void> {
  if (outcomes.length === 0) return;
  const existing = await prisma.topicMastery.findUnique({
    where: { childId_topicId: { childId, topicId } },
  });
  if (!existing) return; // grading an orphaned/legacy topic — nothing to adapt

  const total = outcomes.length;
  const correct = outcomes.filter((o) => o.isCorrect).length;
  const acc = correct / total;
  const servedLevel = clamp(
    Math.round(outcomes.reduce((a, o) => a + (o.difficulty || 1), 0) / total),
    1,
    4
  );
  const current = existing.difficultyLevel ?? 1;

  let newLevel: number;
  if (acc >= 0.85) {
    newLevel = clamp(Math.max(current, servedLevel) + 1, 1, 4);
  } else if (acc >= 0.6) {
    newLevel = clamp(Math.max(current, servedLevel), 1, 4);
  } else {
    newLevel = clamp(servedLevel - 1, 1, 4);
  }

  const newMisses: MissRecord[] = outcomes
    .filter((o) => !o.isCorrect)
    .map((o) => ({
      q: o.question.slice(0, 220),
      a: (o.studentAnswer || 'blank').slice(0, 80),
      fb: o.feedback?.slice(0, 160),
      d: new Date().toISOString().slice(0, 10),
    }));
  const misses = [...newMisses, ...parseJsonArray<MissRecord>(existing.missesJson)].slice(
    0,
    KEEP_MISSES
  );

  await prisma.topicMastery.update({
    where: { childId_topicId: { childId, topicId } },
    data: {
      difficultyLevel: newLevel,
      servesSinceGrade: 0,
      missesJson: JSON.stringify(misses),
    },
  });
}
