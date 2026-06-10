import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { getUsageCounts } from '@/lib/billing';
import { isAdminEmail } from '@/lib/admin';

export async function GET() {
  try {
    const user = await requireUser();
    const usage = await getUsageCounts(user.id);

    return NextResponse.json({
      ...usage,
      hasPaymentMethod: !!user.stripeCustomerId,
      isAdmin: isAdminEmail(user.email),
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
