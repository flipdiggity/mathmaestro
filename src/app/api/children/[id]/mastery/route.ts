import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const mastery = await prisma.topicMastery.findMany({
    where: { childId: params.id },
    orderBy: [{ gradeLevel: 'asc' }, { topicName: 'asc' }],
  });

  return NextResponse.json({ mastery });
}
