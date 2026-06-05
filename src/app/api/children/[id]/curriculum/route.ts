import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { verifyChildOwnership } from '@/lib/ownership';
import { getTopicsForChild, getTopicById } from '@/lib/curriculum';
import { orderedSequence, floorIndexFor, getStartFloor } from '@/lib/curriculum/sequencing';

const KNOWN = 80; // mastery >= this counts as "known/skip" (matches the sequencing frontier)

// Aggregate right/wrong per topic across all of a child's GRADED worksheets.
async function topicScores(childId: string): Promise<Map<string, { correct: number; total: number }>> {
  const graded = await prisma.worksheet.findMany({
    where: { childId, gradingResult: { isNot: null } },
    include: { gradingResult: true },
  });
  const scores = new Map<string, { correct: number; total: number }>();
  for (const ws of graded) {
    try {
      const questions = JSON.parse(ws.questionsJson) as Array<{ number: number; topicId: string }>;
      const byNumber = new Map(questions.map((q) => [q.number, q.topicId]));
      const results = JSON.parse(ws.gradingResult!.resultsJson) as Array<{ number: number; isCorrect: boolean }>;
      for (const r of results) {
        const topicId = byNumber.get(r.number);
        if (!topicId) continue;
        const s = scores.get(topicId) ?? { correct: 0, total: 0 };
        s.total += 1;
        if (r.isCorrect) s.correct += 1;
        scores.set(topicId, s);
      }
    } catch {
      // skip unparseable
    }
  }
  return scores;
}

// GET: the child's curriculum grouped by grade + semester, each topic tagged with
// its known/skip status and a real score (right/wrong) from graded homework.
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
    const scores = await topicScores(params.id);

    // The frontier: the next not-yet-mastered topic worksheets are focused on now.
    const seq = orderedSequence(topics);
    const floor = floorIndexFor(seq, getStartFloor(child.name, child.grade));
    let frontierId: string | null = null;
    for (let i = floor; i < seq.length; i++) {
      if ((masteryById.get(seq[i].id) ?? -1) < KNOWN) {
        frontierId = seq[i].id;
        break;
      }
    }

    // Two semesters per grade: nine-weeks 1-2 = 1st semester, 3-4 = 2nd semester.
    const SEMESTERS = [
      { semester: 1, label: '1st Semester', weeks: [1, 2] },
      { semester: 2, label: '2nd Semester', weeks: [3, 4] },
    ];

    const grades = Array.from(new Set(topics.map((t) => t.gradeLevel))).sort((a, b) => a - b);
    const result = grades.map((grade) => {
      const gradeTopics = topics.filter((t) => t.gradeLevel === grade);
      const periods = SEMESTERS.map((sem) => ({
        semester: sem.semester,
        label: sem.label,
        topics: gradeTopics
          .filter((t) => sem.weeks.includes(t.nineWeeks))
          .sort((a, b) => a.order - b.order)
          .map((t) => {
            const m = masteryById.get(t.id);
            const sc = scores.get(t.id);
            return {
              id: t.id,
              name: t.name,
              strand: t.strand,
              order: t.order,
              mastery: m ?? null,
              known: (m ?? -1) >= KNOWN,
              correct: sc?.correct ?? 0,
              total: sc?.total ?? 0,
              upNext: t.id === frontierId,
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
