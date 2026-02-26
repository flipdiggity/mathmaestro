import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { verifyChildOwnership } from '@/lib/ownership';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const child = await verifyChildOwnership(params.id, user.id);
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, grade, track, state, district, targetTestDate } = body;

    const updated = await prisma.child.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(grade !== undefined && { grade }),
        ...(track !== undefined && { track }),
        ...(state !== undefined && { state }),
        ...(district !== undefined && { district }),
        targetTestDate: targetTestDate ? new Date(targetTestDate) : null,
      },
    });

    return NextResponse.json({ child: updated });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const child = await verifyChildOwnership(params.id, user.id);
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Delete related records first
    await prisma.topicMastery.deleteMany({ where: { childId: params.id } });
    const worksheets = await prisma.worksheet.findMany({ where: { childId: params.id } });
    const worksheetIds = worksheets.map((w) => w.id);
    if (worksheetIds.length > 0) {
      await prisma.gradingResult.deleteMany({ where: { worksheetId: { in: worksheetIds } } });
      await prisma.worksheet.deleteMany({ where: { childId: params.id } });
    }
    await prisma.child.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
