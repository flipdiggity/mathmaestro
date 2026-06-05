import { TopicSelection } from '../curriculum/types';
import { getCurrentNineWeeks, getNineWeeksDateRange, getNineWeeksLabel } from '../curriculum/pacing';
import { FIGURE_KIND_HINTS, FIGURE_SCHEMA_PROMPT, EXPECTED_ANSWER_SCHEMA_PROMPT } from './figure-schema';

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Per-topic difficulty target based on the student's current mastery. The same
// skill gets HARDER once they've shown mastery (extension/multi-step) and EASIER
// when they're weak (scaffolded), so they move through quickly on strengths and
// get support on gaps.
function difficultyDirective(s: TopicSelection): string {
  const m = s.mastery;
  if (m == null) return 'TARGET: new topic — start accessible (difficulty 1-2) and build understanding';
  if (m >= 85) return `TARGET: MASTERED (~${Math.round(m)}%) — make these CHALLENGING (difficulty 3): multi-step, larger/uglier numbers, or an extension/application of the same skill`;
  if (m >= 60) return `TARGET: developing (~${Math.round(m)}%) — mostly difficulty 2 with one stretch problem`;
  return `TARGET: needs work (~${Math.round(m)}%) — keep difficulty 1-2, scaffolded and confidence-building`;
}

export function buildGeneratePrompt(
  childName: string,
  gradeLevel: number,
  selections: TopicSelection[],
  totalQuestions: number,
  previousQuestions?: string[]
): { system: string; prompt: string } {
  const currentNW = getCurrentNineWeeks();
  const { start, end } = getNineWeeksDateRange(currentNW);
  const nwLabel = getNineWeeksLabel(currentNW);

  // Tag topics with their calendar role
  function getCalendarTag(s: TopicSelection): string {
    if (s.reason === 'current') return 'CURRENT';
    if (s.reason === 'preview') return 'PREVIEW';
    if (s.reason === 'review') return 'REVIEW';
    // Legacy 'new' reason — treat as current
    return 'CURRENT';
  }

  function describeTopic(s: TopicSelection, i: number): string {
    const tag = getCalendarTag(s);
    const kind = s.topic.imageType ?? 'coordinate-plane';
    const imageNote = s.topic.requiresImage
      ? `\n   FIGURE REQUIRED: At least one problem for this topic must include a "figure" payload for ${FIGURE_KIND_HINTS[kind] ?? `figure.kind "${kind}"`}. Put the diagram in the figure field, never in the question text.`
      : '';
    return `${i + 1}. [${tag}] ${s.topic.name} (${s.topic.tpiCode}) - ${s.topic.description}
   Difficulty: ${s.topic.difficulty}/3 | ${difficultyDirective(s)} | Examples (illustrate the SKILL ONLY — invent fresh numbers/contexts, do NOT copy these): ${s.topic.sampleProblems.join('; ')}${imageNote}`;
  }

  const topicDescriptions = selections.map(describeTopic).join('\n');

  // Count topics by calendar role for distribution guidance
  const currentCount = selections.filter((s) => getCalendarTag(s) === 'CURRENT').length;
  const reviewCount = selections.filter((s) => getCalendarTag(s) === 'REVIEW').length;
  const previewCount = selections.filter((s) => getCalendarTag(s) === 'PREVIEW').length;

  const hasMultipleSections = (currentCount > 0 && reviewCount > 0) || previewCount > 0;
  const sectionInstruction = hasMultipleSections
    ? `\n- Group questions by section: [CURRENT] topics first, then [REVIEW], then [PREVIEW] if any
- Set the "section" field to "new" for CURRENT/PREVIEW questions and "review" for REVIEW questions`
    : '';

  const anyFigureTopics = selections.some((s) => s.topic.requiresImage);

  const system = `You are an expert math teacher creating worksheets for ${childName}, a ${gradeLevel}th grade student in Eanes ISD, Austin TX. You create clear, age-appropriate math problems aligned to Texas TEKS standards.

Current period: ${nwLabel} (${formatDate(start)} – ${formatDate(end)})
Primary focus topics for this period are marked [CURRENT].
Generate more questions for [CURRENT] topics than [REVIEW] or [PREVIEW] topics.
[PREVIEW] topics are upcoming material — keep those problems introductory.

Each topic has a TARGET difficulty based on how well ${childName} has already mastered it — FOLLOW IT. Topics they've mastered should get harder, more complex problems (same skill, pushed further); topics they're weak on should get easier, scaffolded problems. Set each question's "difficulty" field (1, 2, or 3) to match its topic's target.

CRITICAL RULES:
- Generate exactly ${totalQuestions} problems
- STRICT GRADE LEVEL: Only generate problems appropriate for grade ${gradeLevel}. Do NOT include concepts from higher grades. Stick exactly to what is described in each topic description — do not extrapolate to related but more advanced concepts.
- VERIFY EVERY ANSWER: Double-check your arithmetic for every problem. Compute the answer step by step before writing it. Wrong answers are unacceptable.
- Problems should be clearly worded and unambiguous
- Include a mix of computation and word problems
- Each problem must have exactly ONE correct answer
- For fractions, use simplified form
- For word problems, use age-appropriate contexts
- Number problems sequentially (1, 2, 3, ...)
- Provide the correct answer for each problem
- DO NOT include multiple choice - all problems should be free response
- Each question must be UNIQUE — do not repeat the same problem with different numbers
- Use ASCII math operators in all text: >= <= != ; write "pi", "sqrt", "x" for multiply, "deg" for degrees${sectionInstruction}
${FIGURE_SCHEMA_PROMPT}
${EXPECTED_ANSWER_SCHEMA_PROMPT}`;

  const prompt = `Create a math worksheet with ${totalQuestions} problems covering these topics:

${topicDescriptions}

Distribute questions across the topics, giving more weight to [CURRENT] topics (the primary focus for this grading period). For [REVIEW] topics, make problems slightly easier to rebuild confidence. For [CURRENT] topics, start accessible and increase difficulty. For [PREVIEW] topics, keep problems introductory and approachable.

IMPORTANT: Use fresh, unique numbers and contexts every time. Vary the specific values, word problem scenarios, and phrasings so that no two worksheets are alike, even for the same topics. Do NOT start with the same type of question each time — vary the order of topic types across worksheets.

ANSWER & STRUCTURE VARIETY (important — recent worksheets were too repetitive):
- Do NOT let answers cluster. Spread the numeric ANSWERS across a wide range — never give several problems the same answer value (e.g. do not make many lines have slope 3, or many problems answer to 12). Before finalizing, scan your answers and re-work any that repeat.
- Vary the STRUCTURE of problems within a topic, not just the numbers. Mix forms: from a table, from a graph, from two points, from a verbal description, working forwards vs backwards, find-the-missing-piece, real-world vs abstract. Two problems on the same skill should look and feel different, not be the same template with swapped numbers.
- Use a varied mix of number types where appropriate: positives and negatives, whole numbers, fractions, and decimals; small and larger magnitudes.
- Do NOT reuse the example problems above verbatim — they only show the skill. Invent your own numbers, functions, and scenarios. In particular, vary the FIRST problem every time (e.g. don't always open a "complete the table for y = ..." item with the same equation or x-values).${previousQuestions && previousQuestions.length > 0 ? `

DO NOT REPEAT these questions from previous days (use completely different numbers, contexts, and phrasings):
${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ''}
${anyFigureTopics ? `
For any topic marked FIGURE REQUIRED above, attach a structured "figure" object (per the FIGURES section) to at least one of its problems. Put the diagram in the figure field — never describe the graph, grid, or shape in the question text. The system renders the figure as a real diagram.` : ''}

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "title": "Worksheet title describing the topics",
  "questions": [
    {
      "number": 1,
      "question": "The full problem text (no graph descriptions — use the figure field)",
      "answer": "The correct answer (number, fraction, or short text)",
      "topicId": "the topic ID from above",
      "topicName": "the topic name",
      "difficulty": 1,
      "isVerifiable": true,
      "section": "new",
      "figure": null,
      "expectedAnswer": null
    }
  ]
}

For "figure": include a structured figure object (see the FIGURES section) when the problem needs a diagram; otherwise use null.
For "expectedAnswer": include a structured expected-answer object (see the EXPECTED ANSWER section) whenever the answer can be described structurally; otherwise use null.
Set isVerifiable to true for problems with numeric/fraction answers, false for open-ended or explanation-type answers.
Set section to "new" for CURRENT and PREVIEW topics, or "review" for REVIEW topics.`;

  return { system, prompt };
}
