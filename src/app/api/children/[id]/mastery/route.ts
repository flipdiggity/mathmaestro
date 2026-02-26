import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { verifyChildOwnership } from '@/lib/ownership';

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

    const mastery = await prisma.topicMastery.findMany({
      where: { childId: params.id },
      orderBy: [{ gradeLevel: 'asc' }, { topicName: 'asc' }],
    });

    return NextResponse.json({ mastery });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
