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

    const worksheets = await prisma.worksheet.findMany({
      where: { childId: params.id },
      include: { gradingResult: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ worksheets });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
