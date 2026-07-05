import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { getUsageCounts, USAGE_UNIT_COST_CENTS } from '@/lib/billing';
import { stripe } from '@/lib/stripe';

// Admin: refund consumed usage (and optionally the Stripe charge).
// Body: { userId, type: "generate" | "grade", count, reason, stripePaymentIntentId? }
//
// HOW THE ACCOUNTING WORKS: billing.ts getUsageCounts counts consumption per
// `type` as (rows with creditsCost > 0) − (rows with creditsCost < 0). A row
// whose type is literally "refund" would be invisible to that per-type count,
// so a refund is written as N anti-use rows of the REFUNDED type
// ('generate' | 'grade'), each with creditsCost = −(unit cost in cents) —
// one row per unit, mirroring how recordUsage writes one row per use. After a
// refund of N grades, checkUsageAllowance therefore treats N gradings as not
// consumed. The human context (who/why/how many) lives in the AuditLog row.

const MAX_REFUND_COUNT = 100;

interface StripeOutcome {
  attempted: boolean;
  ok?: boolean;
  refundId?: string;
  status?: string | null;
  error?: string;
}

export async function POST(request: NextRequest) {
  let currentUser;
  try {
    currentUser = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdminEmail(currentUser.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, type, count, reason, stripePaymentIntentId } = body as {
      userId?: string;
      type?: string;
      count?: number;
      reason?: string;
      stripePaymentIntentId?: string;
    };

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    if (type !== 'generate' && type !== 'grade') {
      return NextResponse.json({ error: 'type must be "generate" or "grade"' }, { status: 400 });
    }
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > MAX_REFUND_COUNT) {
      return NextResponse.json(
        { error: `count must be an integer between 1 and ${MAX_REFUND_COUNT}` },
        { status: 400 }
      );
    }
    const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
    if (!trimmedReason || trimmedReason.length > 500) {
      return NextResponse.json(
        { error: 'reason is required (500 characters max)' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Credit-ledger refund: N anti-use rows (see accounting note above).
    const unitCost = USAGE_UNIT_COST_CENTS[type];
    await prisma.usageRecord.createMany({
      data: Array.from({ length: count }, () => ({
        userId,
        type,
        creditsCost: -unitCost,
      })),
    });

    // Optional money refund via Stripe — best-effort, reported in the response.
    let stripeOutcome: StripeOutcome = { attempted: false };
    if (
      typeof stripePaymentIntentId === 'string' &&
      stripePaymentIntentId &&
      process.env.STRIPE_SECRET_KEY
    ) {
      try {
        const refund = await stripe().refunds.create({ payment_intent: stripePaymentIntentId });
        stripeOutcome = {
          attempted: true,
          ok: true,
          refundId: refund.id,
          status: refund.status,
        };
      } catch (stripeError) {
        stripeOutcome = {
          attempted: true,
          ok: false,
          error: stripeError instanceof Error ? stripeError.message : 'Stripe refund failed',
        };
      }
    }

    await prisma.auditLog.create({
      data: {
        actorEmail: currentUser.email,
        action: 'refund',
        targetType: 'user',
        targetId: userId,
        detailJson: JSON.stringify({
          type,
          count,
          reason: trimmedReason,
          unitCostCents: unitCost,
          centsRestored: unitCost * count,
          stripePaymentIntentId: stripePaymentIntentId ?? null,
          stripe: stripeOutcome,
        }),
      },
    });

    // usage = what billing now sees for this user (post-refund).
    const usage = await getUsageCounts(userId);

    return NextResponse.json({
      ok: true,
      refunded: {
        userId,
        email: user.email,
        type,
        count,
        centsRestored: unitCost * count,
      },
      stripe: stripeOutcome,
      usage,
    });
  } catch (error) {
    console.error('admin/refund error:', error);
    return NextResponse.json({ error: 'Refund failed' }, { status: 500 });
  }
}
