import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const children = await prisma.child.findMany({
    include: {
      worksheets: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { gradingResult: true },
      },
      topicMastery: {
        orderBy: { mastery: 'asc' },
      },
    },
  });

  return NextResponse.json({ children });
}
