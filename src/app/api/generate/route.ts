import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateText } from '@/lib/anthropic';
import { selectTopics } from '@/lib/spaced-repetition';
import { getTopicsForChild } from '@/lib/curriculum';
import { buildGeneratePrompt } from '@/lib/prompts/generate-worksheet';
import { verifyWorksheetAnswers } from '@/lib/answer-verifier';
import { Question } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { childId, questionCount = 30, selectedTopicIds } = body;

    // Get child info
    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Get curriculum topics for this child
    const allTopics = getTopicsForChild(child.grade, child.track);

    let selections;
    let pacing: 'accelerating' | 'steady' | 'reinforcing' = 'steady';

    if (selectedTopicIds && selectedTopicIds.length > 0) {
      // Manual topic selection
      const selectedTopics = allTopics.filter((t) => selectedTopicIds.includes(t.id));
      selections = selectedTopics.map((t) => ({
        topic: t,
        reason: 'new' as const,
        priority: 100,
      }));
    } else {
      // Auto-select via spaced repetition
      const result = await selectTopics(childId, allTopics, questionCount, child.targetTestDate);
      selections = result.selections;
      pacing = result.pacing;
    }

    if (selections.length === 0) {
      return NextResponse.json({ error: 'No topics available for this child' }, { status: 400 });
    }

    // Build a lookup from topicId -> reason for section tagging
    const topicReasonMap = new Map<string, 'new' | 'review'>();
    for (const s of selections) {
      topicReasonMap.set(s.topic.id, s.reason);
    }

    // Build prompt and generate
    const { system, prompt } = buildGeneratePrompt(
      child.name,
      child.grade,
      selections,
      questionCount
    );

    const responseText = await generateText(prompt, {
      system,
      temperature: 0.3,
      maxTokens: 8192,
    });

    // Parse response - handle potential markdown code fences
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

    // Verify answers programmatically
    const verifiedQuestions = verifyWorksheetAnswers(parsed.questions);

    // Build topics that require images
    const imageTopicMap = new Map<string, { requiresImage: boolean; imageType?: string }>();
    for (const t of allTopics) {
      if (t.requiresImage) {
        imageTopicMap.set(t.id, { requiresImage: true, imageType: t.imageType });
      }
    }

    const questions: Question[] = verifiedQuestions.map((q) => {
      // Assign section from Claude's output, or fall back to the selection reason
      const section = q.section || topicReasonMap.get(q.topicId) || 'new';
      // Assign grid info from Claude's output or from curriculum topic metadata
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

    // Determine day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const dayOfWeek = days[today.getDay()];
    const weekNumber = getWeekNumber(today);

    // Save to database
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
