import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { verifyChildOwnership } from '@/lib/ownership';
import { checkUsageAllowance, recordUsage } from '@/lib/billing';
import { getTopicsForChild } from '@/lib/curriculum';
import { generateAdaptiveWorksheet } from '@/lib/worksheet-generation';
import { TopicSelection } from '@/lib/curriculum/types';
import { Question } from '@/types';

// Multi-day batch generation. Each day reuses the SAME shared generation core
// as the single-sheet and cron paths (no drift), with the current-topic window
// sliding forward ONE topic per day. A week of sheets therefore practices the
// frontier with heavy overlap and fresh problems, instead of leaping a whole
// topic-window per day and racing into material the child has never seen.
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const {
      childId,
      questionCount = 25,
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

    const child = await verifyChildOwnership(childId, user.id);
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const allowed = await checkUsageAllowance(user.id, 'generate');
    if (!allowed.allowed) {
      return NextResponse.json(
        { error: 'Usage limit reached', requiresPayment: true, message: allowed.message },
        { status: 402 }
      );
    }

    // Parent hand-picked topics → same topics every day (variety comes from
    // the avoid-list); otherwise adaptive with the sliding window.
    let forcedSelections: TopicSelection[] | undefined;
    if (selectedTopicIds && selectedTopicIds.length > 0) {
      const allTopics = getTopicsForChild(child.grade, child.track, child.state, child.district);
      forcedSelections = allTopics
        .filter((t) => selectedTopicIds.includes(t.id))
        .map((t) => ({ topic: t, reason: 'current' as const, priority: 100 }));
      if (forcedSelections.length === 0) {
        return NextResponse.json({ error: 'Selected topics not found' }, { status: 400 });
      }
    }

    const avoidQuestions: string[] = [];
    const now = new Date();
    const weekNumber = Math.ceil(
      ((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86_400_000 +
        new Date(now.getFullYear(), 0, 1).getDay() +
        1) /
        7
    );
    const worksheets: Array<{
      id: string;
      title: string;
      dayOfWeek: string;
      weekNumber: number;
      questions: Question[];
      topicIds: string[];
    }> = [];
    const errors: Array<{ day: string; error: string }> = [];

    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      const day = days[dayIndex];
      try {
        const result = await generateAdaptiveWorksheet(
          {
            id: child.id,
            name: child.name,
            grade: child.grade,
            track: child.track,
            state: child.state,
            district: child.district,
            targetTestDate: child.targetTestDate,
          },
          {
            questionCount,
            dayOfWeek: day,
            titlePrefix: day,
            windowOffset: dayIndex,
            avoidQuestions: [...avoidQuestions],
            forcedSelections,
          }
        );

        await recordUsage(user.id, 'generate', result.worksheetId);

        for (const q of result.questions) avoidQuestions.push(q.question);
        if (avoidQuestions.length > 60) {
          avoidQuestions.splice(0, avoidQuestions.length - 60);
        }

        worksheets.push({
          id: result.worksheetId,
          title: result.title,
          dayOfWeek: day,
          weekNumber,
          questions: result.questions,
          topicIds: result.topicIds,
        });
      } catch (e) {
        errors.push({ day, error: e instanceof Error ? e.message : 'generation failed' });
      }
    }

    if (worksheets.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any worksheets', errors },
        { status: 500 }
      );
    }

    return NextResponse.json({ worksheets, errors: errors.length ? errors : undefined });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Batch generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Batch generation failed' },
      { status: 500 }
    );
  }
}
