import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateText } from '@/lib/anthropic';
import { selectTopics, type Pacing } from '@/lib/spaced-repetition';
import { getTopicsForChild } from '@/lib/curriculum';
import { buildGeneratePrompt } from '@/lib/prompts/generate-worksheet';
import { verifyWorksheetAnswers } from '@/lib/answer-verifier';
import { Question } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      childId,
      questionCount = 30,
      selectedTopicIds,
      days,
    }: {
      childId: string;
      questionCount?: number;
      selectedTopicIds?: string[];
      days: string[];
    } = body;

    if (!days || days.length === 0) {
      return NextResponse.json({ error: 'No days selected' }, { status: 400 });
    }

    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const allTopics = getTopicsForChild(child.grade, child.track);

    // Track which new topics have been assigned across days so they advance
    const excludeNewTopicIds = new Set<string>();
    const worksheets: Array<{
      id: string;
      title: string;
      dayOfWeek: string;
      weekNumber: number;
      questions: Question[];
      topicIds: string[];
    }> = [];

    let pacing: Pacing = 'steady';
    const weekNumber = getWeekNumber(new Date());

    // Generate one worksheet per day sequentially
    for (const day of days) {
      let selections;

      if (selectedTopicIds && selectedTopicIds.length > 0) {
        // Manual topic selection - same topics each day but different questions
        const selectedTopics = allTopics.filter((t) =>
          selectedTopicIds.includes(t.id)
        );
        selections = selectedTopics.map((t) => ({
          topic: t,
          reason: 'new' as const,
          priority: 100,
        }));
      } else {
        // Auto-select via spaced repetition with exclusions for advancing topics
        const result = await selectTopics(
          childId,
          allTopics,
          questionCount,
          child.targetTestDate,
          excludeNewTopicIds
        );
        selections = result.selections;
        pacing = result.pacing;

        // Only exclude primary frontier new topics, not fill-ins
        for (const id of result.primaryNewTopicIds) {
          excludeNewTopicIds.add(id);
        }
      }

      if (selections.length === 0) {
        continue;
      }

      // Build reason lookup
      const topicReasonMap = new Map<string, 'new' | 'review'>();
      for (const s of selections) {
        topicReasonMap.set(s.topic.id, s.reason);
      }

      // Build image topic lookup
      const imageTopicMap = new Map<string, { requiresImage: boolean; imageType?: string }>();
      for (const t of allTopics) {
        if (t.requiresImage) {
          imageTopicMap.set(t.id, { requiresImage: true, imageType: t.imageType });
        }
      }

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

      let cleaned = responseText.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned
          .replace(/^```(?:json)?\n?/, '')
          .replace(/\n?```$/, '');
      }

      let parsed: { title: string; questions: Question[] };
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Skip this day if parsing fails
        continue;
      }

      const verifiedQuestions = verifyWorksheetAnswers(parsed.questions);
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

      const worksheet = await prisma.worksheet.create({
        data: {
          childId,
          title: `${day}: ${parsed.title}`,
          weekNumber,
          dayOfWeek: day,
          questionsJson: JSON.stringify(questions),
          topicIdsJson: JSON.stringify(selections.map((s) => s.topic.id)),
          status: 'generated',
        },
      });

      worksheets.push({
        id: worksheet.id,
        title: parsed.title,
        dayOfWeek: day,
        weekNumber,
        questions,
        topicIds: selections.map((s) => s.topic.id),
      });
    }

    if (worksheets.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any worksheets' },
        { status: 500 }
      );
    }

    return NextResponse.json({ worksheets, pacing });
  } catch (error) {
    console.error('Batch generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Batch generation failed' },
      { status: 500 }
    );
  }
}

function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.ceil((diff / (1000 * 60 * 60 * 24) + start.getDay() + 1) / 7);
}
