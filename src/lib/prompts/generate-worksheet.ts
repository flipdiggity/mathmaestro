import { TopicSelection } from '../curriculum/types';

export function buildGeneratePrompt(
  childName: string,
  gradeLevel: number,
  selections: TopicSelection[],
  totalQuestions: number
): { system: string; prompt: string } {
  // Separate new and review topics for clearer grouping
  const newSelections = selections.filter((s) => s.reason === 'new');
  const reviewSelections = selections.filter((s) => s.reason === 'review');

  function describeTopic(s: TopicSelection, i: number): string {
    const imageNote = s.topic.requiresImage
      ? ` | IMAGE TOPIC: Describe the graph/figure in text and set hasGrid:true, gridType:"${s.topic.imageType ?? 'coordinate-plane'}"`
      : '';
    return `${i + 1}. [${s.reason.toUpperCase()}] ${s.topic.name} (${s.topic.tpiCode}) - ${s.topic.description}
   Difficulty: ${s.topic.difficulty}/3 | Sample problems: ${s.topic.sampleProblems.join('; ')}${imageNote}`;
  }

  const topicDescriptions = selections.map(describeTopic).join('\n');

  const hasNewAndReview = newSelections.length > 0 && reviewSelections.length > 0;
  const sectionInstruction = hasNewAndReview
    ? `\n- Group NEW topic questions first, then REVIEW topic questions
- Set the "section" field to "new" for new-topic questions and "review" for review-topic questions`
    : '';

  const system = `You are an expert math teacher creating worksheets for ${childName}, a ${gradeLevel}th grade student in Eanes ISD, Austin TX. You create clear, age-appropriate math problems aligned to Texas TEKS standards.

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

Distribute questions across the topics proportionally. For REVIEW topics, make problems slightly easier to rebuild confidence. For NEW topics, start accessible and increase difficulty.

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
Set section to "new" or "review" matching the topic's tag above.`;

  return { system, prompt };
}
