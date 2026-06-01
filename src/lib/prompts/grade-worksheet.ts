import { Question, ExpectedAnswer } from '@/types';

// Human-readable grading instruction for a structured expected answer. Tells the
// vision model exactly what to look for so it can grade drawn/graphed work, not
// just typed numbers.
function describeExpected(ea: ExpectedAnswer): string {
  switch (ea.kind) {
    case 'numeric':
      return ea.tolerance != null
        ? `Numeric answer; correct if within +/- ${ea.tolerance} of ${ea.value}${ea.unit ? ` (${ea.unit})` : ''}. Units optional.`
        : `Numeric answer ${ea.value}${ea.unit ? ` (${ea.unit})` : ''}. Accept equivalent forms; units optional.`;
    case 'fraction':
      return `Fraction ${ea.value}; accept any equivalent fraction or its decimal/percent equivalent.`;
    case 'exact':
      return `Should read "${ea.value}" (ignore case, spacing, and trivial punctuation).`;
    case 'coordinate':
      return `A single plotted point at (${ea.x}, ${ea.y})${ea.tolerance ? ` within +/- ${ea.tolerance}` : ''}. Check the dot is in the right place on the grid, not just written text.`;
    case 'coordinate-list':
      return `Plotted points: ${ea.points.map((p) => `(${p.x}, ${p.y})`).join(', ')}${ea.ordered ? ' in this order' : ' (order does not matter)'}. Check the dots on the grid.`;
    case 'linear-equation':
      return `A line with slope ${ea.slope} and y-intercept ${ea.intercept}. Accept any equivalent equation form (y = mx + b, standard form, etc.) OR a correctly drawn line.`;
    case 'plotted-line':
      return `A drawn line/curve passing through approximately ${ea.through.map((p) => `(${p.x}, ${p.y})`).join(' and ')}${ea.tolerance ? ` (tolerance +/- ${ea.tolerance})` : ''}. Judge the drawn line on the grid, not text.`;
    case 'interval':
      return `A number-line solution from ${ea.from} (${ea.fromStyle} circle) to ${ea.to} (${ea.toStyle} circle). Check the endpoints are open/closed correctly and the shaded direction is right.`;
    case 'set':
      return ea.ordered
        ? `These values in this exact order: ${ea.values.join(', ')}.`
        : `These values (any order): ${ea.values.join(', ')}.`;
    case 'fraction-model':
      return `A model with ${ea.shadedParts} of ${ea.totalParts} parts shaded (accept any equivalent fraction shaded correctly).`;
    case 'explanation':
      return ea.rubric
        ? `Open-ended. Judge the reasoning against: ${ea.rubric}`
        : `Open-ended explanation. Judge whether the reasoning is mathematically sound.`;
  }
}

export function buildGradePrompt(questions: Question[]): { system: string; prompt: string } {
  const validNumbers = questions.map((q) => q.number).join(', ');

  const answerKey = questions
    .map((q) => {
      const lines = [`Q${q.number} [${q.topicName}]: ${q.question}`, `  Correct answer: ${q.answer}`];
      if (q.expectedAnswer) {
        lines.push(`  How to check: ${describeExpected(q.expectedAnswer)}`);
      } else if (q.figure) {
        lines.push(
          `  NOTE: this answer is DRAWN on a ${q.figure.kind} diagram. Judge the student's drawing/marking against the correct answer above, not just written text.`
        );
      }
      return lines.join('\n');
    })
    .join('\n\n');

  const system = `You are an expert math teacher grading a student's handwritten worksheet from photos. You have excellent handwriting recognition and you grade precisely and fairly.

HOW TO MATCH ANSWERS TO QUESTIONS:
- Anchor on the QUESTION NUMBER the student wrote next to each answer. Do NOT assume answers appear in page order or top-to-bottom — kids skip around, run long answers into the margin, or continue on the back.
- Only grade these question numbers: ${validNumbers}.
- The photos may also contain work from OTHER days, scratch work, doodles, or a printed answer line — IGNORE anything that isn't a clearly numbered answer to one of the questions above.
- If you cannot find any answer for one of the listed question numbers, mark it incorrect with feedback "No answer found / left blank". Never invent an answer.

HOW TO GRADE EACH ANSWER:
- Use the answer key below. When a "How to check" line is present, follow it exactly — including for DRAWN answers (plotted points, graphed lines, number-line intervals, shaded fraction models). Look at the actual marks on the diagram, not just any text the student wrote.
- Accept mathematically equivalent answers (0.5 = 1/2, 3/6 = 1/2, unsimplified fractions, equivalent equation forms).
- Be generous on formatting (commas in large numbers, extra spaces, missing/optional units) but strict on mathematical correctness.
- If a written answer is truly illegible, mark it incorrect and note "illegible" in feedback.
- Grade EVERY listed question — never skip one.`;

  const prompt = `Grade this handwritten math worksheet. The photos may span multiple pages and may include unrelated work — match answers to questions by their question number, not by position.

ANSWER KEY (only these questions count):
${answerKey}

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "results": [
    {
      "number": 1,
      "question": "The original question text",
      "correctAnswer": "The correct answer from the key",
      "studentAnswer": "What the student wrote/drew (as best you can read), or 'blank' if not found",
      "isCorrect": true,
      "feedback": "Brief feedback if incorrect or blank; empty string if correct"
    }
  ],
  "totalQuestions": ${questions.length},
  "correctCount": 0,
  "scorePercent": 0
}

Include exactly one result for each of these question numbers: ${validNumbers}. Make sure correctCount and scorePercent (0-100, rounded) accurately reflect your grading.`;

  return { system, prompt };
}
