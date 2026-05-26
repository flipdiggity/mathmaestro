import { NextResponse } from 'next/server';

// Personal-use rebuild: no billing. Returns always-unlimited usage.
export async function GET() {
  return NextResponse.json({
    generates: 0,
    grades: 0,
    freeGeneratesRemaining: Infinity,
    freeGradesRemaining: Infinity,
    hasPaymentMethod: true,
    isAdmin: true,
  });
}
