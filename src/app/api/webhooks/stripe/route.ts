import { NextResponse } from 'next/server';

// Personal-use rebuild: no Stripe webhook.
export async function POST() {
  return NextResponse.json({ error: 'Webhooks disabled' }, { status: 410 });
}
