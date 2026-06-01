import { CurriculumTopic } from '../curriculum/types';
import { FIGURE_KIND_HINTS, FIGURE_SCHEMA_PROMPT, EXPECTED_ANSWER_SCHEMA_PROMPT } from './figure-schema';

// Builds the prompt for a Week-1 diagnostic placement assessment. Unlike the
// normal generate prompt, it samples each skill across a DIFFICULTY LADDER with
// varied question formats — the goal is to locate exactly where the student's
// mastery of each skill breaks down, so the first weeks of spaced repetition can
// be weighted accordingly. No spaced-repetition review is mixed in.
export function buildDiagnosticPrompt(
  childName: string,
  gradeLevel: number,
  topics: CurriculumTopic[],
  questionsPerTopic: number
): { system: string; prompt: string } {
  const totalQuestions = topics.length * questionsPerTopic;

  // Describe, per question slot, the difficulty/format ladder we want.
  const ladder: string[] = [
    'a fluency/computation item at the EASY end of the skill (difficulty 1)',
    'an on-level APPLICATION or word problem (difficulty 2)',
    'a STRETCH item — multi-step, a different representation, or a "harder number" version that reveals the skill ceiling (difficulty 3)',
  ];
  const ladderText =
    questionsPerTopic <= ladder.length
      ? ladder.slice(0, questionsPerTopic).map((l, i) => `   - Q${i + 1} of the skill: ${l}`).join('\n')
      : Array.from({ length: questionsPerTopic }, (_, i) => {
          const d = Math.min(3, Math.floor((i / questionsPerTopic) * 3) + 1);
          return `   - Q${i + 1} of the skill: difficulty ${d}, varied format`;
        }).join('\n');

  function describeTopic(t: CurriculumTopic, i: number): string {
    const kind = t.imageType ?? 'coordinate-plane';
    const imageNote = t.requiresImage
      ? `\n   FIGURE: include a "figure" payload for ${FIGURE_KIND_HINTS[kind] ?? `figure.kind "${kind}"`} where the skill calls for a diagram. Put the diagram in the figure field, never in the question text.`
      : '';
    return `${i + 1}. ${t.name} (${t.tpiCode}) - ${t.description}
   Sample problems: ${t.sampleProblems.join('; ')}${imageNote}`;
  }

  const topicDescriptions = topics.map(describeTopic).join('\n');
  const anyFigureTopics = topics.some((t) => t.requiresImage);

  const system = `You are an expert math teacher building a DIAGNOSTIC placement assessment for ${childName}, who is being assessed at the grade ${gradeLevel} level in Eanes ISD, Austin TX. The purpose is to measure exactly how far ${childName}'s mastery of each skill goes — where they are solid and where they break down — so we can target practice. This is an assessment, NOT a lesson.

CRITICAL RULES:
- Generate exactly ${totalQuestions} problems: exactly ${questionsPerTopic} per skill listed, grouped together in the order the skills are listed.
- DIFFICULTY LADDER: for each skill, span a range from easy to challenging so we can see the student's ceiling, following this pattern:
${ladderText}
- VARIETY: across the ${questionsPerTopic} problems for a skill, vary the format — mix pure computation, real-world word problems, and where it fits the skill, a problem that uses a diagram/representation or asks the student to show or interpret. Do not reuse the same template with only the numbers changed.
- Each problem targets exactly ONE listed skill so results map cleanly to that skill. Set the "difficulty" field (1, 2, or 3) to match the ladder so we can see where errors cluster.
- VERIFY EVERY ANSWER: compute the answer step by step before writing it. Wrong answers are unacceptable.
- Each problem must have exactly ONE correct answer; free response only (no multiple choice).
- For fractions use simplified form. Use age-appropriate contexts for word problems.
- Number problems sequentially (1, 2, 3, ...).
- Use ASCII math operators in all text: >= <= != ; write "pi", "sqrt", "x" for multiply, "deg" for degrees.
${FIGURE_SCHEMA_PROMPT}
${EXPECTED_ANSWER_SCHEMA_PROMPT}`;

  const prompt = `Create a ${totalQuestions}-problem diagnostic placement assessment that samples these skills, ${questionsPerTopic} problems each, grouped in order. For each skill, follow the difficulty ladder (easy -> on-level -> stretch) and vary the question format so we can see exactly where ${childName}'s mastery ends:

${topicDescriptions}

Set the "topicId" on each problem to the matching skill's ID and the "difficulty" to its ladder level (1/2/3) so the results can be scored per skill and per difficulty.${anyFigureTopics ? `

For any skill marked FIGURE, attach a structured "figure" object (per the FIGURES section) when the problem needs a diagram. Put the diagram in the figure field — never describe the graph or shape in the question text.` : ''}

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "title": "Diagnostic title",
  "questions": [
    {
      "number": 1,
      "question": "The full problem text (no graph descriptions — use the figure field)",
      "answer": "The correct answer (number, fraction, or short text)",
      "topicId": "the skill ID from above",
      "topicName": "the skill name",
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
Set isVerifiable to true for problems with numeric/fraction answers, false for open-ended ones.`;

  return { system, prompt };
}
