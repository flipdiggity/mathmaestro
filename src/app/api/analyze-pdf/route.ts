import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { verifyChildOwnership } from '@/lib/ownership';
import { anthropic } from '@/lib/anthropic';
import { getTopicsForChild } from '@/lib/curriculum';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const formData = await request.formData();
    const pdf = formData.get('pdf') as File | null;
    const childId = formData.get('childId') as string | null;

    if (!pdf || !childId) {
      return NextResponse.json(
        { error: 'Missing PDF file or childId' },
        { status: 400 }
      );
    }

    const child = await verifyChildOwnership(childId, user.id);
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const allTopics = getTopicsForChild(child.grade, child.track, child.state, child.district);
    const topicList = allTopics
      .map((t) => `- ${t.id}: ${t.name} (${t.strand}) — ${t.description}`)
      .join('\n');

    const arrayBuffer = await pdf.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Analyze this teacher PDF and match it to the curriculum topics below. The student is in grade ${child.grade}.

Available curriculum topics:
${topicList}

Return ONLY valid JSON (no markdown, no code fences):
{
  "summary": "Brief 1-2 sentence description of what the PDF covers",
  "matchedTopicIds": ["topic.id.1", "topic.id.2"]
}

Only include topic IDs that are clearly covered or tested in the PDF. Be precise — don't match topics that are only tangentially related.`,
            },
          ],
        },
      ],
    });

    const block = response.content[0];
    if (block.type !== 'text') {
      return NextResponse.json(
        { error: 'Unexpected response type' },
        { status: 500 }
      );
    }

    let cleaned = block.text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed: { summary: string; matchedTopicIds: string[] } = JSON.parse(cleaned);

    const validIds = new Set(allTopics.map((t) => t.id));
    const matchedTopicIds = parsed.matchedTopicIds.filter((id) => validIds.has(id));

    return NextResponse.json({
      summary: parsed.summary,
      matchedTopicIds,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Analyze PDF error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF analysis failed' },
      { status: 500 }
    );
  }
}
