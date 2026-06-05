import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { verifyChildOwnership } from '@/lib/ownership';
import { getTopicsForChild, getTopicById } from '@/lib/curriculum';

const KNOWN = 80; // mastery >= this counts as "known/skip" (matches the sequencing frontier)

// GET: the child's curriculum grouped by grade + nine-weeks, each topic tagged
// with its current mastery and whether it's marked known (skipped).
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const child = await verifyChildOwnership(params.id, user.id);
    if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 });

    const topics = getTopicsForChild(child.grade, child.track, child.state, child.district);
    const mastery = await prisma.topicMastery.findMany({ where: { childId: params.id } });
    const masteryById = new Map(mastery.map((m) => [m.topicId, m.mastery]));

    // Group by grade, then nine-weeks.
    const grades = Array.from(new Set(topics.map((t) => t.gradeLevel))).sort((a, b) => a - b);
    const result = grades.map((grade) => {
      const gradeTopics = topics.filter((t) => t.gradeLevel === grade);
      const periods = [1, 2, 3, 4].map((nw) => ({
        nineWeeks: nw,
        topics: gradeTopics
          .filter((t) => t.nineWeeks === nw)
          .sort((a, b) => a.order - b.order)
          .map((t) => {
            const m = masteryById.get(t.id);
            return {
              id: t.id,
              name: t.name,
              strand: t.strand,
              order: t.order,
              mastery: m ?? null,
              known: (m ?? -1) >= KNOWN,
            };
          }),
      })).filter((p) => p.topics.length > 0);
      return { grade, periods };
    });

    return NextResponse.json({ grade: child.grade, track: child.track, curriculum: result });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to load curriculum' }, { status: 500 });
  }
}

// POST: mark a topic as known (skip — sets mastery to 100 so the generator moves
// past it) or not-known (removes the record so it re-enters the queue).
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const child = await verifyChildOwnership(params.id, user.id);
    if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 });

    const { topicId, known } = (await request.json()) as { topicId?: string; known?: boolean };
    if (!topicId || typeof known !== 'boolean') {
      return NextResponse.json({ error: 'topicId and known are required' }, { status: 400 });
    }

    const topic = getTopicById(topicId);
    if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });

    if (known) {
      await prisma.topicMastery.upsert({
        where: { childId_topicId: { childId: params.id, topicId } },
        update: { mastery: 100, lastPracticedAt: new Date() },
        create: {
          childId: params.id,
          topicId,
          topicName: topic.name,
          gradeLevel: topic.gradeLevel,
          mastery: 100,
          timesPracticed: 0,
          lastPracticedAt: new Date(),
        },
      });
    } else {
      await prisma.topicMastery.deleteMany({ where: { childId: params.id, topicId } });
    }

    return NextResponse.json({ ok: true, topicId, known });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 });
  }
}
