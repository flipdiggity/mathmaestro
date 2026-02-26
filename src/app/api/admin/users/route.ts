import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireUser();
    if (!isAdminEmail(currentUser.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'email query param required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        children: { select: { id: true, name: true, grade: true, track: true } },
        usageRecords: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const generateCount = user.usageRecords.filter((r) => r.type === 'generate').length;
    const gradeCount = user.usageRecords.filter((r) => r.type === 'grade').length;

    // Get full counts (usageRecords above is limited to 50 for the list)
    const [totalGenerates, totalGrades] = await Promise.all([
      prisma.usageRecord.count({ where: { userId: user.id, type: 'generate' } }),
      prisma.usageRecord.count({ where: { userId: user.id, type: 'grade' } }),
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
        generates: totalGenerates,
        grades: totalGrades,
        recentGenerates: generateCount,
        recentGrades: gradeCount,
      },
      usageRecords: user.usageRecords.map((r) => ({
        id: r.id,
        type: r.type,
        creditsCost: r.creditsCost,
        worksheetId: r.worksheetId,
        createdAt: r.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
