import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { renderBatchWorksheetPDF } from '@/lib/pdf/render';
import { Question } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { worksheetIds }: { worksheetIds: string[] } = await request.json();

    if (!worksheetIds || worksheetIds.length === 0) {
      return NextResponse.json({ error: 'No worksheet IDs provided' }, { status: 400 });
    }

    const worksheets = await prisma.worksheet.findMany({
      where: { id: { in: worksheetIds } },
      include: { child: true },
      orderBy: { createdAt: 'asc' },
    });

    if (worksheets.length === 0) {
      return NextResponse.json({ error: 'No worksheets found' }, { status: 404 });
    }

    const childName = worksheets[0].child.name;

    const days = worksheets.map((ws) => ({
      title: ws.title,
      questions: JSON.parse(ws.questionsJson) as Question[],
    }));

    const pdfBuffer = await renderBatchWorksheetPDF(childName, days);

    // Update all worksheets to printed
    await prisma.worksheet.updateMany({
      where: { id: { in: worksheetIds } },
      data: { status: 'printed' },
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${childName}_week_worksheets.pdf"`,
      },
    });
  } catch (error) {
    console.error('Batch PDF error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Batch PDF failed' },
      { status: 500 }
    );
  }
}
