import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { prisma } from '@/lib/db';

// Admin: user lookup.
//   GET /api/admin/users            → list all users (newest first) with usage counts
//   GET /api/admin/users?email=...  → full detail for one user (children, usage, records)
//
// Usage counts are NET row math: rows with positive creditsCost are uses,
// rows with negative creditsCost are admin refunds (see /api/admin/refund and
// src/lib/billing.ts getUsageCounts, which counts the same way).

function netCounts(
  used: Array<{ userId: string; type: string; _count: { _all: number } }>,
  refunded: Array<{ userId: string; type: string; _count: { _all: number } }>
) {
  const map = new Map<string, number>();
  for (const g of used) {
    map.set(`${g.userId}:${g.type}`, (map.get(`${g.userId}:${g.type}`) ?? 0) + g._count._all);
  }
  for (const g of refunded) {
    map.set(`${g.userId}:${g.type}`, (map.get(`${g.userId}:${g.type}`) ?? 0) - g._count._all);
  }
  return (userId: string, type: 'generate' | 'grade') =>
    Math.max(0, map.get(`${userId}:${type}`) ?? 0);
}

export async function GET(request: NextRequest) {
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
    const email = request.nextUrl.searchParams.get('email');

    // ── Single-user detail ──
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          children: { select: { id: true, name: true, grade: true, track: true } },
          usageRecords: { orderBy: { createdAt: 'desc' }, take: 50 },
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const [genUsed, gradeUsed, genRefunded, gradeRefunded] = await Promise.all([
        prisma.usageRecord.count({
          where: { userId: user.id, type: 'generate', creditsCost: { gt: 0 } },
        }),
        prisma.usageRecord.count({
          where: { userId: user.id, type: 'grade', creditsCost: { gt: 0 } },
        }),
        prisma.usageRecord.count({
          where: { userId: user.id, type: 'generate', creditsCost: { lt: 0 } },
        }),
        prisma.usageRecord.count({
          where: { userId: user.id, type: 'grade', creditsCost: { lt: 0 } },
        }),
      ]);

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          stripeCustomerId: user.stripeCustomerId,
          createdAt: user.createdAt,
        },
        children: user.children,
        usage: {
          generates: Math.max(0, genUsed - genRefunded),
          grades: Math.max(0, gradeUsed - gradeRefunded),
        },
        usageRecords: user.usageRecords.map((r) => ({
          id: r.id,
          type: r.type,
          creditsCost: r.creditsCost,
          worksheetId: r.worksheetId,
          createdAt: r.createdAt,
        })),
      });
    }

    // ── All-users list ──
    const [users, used, refunded] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          children: { select: { id: true, name: true, grade: true, track: true } },
        },
      }),
      prisma.usageRecord.groupBy({
        by: ['userId', 'type'],
        where: { creditsCost: { gt: 0 } },
        _count: { _all: true },
      }),
      prisma.usageRecord.groupBy({
        by: ['userId', 'type'],
        where: { creditsCost: { lt: 0 } },
        _count: { _all: true },
      }),
    ]);

    const net = netCounts(used, refunded);

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        stripeCustomerId: u.stripeCustomerId,
        createdAt: u.createdAt,
        children: u.children,
        usage: {
          generates: net(u.id, 'generate'),
          grades: net(u.id, 'grade'),
        },
      })),
    });
  } catch (error) {
    console.error('admin/users error:', error);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}
