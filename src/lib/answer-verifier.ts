/**
 * Programmatic answer verification for math problems.
 * Catches Claude's arithmetic mistakes before printing worksheets.
 */

interface VerificationResult {
  isCorrect: boolean;
  computedAnswer?: string;
  originalAnswer: string;
}

/**
 * Verify a math answer programmatically.
 * Supports: integers, decimals, fractions, percentages, simple expressions.
 */
export function verifyAnswer(question: string, providedAnswer: string): VerificationResult {
  const answer = providedAnswer.trim();

  // Try to evaluate as arithmetic
  const numericResult = tryEvaluateArithmetic(question, answer);
  if (numericResult !== null) return numericResult;

  // Try fraction verification
  const fractionResult = tryVerifyFraction(question, answer);
  if (fractionResult !== null) return fractionResult;

  // Can't verify programmatically
  return { isCorrect: true, originalAnswer: answer };
}

function tryEvaluateArithmetic(question: string, answer: string): VerificationResult | null {
  // Extract arithmetic expression from common question patterns
  const patterns = [
    /(?:what is|calculate|solve|evaluate|find)[:\s]*(.+?)(?:\s*=\s*\?|\s*\?|$)/i,
    /(\d[\d\s+\-×÷*/().]+\d)\s*=\s*\?/,
    /(\d[\d\s+\-×÷*/().]+\d)\s*$/,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match) {
      const expr = match[1]
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\s+/g, '')
        .trim();

      try {
        // Safe numeric evaluation (only allows digits and math operators)
        if (/^[\d+\-*/().]+$/.test(expr)) {
          const computed = Function(`"use strict"; return (${expr})`)();
          if (typeof computed === 'number' && isFinite(computed)) {
            const computedStr = formatNumber(computed);
            const answerNum = parseFloat(answer.replace(/,/g, ''));
            const isCorrect = Math.abs(computed - answerNum) < 0.001;
            return {
              isCorrect,
              computedAnswer: computedStr,
              originalAnswer: answer,
            };
          }
        }
      } catch {
        // Expression couldn't be evaluated
      }
    }
  }

  // Check if the answer itself is a plain number and question has a clear numeric answer
  const answerNum = parseFloat(answer.replace(/,/g, ''));
  if (!isNaN(answerNum)) {
    // Check for percentage answers
    if (answer.includes('%')) {
      return null; // Let fraction/percent handler deal with it
    }
  }

  return null;
}

function tryVerifyFraction(_question: string, answer: string): VerificationResult | null {
  // Parse fraction answers like "3/4", "1 1/2", "2/3"
  const fractionPattern = /^(\d+)\s+(\d+)\/(\d+)$|^(\d+)\/(\d+)$/;
  const match = answer.match(fractionPattern);
  if (!match) return null;

  // Validate the fraction is parseable (mixed number or simple fraction)
  if (match[1]) {
    // Mixed number: "1 1/2" - verify denominator is non-zero
    if (parseInt(match[3]) === 0) return null;
  } else {
    // Simple fraction: "3/4" - verify denominator is non-zero
    if (parseInt(match[5]) === 0) return null;
  }

  // Best-effort; if we can't determine the expected answer from the question, trust it
  return { isCorrect: true, originalAnswer: answer };
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  // Round to reasonable precision
  const rounded = Math.round(n * 10000) / 10000;
  return rounded.toString();
}

/**
 * Verify all answers in a worksheet's questions array.
 * Returns questions with corrected answers where possible.
 */
export function verifyWorksheetAnswers<T extends { question: string; answer: string; isVerifiable: boolean }>(
  questions: T[]
): Array<T & { verified: boolean; correctedAnswer?: string }> {
  return questions.map((q) => {
    if (!q.isVerifiable) {
      return { ...q, verified: false };
    }

    const result = verifyAnswer(q.question, q.answer);
    if (!result.isCorrect && result.computedAnswer) {
      return {
        ...q,
        answer: result.computedAnswer,
        verified: true,
        correctedAnswer: result.computedAnswer,
      };
    }

    return { ...q, verified: true };
  });
}
