import { TopicSelection } from '../curriculum/types';
import { getCurrentNineWeeks, getNineWeeksDateRange, getNineWeeksLabel } from '../curriculum/pacing';

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function buildGeneratePrompt(
  childName: string,
  gradeLevel: number,
  selections: TopicSelection[],
  totalQuestions: number
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
    const imageNote = s.topic.requiresImage
      ? ` | IMAGE TOPIC: Describe the graph/figure in text and set hasGrid:true, gridType:"${s.topic.imageType ?? 'coordinate-plane'}"`
      : '';
    return `${i + 1}. [${tag}] ${s.topic.name} (${s.topic.tpiCode}) - ${s.topic.description}
   Difficulty: ${s.topic.difficulty}/3 | Sample problems: ${s.topic.sampleProblems.join('; ')}${imageNote}`;
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

  const system = `You are an expert math teacher creating worksheets for ${childName}, a ${gradeLevel}th grade student in Eanes ISD, Austin TX. You create clear, age-appropriate math problems aligned to Texas TEKS standards.

Current period: ${nwLabel} (${formatDate(start)} – ${formatDate(end)})
Primary focus topics for this period are marked [CURRENT].
Generate more questions for [CURRENT] topics than [REVIEW] or [PREVIEW] topics.
[REVIEW] topics are from earlier grading periods — keep those problems shorter and simpler.
[PREVIEW] topics are upcoming material — keep those problems introductory.

Rules:
- Generate exactly ${totalQuestions} problems
- Problems should be clearly worded and unambiguous
- Include a mix of computation and word problems
- Each problem must have exactly ONE correct answer
- For fractions, use simplified form
- For word problems, use age-appropriate contexts
- Number problems sequentially (1, 2, 3, ...)
- Provide the correct answer for each problem
- DO NOT include multiple choice - all problems should be free response${sectionInstruction}`;

  const imageSchemaFields = `
      "hasGrid": false,
      "gridType": null,`;

  const prompt = `Create a math worksheet with ${totalQuestions} problems covering these topics:

${topicDescriptions}

Distribute questions across the topics, giving more weight to [CURRENT] topics (the primary focus for this grading period). For [REVIEW] topics, make problems slightly easier to rebuild confidence. For [CURRENT] topics, start accessible and increase difficulty. For [PREVIEW] topics, keep problems introductory and approachable.

IMPORTANT: Use fresh, unique numbers and contexts every time. Vary the specific values, word problem scenarios, and phrasings so that no two worksheets are alike, even for the same topics.

For topics marked IMAGE TOPIC: describe what the student should plot or identify in the question text, and set hasGrid to true with the appropriate gridType. The system will render the grid automatically.

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "title": "Worksheet title describing the topics",
  "questions": [
    {
      "number": 1,
      "question": "The full problem text",
      "answer": "The correct answer (number, fraction, or short text)",
      "topicId": "the topic ID from above",
      "topicName": "the topic name",
      "difficulty": 1,
      "isVerifiable": true,
      "section": "new",${imageSchemaFields}
    }
  ]
}

Set isVerifiable to true for problems with numeric/fraction answers, false for open-ended or explanation-type answers.
Set section to "new" for CURRENT and PREVIEW topics, or "review" for REVIEW topics.`;

  return { system, prompt };
}
