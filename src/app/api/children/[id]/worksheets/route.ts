import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const worksheets = await prisma.worksheet.findMany({
    where: { childId: params.id },
    include: { gradingResult: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ worksheets });
}
