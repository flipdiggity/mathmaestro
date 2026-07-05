import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { verifyWorksheetOwnership } from '@/lib/ownership';
import { renderWorksheetPDF, TopicReviewRef } from '@/lib/pdf/render';
import { getTopicById } from '@/lib/curriculum';
import { buildWatchInput } from '@/lib/curriculum/videos';
import { Question } from '@/types';
import { worksheetFilename } from '@/lib/utils';

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

    // Canonical name: eliana_worksheet_july_6_2026.pdf (dated to the sheet).
    const filename = worksheetFilename(worksheet.child.name, {
      date: worksheet.createdAt ?? undefined,
    });

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
