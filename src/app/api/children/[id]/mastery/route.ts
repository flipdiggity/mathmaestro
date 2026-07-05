import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { verifyChildOwnership } from '@/lib/ownership';
import { resolveCurriculumForChild } from '@/lib/curriculum/courses';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const child = await verifyChildOwnership(params.id, user.id);
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const all = await prisma.topicMastery.findMany({
      where: { childId: params.id },
      orderBy: [{ gradeLevel: 'asc' }, { topicName: 'asc' }],
    });

    // Only rows matching the child's CURRENT curriculum pool are meaningful.
    // Earlier curriculum revisions used different topic-ID schemes; their
    // orphaned rows (often duplicate names with stale scores) confuse the UI
    // and misrepresent the child's state. Pass ?all=1 to inspect everything.
    const pool = new Set(
      resolveCurriculumForChild(child).topics.map((t) => t.id)
    );
    const includeAll = request.nextUrl.searchParams.get('all');
    const mastery = includeAll ? all : all.filter((m) => pool.has(m.topicId));
    const orphaned = all.length - all.filter((m) => pool.has(m.topicId)).length;

    return NextResponse.json({ mastery, orphaned });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
