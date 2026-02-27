import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { verifyChildOwnership } from '@/lib/ownership';
import { checkUsageAllowance, recordUsage } from '@/lib/billing';
import { generateText } from '@/lib/anthropic';
import { selectTopics } from '@/lib/spaced-repetition';
import { getTopicsForChild } from '@/lib/curriculum';
import { buildGeneratePrompt } from '@/lib/prompts/generate-worksheet';
import { verifyWorksheetAnswers } from '@/lib/answer-verifier';
import { Question } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { childId, questionCount = 30, selectedTopicIds } = body;

    // Verify ownership
    const child = await verifyChildOwnership(childId, user.id);
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Check billing
    const allowed = await checkUsageAllowance(user.id, 'generate');
    if (!allowed.allowed) {
      return NextResponse.json(
        { error: 'Usage limit reached', requiresPayment: true, message: allowed.message },
        { status: 402 }
      );
    }

    // Get curriculum topics for this child
    const allTopics = getTopicsForChild(child.grade, child.track, child.state, child.district);

    let selections;
    let pacing: 'accelerating' | 'steady' | 'reinforcing' = 'steady';

    if (selectedTopicIds && selectedTopicIds.length > 0) {
      const selectedTopics = allTopics.filter((t) => selectedTopicIds.includes(t.id));
      selections = selectedTopics.map((t) => ({
        topic: t,
        reason: 'new' as const,
        priority: 100,
      }));
    } else {
      const result = await selectTopics(childId, allTopics, questionCount, child.targetTestDate);
      selections = result.selections;
      pacing = result.pacing;
    }

    if (selections.length === 0) {
      return NextResponse.json({ error: 'No topics available for this child' }, { status: 400 });
    }

    const topicReasonMap = new Map<string, 'new' | 'review'>();
    for (const s of selections) {
      topicReasonMap.set(s.topic.id, s.reason);
    }

    const { system, prompt } = buildGeneratePrompt(
      child.name,
      child.grade,
      selections,
      questionCount
    );

    const responseText = await generateText(prompt, {
      system,
      temperature: 0.7,
      maxTokens: 8192,
    });

    let cleaned = responseText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    let parsed: { title: string; questions: Question[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse generated worksheet', raw: responseText },
        { status: 500 }
      );
    }

    const verifiedQuestions = verifyWorksheetAnswers(parsed.questions);

    const imageTopicMap = new Map<string, { requiresImage: boolean; imageType?: string }>();
    for (const t of allTopics) {
      if (t.requiresImage) {
        imageTopicMap.set(t.id, { requiresImage: true, imageType: t.imageType });
      }
    }

    const questions: Question[] = verifiedQuestions.map((q) => {
      const section = q.section || topicReasonMap.get(q.topicId) || 'new';
      const imgMeta = imageTopicMap.get(q.topicId);
      return {
        number: q.number,
        question: q.question,
        answer: q.answer,
        topicId: q.topicId,
        topicName: q.topicName,
        difficulty: q.difficulty,
        isVerifiable: q.isVerifiable,
        section: section as 'new' | 'review',
        hasGrid: q.hasGrid || imgMeta?.requiresImage || false,
        gridType: q.gridType || (imgMeta?.imageType as Question['gridType']) || undefined,
      };
    });

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const dayOfWeek = days[today.getDay()];
    const weekNumber = getWeekNumber(today);

    const worksheet = await prisma.worksheet.create({
      data: {
        childId,
        title: parsed.title,
        weekNumber,
        dayOfWeek,
        questionsJson: JSON.stringify(questions),
        topicIdsJson: JSON.stringify(selections.map((s) => s.topic.id)),
        status: 'generated',
      },
    });

    // Record usage
    await recordUsage(user.id, 'generate', worksheet.id);

    return NextResponse.json({
      worksheet: {
        id: worksheet.id,
        title: worksheet.title,
        dayOfWeek,
        weekNumber,
        questions,
        topicIds: selections.map((s) => s.topic.id),
      },
      pacing,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}

function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.ceil((diff / (1000 * 60 * 60 * 24) + start.getDay() + 1) / 7);
}
