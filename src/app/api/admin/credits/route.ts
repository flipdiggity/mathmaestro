import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { prisma } from '@/lib/db';

// Admin: credit adjustments. Billing counts usage rows (see src/lib/billing.ts),
// so granting credits back = deleting consumed usage rows:
//   { action: "delete-record", userId, recordId }        → delete one record
//   { action: "add-credits",   userId, type, count }     → delete the N most
//     recent POSITIVE-cost rows of that type (never refund rows — deleting a
//     negative refund row would REMOVE credit, the opposite of granting).
// For an auditable alternative that keeps the ledger intact, use
// POST /api/admin/refund instead.

export async function POST(request: NextRequest) {
  let currentUser;
  try {
    currentUser = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdminEmail(currentUser.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
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

      await prisma.auditLog.create({
        data: {
          actorEmail: currentUser.email,
          action: 'usage-record-delete',
          targetType: 'user',
          targetId: userId,
          detailJson: JSON.stringify({
            recordId,
            type: record.type,
            creditsCost: record.creditsCost,
            worksheetId: record.worksheetId,
          }),
        },
      });

      return NextResponse.json({ success: true, deleted: 1 });
    }

    if (action === 'add-credits') {
      if (!type || !['generate', 'grade'].includes(type) || !count || count < 1) {
        return NextResponse.json(
          { error: 'type (generate|grade) and count (>= 1) are required' },
          { status: 400 }
        );
      }

      // Delete the N most recent CONSUMED usage records of the given type.
      const records = await prisma.usageRecord.findMany({
        where: { userId, type, creditsCost: { gt: 0 } },
        orderBy: { createdAt: 'desc' },
        take: count,
        select: { id: true },
      });

      if (records.length > 0) {
        await prisma.usageRecord.deleteMany({
          where: { id: { in: records.map((r) => r.id) } },
        });
      }

      await prisma.auditLog.create({
        data: {
          actorEmail: currentUser.email,
          action: 'credit-grant',
          targetType: 'user',
          targetId: userId,
          detailJson: JSON.stringify({ type, requested: count, deleted: records.length }),
        },
      });

      return NextResponse.json({ success: true, deleted: records.length });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('admin/credits error:', error);
    return NextResponse.json({ error: 'Credit adjustment failed' }, { status: 500 });
  }
}
