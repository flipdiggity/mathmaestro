/**
 * Mode-aware billing.
 *
 * personal — no limits, no metering (the household tool).
 * saas — pay-per-use: 5 free generates + 5 free grades, then a card on file
 *   is required. Usage is metered in UsageRecord rows (deleting a row refunds
 *   it). Admin-email users are never limited.
 */
import { prisma } from './db';
import { isSaas } from './mode';
import { isAdminEmail } from './admin';

const FREE_GENERATES = 5;
const FREE_GRADES = 5;

// Large finite stand-in for "unlimited" — Infinity does not survive
// JSON serialization (it becomes null in API responses).
const UNLIMITED = 999_999;

export async function getUsageCounts(userId: string) {
  if (!isSaas) {
    return {
      generates: 0,
      grades: 0,
      freeGeneratesRemaining: UNLIMITED,
      freeGradesRemaining: UNLIMITED,
    };
  }

  const [generateCount, gradeCount] = await Promise.all([
    prisma.usageRecord.count({ where: { userId, type: 'generate' } }),
    prisma.usageRecord.count({ where: { userId, type: 'grade' } }),
  ]);

  return {
    generates: generateCount,
    grades: gradeCount,
    freeGeneratesRemaining: Math.max(0, FREE_GENERATES - generateCount),
    freeGradesRemaining: Math.max(0, FREE_GRADES - gradeCount),
  };
}

export async function checkUsageAllowance(
  userId: string,
  type: 'generate' | 'grade'
): Promise<{ allowed: boolean; message?: string }> {
  if (!isSaas) return { allowed: true };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { allowed: false, message: 'User not found' };

  // Admin users bypass all billing limits.
  if (isAdminEmail(user.email)) return { allowed: true };

  const counts = await getUsageCounts(userId);
  const freeLimit = type === 'generate' ? FREE_GENERATES : FREE_GRADES;
  const used = type === 'generate' ? counts.generates : counts.grades;

  // Within free tier.
  if (used < freeLimit) return { allowed: true };

  // Past free tier — needs a payment method (Stripe customer).
  if (user.stripeCustomerId) return { allowed: true };

  return {
    allowed: false,
    message: `You've used all ${freeLimit} free ${
      type === 'generate' ? 'worksheet generations' : 'gradings'
    }. Add a payment method to continue.`,
  };
}

export async function recordUsage(
  userId: string,
  type: 'generate' | 'grade',
  worksheetId?: string
): Promise<void> {
  if (!isSaas) return; // personal use: no metering

  const cost = type === 'generate' ? 50 : 75; // cents

  await prisma.usageRecord.create({
    data: {
      userId,
      type,
      worksheetId: worksheetId || null,
      creditsCost: cost,
    },
  });
}
