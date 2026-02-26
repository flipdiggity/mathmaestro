import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { verifyChildOwnership } from '@/lib/ownership';
import { getTopicsForChild } from '@/lib/curriculum';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const child = await verifyChildOwnership(params.id, user.id);
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const topics = getTopicsForChild(child.grade, child.track, child.state, child.district);
    return NextResponse.json({ topics });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
