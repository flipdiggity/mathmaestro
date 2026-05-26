/**
 * Answer-verification placeholder.
 *
 * The previous implementation looked thorough but was a rubber-stamper —
 * tryVerifyFraction returned isCorrect: true for any string that parsed
 * as a fraction, and tryEvaluateArithmetic only matched three brittle
 * regexes. That gave false confidence on word problems and graphing
 * problems that it couldn't actually verify.
 *
 * For now this is a pure pass-through: it does NOT verify anything and
 * does NOT modify answers. Day 3 will replace it with a real sandboxed
 * math eval (mathjs) that returns honest "could not verify" rather than
 * silent rubber-stamping.
 */

export function verifyWorksheetAnswers<
  T extends { question: string; answer: string; isVerifiable: boolean }
>(questions: T[]): Array<T & { verified: boolean; correctedAnswer?: string }> {
  return questions.map((q) => ({ ...q, verified: false }));
}
