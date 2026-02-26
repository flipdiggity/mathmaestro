import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireUser();

    const children = await prisma.child.findMany({
      where: { userId: user.id },
      include: {
        worksheets: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { gradingResult: true },
        },
        topicMastery: {
          orderBy: { mastery: 'asc' },
        },
      },
    });

    return NextResponse.json({ children });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { name, grade, track, state, district, targetTestDate } = body;

    if (!name || !grade || !track) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const child = await prisma.child.create({
      data: {
        name,
        grade,
        track,
        state: state || 'TX',
        district: district || 'eanes-isd',
        targetTestDate: targetTestDate ? new Date(targetTestDate) : null,
        userId: user.id,
      },
    });

    return NextResponse.json({ child }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
