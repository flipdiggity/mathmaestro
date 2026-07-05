import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { prisma } from '@/lib/db';

// Admin: dashboard overview stats.
// lastCronSheetAt = createdAt of the most recent worksheet with a dayOfWeek
// (only scheduled/daily sheets set it), i.e. the daily-generation heartbeat.

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
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [users, children, worksheets7d, graded7d, openTickets, lastCronSheet] =
      await Promise.all([
        prisma.user.count(),
        prisma.child.count(),
        prisma.worksheet.count({ where: { createdAt: { gt: since } } }),
        prisma.gradingResult.count({ where: { createdAt: { gt: since } } }),
        prisma.supportTicket.count({ where: { status: 'open' } }),
        prisma.worksheet.findFirst({
          where: { dayOfWeek: { not: null } },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);

    return NextResponse.json({
      users,
      children,
      worksheets7d,
      graded7d,
      openTickets,
      lastCronSheetAt: lastCronSheet?.createdAt ?? null,
    });
  } catch (error) {
    console.error('admin/overview error:', error);
    return NextResponse.json({ error: 'Failed to load overview' }, { status: 500 });
  }
}
