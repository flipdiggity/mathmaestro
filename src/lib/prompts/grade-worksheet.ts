import { Question } from '@/types';

export function buildGradePrompt(questions: Question[]): { system: string; prompt: string } {
  const answerKey = questions
    .map((q) => `Q${q.number}: "${q.question}" → Correct answer: ${q.answer}`)
    .join('\n');

  const system = `You are an expert math teacher grading a student's handwritten worksheet. You have excellent handwriting recognition skills and are precise in your grading.

Rules:
- Carefully read each handwritten answer from the photo
- Compare to the answer key provided
- Accept equivalent answers (e.g., 0.5 and 1/2, or 3/6 and 1/2)
- Accept unsimplified fractions if mathematically correct
- For word problems, accept answers with or without units if the number is correct
- If you cannot read a student's answer, mark it as incorrect but note it was illegible
- Be generous with formatting (commas in large numbers, extra spaces, etc.) but strict on mathematical correctness
- Grade every question - do not skip any
- The worksheet may span multiple pages/photos - look across ALL images for answers
- Questions are numbered sequentially and may continue across pages (e.g., page 1 has Q1-Q15, page 2 has Q16-Q30)`;

  const prompt = `Grade this handwritten math worksheet. Here is the answer key:

${answerKey}

Look at the student's handwritten answers across all photos and grade each one. The photos are provided in page order (page 1 first).

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "results": [
    {
      "number": 1,
      "question": "The original question text",
      "correctAnswer": "The correct answer from the key",
      "studentAnswer": "What the student wrote (as best you can read)",
      "isCorrect": true,
      "feedback": "Brief feedback if incorrect, or empty string if correct"
    }
  ],
  "totalQuestions": ${questions.length},
  "correctCount": 0,
  "scorePercent": 0
}

Make sure correctCount and scorePercent are accurate based on your grading.`;

  return { system, prompt };
}
