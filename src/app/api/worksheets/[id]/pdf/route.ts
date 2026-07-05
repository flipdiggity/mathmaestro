import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { verifyWorksheetOwnership } from '@/lib/ownership';
import { renderWorksheetPDF, TopicReviewRef } from '@/lib/pdf/render';
import { getTopicById } from '@/lib/curriculum';
import { buildWatchInput } from '@/lib/curriculum/videos';
import { Question } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const worksheet = await verifyWorksheetOwnership(params.id, user.id);
    if (!worksheet) {
      return NextResponse.json({ error: 'Worksheet not found' }, { status: 404 });
    }

    const questions: Question[] = JSON.parse(worksheet.questionsJson);

    // Build the "Before you start" review + "Watch first" blocks from the topics.
    let topicReviews: TopicReviewRef[] = [];
    let watch: ReturnType<typeof buildWatchInput> | undefined;
    try {
      const topicIds: string[] = JSON.parse(worksheet.topicIdsJson);
      const topics = topicIds
        .map((id) => getTopicById(id))
        .filter((t): t is NonNullable<typeof t> => Boolean(t));
      topicReviews = topics.map((t) => ({ topicId: t.id, topicName: t.name, bookRefs: t.bookRefs }));
      watch = buildWatchInput(worksheet.id, topics);
    } catch {
      // No/invalid topicIdsJson — render without the review block.
    }

    const pdfBuffer = await renderWorksheetPDF(
      worksheet.title,
      worksheet.child.name,
      questions,
      undefined,
      topicReviews,
      watch
    );

    await prisma.worksheet.update({
      where: { id: params.id },
      data: { status: 'printed' },
    });

    const datePart = (worksheet.createdAt ?? new Date()).toISOString().slice(0, 10);
    const safeName = worksheet.child.name.replace(/[^a-zA-Z0-9]/g, '_');
    const safeTitle = worksheet.title.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${safeName}_${datePart}_${safeTitle}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF generation failed' },
      { status: 500 }
    );
  }
}
