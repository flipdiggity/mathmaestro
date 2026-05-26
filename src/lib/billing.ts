/**
 * Personal-use billing shim.
 *
 * The SaaS version metered worksheet generations and gradings against a free
 * tier and Stripe-billed plan. Personal version has no limits and no billing
 * — these functions keep their signatures so the ~5 callers (generate, grade,
 * generate-batch, billing/usage route) keep compiling.
 */

export async function getUsageCounts(_userId: string) {
  return {
    generates: 0,
    grades: 0,
    freeGeneratesRemaining: Infinity,
    freeGradesRemaining: Infinity,
  };
}

export async function checkUsageAllowance(
  _userId: string,
  _type: 'generate' | 'grade'
): Promise<{ allowed: boolean; message?: string }> {
  return { allowed: true };
}

export async function recordUsage(
  _userId: string,
  _type: 'generate' | 'grade',
  _worksheetId?: string
): Promise<void> {
  // no-op: personal use, no metering
}
