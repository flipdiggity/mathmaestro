import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const { worksheetIds }: { worksheetIds: string[] } = await request.json();

    if (!worksheetIds || worksheetIds.length === 0) {
      return NextResponse.json({ error: 'No worksheet IDs provided' }, { status: 400 });
    }

    // Verify all worksheets belong to this user
    const worksheets = await prisma.worksheet.findMany({
      where: { id: { in: worksheetIds } },
      include: { child: true },
    });

    const ownedIds = worksheets
      .filter((ws) => ws.child.userId === user.id)
      .map((ws) => ws.id);

    if (ownedIds.length === 0) {
      return NextResponse.json({ error: 'Worksheets not found' }, { status: 404 });
    }

    // Delete grading results
    await prisma.gradingResult.deleteMany({ where: { worksheetId: { in: ownedIds } } });

    // Null out usage records
    await prisma.usageRecord.updateMany({
      where: { worksheetId: { in: ownedIds } },
      data: { worksheetId: null },
    });

    // Delete worksheets
    await prisma.worksheet.deleteMany({ where: { id: { in: ownedIds } } });

    return NextResponse.json({ success: true, deleted: ownedIds.length });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
