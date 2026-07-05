import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { prisma } from '@/lib/db';

// Admin: last 100 audit-log entries (refunds, credit grants, ticket updates).

export async function GET() {
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
    const entries = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('admin/audit error:', error);
    return NextResponse.json({ error: 'Failed to load audit log' }, { status: 500 });
  }
}
