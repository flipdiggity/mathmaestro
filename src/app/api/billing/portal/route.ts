import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export async function POST() {
  try {
    const user = await requireUser();

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No payment method on file' },
        { status: 400 }
      );
    }

    const session = await stripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
