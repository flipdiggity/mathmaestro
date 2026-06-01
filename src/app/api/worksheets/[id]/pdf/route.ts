import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { verifyWorksheetOwnership } from '@/lib/ownership';
import { renderWorksheetPDF, TopicReviewRef } from '@/lib/pdf/render';
import { getTopicById } from '@/lib/curriculum';
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

    // Build the "Before you start" review block from the worksheet's topics.
    let topicReviews: TopicReviewRef[] = [];
    try {
      const topicIds: string[] = JSON.parse(worksheet.topicIdsJson);
      topicReviews = topicIds
        .map((id) => getTopicById(id))
        .filter((t): t is NonNullable<typeof t> => Boolean(t))
        .map((t) => ({ topicName: t.name, bookRefs: t.bookRefs }));
    } catch {
      // No/invalid topicIdsJson — render without the review block.
    }

    const pdfBuffer = await renderWorksheetPDF(
      worksheet.title,
      worksheet.child.name,
      questions,
      undefined,
      topicReviews
    );

    await prisma.worksheet.update({
      where: { id: params.id },
      data: { status: 'printed' },
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${worksheet.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
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
