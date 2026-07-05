import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { renderBatchWorksheetPDF, TopicReviewRef } from '@/lib/pdf/render';
import { getTopicById } from '@/lib/curriculum';
import { buildWatchInput } from '@/lib/curriculum/videos';
import { Question } from '@/types';
import { worksheetFilename } from '@/lib/utils';
import { sanitizeStudentDrawFigure } from '@/lib/student-figure';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const { worksheetIds }: { worksheetIds: string[] } = await request.json();

    if (!worksheetIds || worksheetIds.length === 0) {
      return NextResponse.json({ error: 'No worksheet IDs provided' }, { status: 400 });
    }

    const worksheets = await prisma.worksheet.findMany({
      where: { id: { in: worksheetIds } },
      include: { child: true },
      orderBy: { createdAt: 'asc' },
    });

    // Verify all worksheets belong to this user
    const unauthorized = worksheets.some((ws) => ws.child.userId !== user.id);
    if (unauthorized || worksheets.length === 0) {
      return NextResponse.json({ error: 'Worksheets not found' }, { status: 404 });
    }

    const childName = worksheets[0].child.name;

    const days = worksheets.map((ws) => {
      let topicReviews: TopicReviewRef[] = [];
      let watch: ReturnType<typeof buildWatchInput> | undefined;
      try {
        const topicIds: string[] = JSON.parse(ws.topicIdsJson);
        const topics = topicIds
          .map((id) => getTopicById(id))
          .filter((t): t is NonNullable<typeof t> => Boolean(t));
        topicReviews = topics.map((t) => ({ topicId: t.id, topicName: t.name, bookRefs: t.bookRefs }));
        watch = buildWatchInput(ws.id, topics);
      } catch {
        // No/invalid topicIdsJson — render without the review block.
      }
      return {
        title: ws.title,
        // Re-sanitize on render (caption-leak fix for previously stored sheets).
        questions: (JSON.parse(ws.questionsJson) as Question[]).map((q) => {
          const { figure, expectedAnswer } = sanitizeStudentDrawFigure(q.question, q.figure, q.expectedAnswer);
          return { ...q, figure, expectedAnswer };
        }),
        topicReviews,
        watch,
      };
    });

    const pdfBuffer = await renderBatchWorksheetPDF(childName, days);

    await prisma.worksheet.updateMany({
      where: { id: { in: worksheetIds } },
      data: { status: 'printed' },
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${worksheetFilename(childName, { plural: true })}"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Batch PDF error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Batch PDF failed' },
      { status: 500 }
    );
  }
}
