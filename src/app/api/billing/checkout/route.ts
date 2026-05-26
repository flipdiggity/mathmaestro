import { NextResponse } from 'next/server';

// Personal-use rebuild: no billing.
export async function POST() {
  return NextResponse.json({ error: 'Billing is disabled' }, { status: 410 });
}
