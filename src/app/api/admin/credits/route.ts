import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireUser();
    if (!isAdminEmail(currentUser.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, userId, recordId, type, count } = body as {
      action: 'delete-record' | 'add-credits';
      userId: string;
      recordId?: string;
      type?: 'generate' | 'grade';
      count?: number;
    };

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (action === 'delete-record') {
      if (!recordId) {
        return NextResponse.json({ error: 'recordId is required' }, { status: 400 });
      }

      // Verify the record belongs to the target user
      const record = await prisma.usageRecord.findUnique({ where: { id: recordId } });
      if (!record || record.userId !== userId) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }

      await prisma.usageRecord.delete({ where: { id: recordId } });

      return NextResponse.json({ success: true, deleted: 1 });
    }

    if (action === 'add-credits') {
      if (!type || !count || count < 1) {
        return NextResponse.json(
          { error: 'type and count (>= 1) are required' },
          { status: 400 }
        );
      }

      // Delete the N most recent usage records of the given type
      const records = await prisma.usageRecord.findMany({
        where: { userId, type },
        orderBy: { createdAt: 'desc' },
        take: count,
        select: { id: true },
      });

      if (records.length === 0) {
        return NextResponse.json({ success: true, deleted: 0 });
      }

      await prisma.usageRecord.deleteMany({
        where: { id: { in: records.map((r) => r.id) } },
      });

      return NextResponse.json({ success: true, deleted: records.length });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
