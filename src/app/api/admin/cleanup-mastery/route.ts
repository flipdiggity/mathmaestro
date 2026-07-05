import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { resolveCurriculumForChild } from '@/lib/curriculum/courses';

// Deletes TopicMastery rows whose topicId no longer exists in the child's
// current curriculum pool (leftovers from earlier curriculum ID schemes, e.g.
// numeric "6" or TEKS "3.4A" vs today's "4.nbt.1"). These rows are already
// ignored by topic selection and the mastery API; this removes them for good.
// POST with no body cleans all children; POST {"childId": "..."} cleans one.
export async function POST(request: Request) {
  try {
    await requireUser();
    let childId: string | undefined;
    try {
      const body = await request.json();
      childId = body?.childId;
    } catch {
      // no body — clean all children
    }

    const children = await prisma.child.findMany(
      childId ? { where: { id: childId } } : undefined
    );

    const results: Array<{ child: string; deleted: number; kept: number }> = [];
    for (const child of children) {
      const pool = new Set(
        resolveCurriculumForChild(child).topics.map((t) => t.id)
      );
      const rows = await prisma.topicMastery.findMany({ where: { childId: child.id } });
      const orphanIds = rows.filter((r) => !pool.has(r.topicId)).map((r) => r.id);
      if (orphanIds.length > 0) {
        await prisma.topicMastery.deleteMany({ where: { id: { in: orphanIds } } });
      }
      results.push({
        child: child.name,
        deleted: orphanIds.length,
        kept: rows.length - orphanIds.length,
      });
    }

    return NextResponse.json({ ok: true, results });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
