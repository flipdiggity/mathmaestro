import { TopicSelection } from '../curriculum/types';
import { getCurrentNineWeeks, getNineWeeksDateRange, getNineWeeksLabel, isSummerBreak } from '../curriculum/pacing';
import { FIGURE_KIND_HINTS, FIGURE_SCHEMA_PROMPT, EXPECTED_ANSWER_SCHEMA_PROMPT } from './figure-schema';
import { DIFFICULTY_RUBRIC, QUESTION_FORMATS, MissRecord } from '../adaptive';

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Per-topic generation context: the selection plus everything the adaptive
// engine knows that should shape today's problems.
export interface TopicGenContext {
  selection: TopicSelection;
  /** Integer difficulty most questions should hit (1-4). */
  serveLevel: number;
  /** Which practice day this is for the child on this topic (1 = first time). */
  dayNumber: number;
  /** Formats served recently for this topic — avoid repeating them. */
  recentFormats: string[];
  /** Figure signatures served recently (e.g. "coordinate-plane") — vary them. */
  recentFigures: string[];
  /** Recent wrong answers on this topic — attack the misconception again. */
  misses: MissRecord[];
  /** Exact number of questions to generate for this topic. */
  questionCount: number;
}

export interface GeneratePromptOptions {
  /** e.g. "Math 8 Accelerated (6th grade)" — names the course in the persona. */
  courseLabel?: string;
  /** One-line plan/pace context, e.g. "Summer plan: finish by Aug 12 — on pace." */
  planNote?: string;
}

// Allocate totalQuestions across selections by role weight (current-heavy),
// honoring the ≤10% maintenance cap. Largest-remainder rounding, every topic
// gets at least 1.
export function allocateQuestions(
  selections: TopicSelection[],
  totalQuestions: number
): number[] {
  const weight = (s: TopicSelection) => {
    if (s.maintenance) return 0.8;
    switch (s.reason) {
      case 'current':
      case 'new':
        return 3;
      case 'review':
        return 1.4;
      case 'preview':
        return 1;
      default:
        return 1;
    }
  };
  const weights = selections.map(weight);
  const totalW = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (w / totalW) * totalQuestions);
  const counts = raw.map((r) => Math.max(1, Math.floor(r)));
  // Maintenance cap: at most 10% of the sheet (min 1).
  const maintCap = Math.max(1, Math.floor(totalQuestions * 0.1));
  selections.forEach((s, i) => {
    if (s.maintenance) counts[i] = Math.min(counts[i], maintCap);
  });
  // Distribute the remainder to the largest fractional parts among non-capped topics.
  let used = counts.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac)
    .map((x) => x.i);
  let guard = 0;
  while (used < totalQuestions && guard < 1000) {
    for (const i of order) {
      if (used >= totalQuestions) break;
      if (selections[i].maintenance && counts[i] >= maintCap) continue;
      counts[i]++;
      used++;
    }
    guard++;
  }
  while (used > totalQuestions) {
    // Trim from the largest bucket (never below 1).
    const maxI = counts.indexOf(Math.max(...counts));
    if (counts[maxI] <= 1) break;
    counts[maxI]--;
    used--;
  }
  return counts;
}

/**
 * Build default contexts straight from selections (no adaptive state) — used
 * by smoke-test scripts and any caller without per-topic history. Difficulty
 * defaults from mastery the way the serve ladder would on day one.
 */
export function contextsFromSelections(
  selections: TopicSelection[],
  totalQuestions: number
): TopicGenContext[] {
  const counts = allocateQuestions(selections, totalQuestions);
  return selections.map((s, i) => {
    const m = s.mastery;
    const level = m == null ? 1 : m >= 85 ? 3 : m >= 60 ? 2 : 1;
    return {
      selection: s,
      serveLevel: s.maintenance ? Math.min(4, level + 1) : level,
      dayNumber: 1,
      recentFormats: [],
      recentFigures: [],
      misses: [],
      questionCount: counts[i],
    };
  });
}

// Difficulty mix line for a topic: most questions at the serve level, one
// warm-up below, one stretch above (when the count allows).
function difficultyMix(level: number, count: number): string {
  if (count <= 1) return `difficulty ${level}`;
  if (count === 2) {
    return level >= 4
      ? `one at difficulty 3, one at difficulty 4`
      : `one at difficulty ${level}, one at difficulty ${Math.min(4, level + 1)} (stretch)`;
  }
  const stretch = level < 4 ? 1 : 0;
  const warmup = level > 1 ? 1 : 0;
  const atLevel = count - stretch - warmup;
  const parts: string[] = [];
  if (warmup) parts.push(`1 at difficulty ${level - 1} (warm-up)`);
  parts.push(`${atLevel} at difficulty ${level}`);
  if (stretch) parts.push(`1 at difficulty ${Math.min(4, level + 1)} (stretch)`);
  return parts.join(', ');
}

export function buildGeneratePrompt(
  childName: string,
  gradeLevel: number,
  contexts: TopicGenContext[],
  totalQuestions: number,
  previousQuestions?: string[],
  opts: GeneratePromptOptions = {}
): { system: string; prompt: string } {
  const summer = isSummerBreak();
  let periodLine: string;
  if (summer) {
    periodLine = opts.planNote
      ? `Summer session. ${opts.planNote}`
      : 'Summer session — building mastery before the school year starts.';
  } else {
    const currentNW = getCurrentNineWeeks();
    const { start, end } = getNineWeeksDateRange(currentNW);
    periodLine = `Current period: ${getNineWeeksLabel(currentNW)} (${formatDate(start)} – ${formatDate(end)})${opts.planNote ? `. ${opts.planNote}` : ''}`;
  }

  function tag(s: TopicSelection): string {
    if (s.reason === 'preview') return 'PREVIEW';
    if (s.reason === 'review') return s.maintenance ? 'REVIEW (mastered — spaced refresher)' : 'REVIEW';
    return 'CURRENT';
  }

  function describeTopic(c: TopicGenContext, i: number): string {
    const s = c.selection;
    const kind = s.topic.imageType ?? 'coordinate-plane';
    const lines: string[] = [];
    lines.push(
      `${i + 1}. [${tag(s)}] ${s.topic.name} (${s.topic.tpiCode}) — ${s.topic.description}`
    );
    lines.push(
      `   GENERATE ${c.questionCount} question${c.questionCount === 1 ? '' : 's'}: ${difficultyMix(c.serveLevel, c.questionCount)}. This is practice day ${c.dayNumber} on this topic for ${childName}${c.dayNumber > 1 ? ' — problems must be clearly HARDER and structurally DIFFERENT than earlier days' : ''}.`
    );
    if (s.topic.requiresImage) {
      lines.push(
        `   FIGURES: at least ${Math.max(1, Math.ceil(c.questionCount / 2))} of these questions must include a "figure" payload (${FIGURE_KIND_HINTS[kind] ?? `figure.kind "${kind}"`}). Vary the figure between questions — different orientations, ranges, and values.`
      );
    }
    if (c.recentFormats.length > 0) {
      const avoid = Array.from(new Set(c.recentFormats)).slice(0, 4);
      const fresh = QUESTION_FORMATS.filter((f) => !avoid.includes(f)).slice(0, 5);
      lines.push(
        `   FORMAT ROTATION: recent sheets used [${avoid.join(', ')}] for this topic — today prefer [${fresh.join(', ')}].`
      );
    }
    if (c.recentFigures.length > 0) {
      lines.push(
        `   FIGURE ROTATION: recently drawn: ${Array.from(new Set(c.recentFigures)).slice(0, 4).join(', ')} — use different figure kinds/parameters today.`
      );
    }
    if (c.misses.length > 0) {
      const m = c.misses[0];
      lines.push(
        `   MISSED LAST TIME: "${m.q}" — ${childName} answered "${m.a}"${m.fb ? ` (${m.fb})` : ''}. Include 1 problem that attacks the SAME misconception with fresh numbers/context.`
      );
    }
    lines.push(
      `   Skill examples (illustrate the SKILL ONLY — invent fresh numbers/contexts, do NOT copy): ${s.topic.sampleProblems.slice(0, 2).join('; ')}`
    );
    return lines.join('\n');
  }

  const topicDescriptions = contexts.map(describeTopic).join('\n');
  const courseLine = opts.courseLabel
    ? `${childName} is working through ${opts.courseLabel} in Eanes ISD, Austin TX.`
    : `${childName} is a grade ${gradeLevel} student in Eanes ISD, Austin TX.`;

  const anyFigureTopics = contexts.some((c) => c.selection.topic.requiresImage);
  const visualShare = anyFigureTopics ? Math.ceil(totalQuestions * 0.3) : Math.ceil(totalQuestions * 0.15);

  const system = `You are an expert math teacher creating a personalized worksheet for ${childName}. ${courseLine} You create clear, age-appropriate problems aligned to Texas TEKS standards, printed on paper and solved by hand.

${periodLine}

${DIFFICULTY_RUBRIC}

Every topic below states EXACTLY how many questions to generate and at which difficulty. FOLLOW THE COUNTS AND LEVELS — they encode what ${childName} is ready for. Difficulty 4 problems should genuinely challenge a strong student (multi-skill synthesis, backwards reasoning, error analysis), never just bigger numbers.

QUESTION FORMATS — set each question's "format" field to exactly one of:
${QUESTION_FORMATS.map((f) => `- "${f}"`).join('\n')}
Variety is a hard requirement: use at least 5 different formats across the sheet, never the same format for adjacent questions on the same topic, and honor each topic's FORMAT ROTATION note. Two problems on the same skill must differ in STRUCTURE (table vs graph vs verbal vs backwards), not just numbers.

VISUAL PROBLEMS: kids understand better when they can SEE the math. Include real figures (the "figure" field) on at least ${visualShare} of the ${totalQuestions} questions — every figure-required topic per its note, plus tape-diagrams/tables/number-lines wherever they genuinely help on word problems. Vary every figure: different angle measures AND rotations, different ranges, different orientations. Never emit two visually similar figures on one sheet.

CRITICAL RULES:
- Generate exactly ${totalQuestions} problems total, matching each topic's stated count.
- STRICT LEVEL: Only concepts from the topic descriptions below. Difficulty comes from DEPTH on the same skill (more steps, harder reasoning, awkward numbers), NEVER from importing higher-grade concepts.
- VERIFY EVERY ANSWER: compute each answer step by step before writing it. Wrong answers are unacceptable.
- Each problem must have exactly ONE correct answer (except "multi-part", whose parts each have one answer — put both in "answer" like "a) 12 b) 30").
- ANSWER SPREAD: answers must not cluster (not several problems answering 12, not every slope equal to 3). Scan your answers before finalizing and rework repeats.
- Number problems sequentially (1, 2, 3, ...).
- No multiple choice. Free response only.
- Use ASCII math operators in all text: >= <= != ; write "pi", "sqrt", "x" for multiply, "deg" for degrees.
- Group questions: [CURRENT] first, then [REVIEW], then [PREVIEW]. Set "section" to "review" for REVIEW questions, otherwise "new".
${FIGURE_SCHEMA_PROMPT}
${EXPECTED_ANSWER_SCHEMA_PROMPT}`;

  const prompt = `Create a math worksheet with exactly ${totalQuestions} problems from these topics:

${topicDescriptions}

FRESHNESS: invent new numbers, contexts, and phrasings every time. Do not open the sheet the same way as previous sheets. Rotate real-world contexts widely (sports, cooking, gaming, building, money, travel, science) — do not reuse a context twice on one sheet.${previousQuestions && previousQuestions.length > 0 ? `

DO NOT REPEAT these recent questions (different numbers, contexts, structures AND formats required):
${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ''}

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "title": "A short title naming the main topics (e.g. 'Slope & Linear Equations'). Do NOT include day numbers, 'Day 2', 'Practice Day', dates, or the child's name.",
  "questions": [
    {
      "number": 1,
      "question": "The full problem text (no graph/diagram descriptions — use the figure field)",
      "answer": "The correct answer (number, fraction, or short text)",
      "topicId": "the topic ID from above",
      "topicName": "the topic name",
      "difficulty": 1,
      "format": "word-problem",
      "isVerifiable": true,
      "section": "new",
      "figure": null,
      "expectedAnswer": null
    }
  ]
}

For "figure": include a structured figure object (see FIGURES) when the problem needs a diagram; otherwise null.
For "expectedAnswer": include a structured expected-answer object (see EXPECTED ANSWER) whenever the answer can be described structurally; otherwise null.
Set isVerifiable true for numeric/fraction answers, false for open-ended reasoning.`;

  return { system, prompt };
}