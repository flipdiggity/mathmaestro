import { NextResponse } from 'next/server';

// Personal-use rebuild: no admin panel.
export async function POST() {
  return NextResponse.json({ error: 'Admin disabled' }, { status: 410 });
}
