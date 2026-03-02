import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { verifyWorksheetOwnership } from '@/lib/ownership';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const worksheet = await verifyWorksheetOwnership(params.id, user.id);
    if (!worksheet) {
      return NextResponse.json({ error: 'Worksheet not found' }, { status: 404 });
    }

    // Delete grading result if exists
    await prisma.gradingResult.deleteMany({ where: { worksheetId: params.id } });

    // Null out any usage records referencing this worksheet (preserve billing history)
    await prisma.usageRecord.updateMany({
      where: { worksheetId: params.id },
      data: { worksheetId: null },
    });

    // Delete the worksheet
    await prisma.worksheet.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
