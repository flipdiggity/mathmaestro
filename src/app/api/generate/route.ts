import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { verifyChildOwnership } from '@/lib/ownership';
import { checkUsageAllowance, recordUsage } from '@/lib/billing';
import { resolveCurriculumForChild } from '@/lib/curriculum/courses';
import { generateAdaptiveWorksheet } from '@/lib/worksheet-generation';
import { TopicSelection } from '@/lib/curriculum/types';

// Single-sheet generation. Thin wrapper over the SHARED generation core (the
// same one the batch and daily-cron paths use) — this route used to carry its
// own inline copy of the pipeline, which drifted from the core.
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { childId, questionCount = 25, selectedTopicIds } = body;

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

    // Parent hand-picked topics bypass adaptive selection.
    let forcedSelections: TopicSelection[] | undefined;
    if (selectedTopicIds && selectedTopicIds.length > 0) {
      const { topics } = resolveCurriculumForChild(child);
      forcedSelections = topics
        .filter((t) => selectedTopicIds.includes(t.id))
        .map((t) => ({ topic: t, reason: 'current' as const, priority: 100 }));
      if (forcedSelections.length === 0) {
        return NextResponse.json({ error: 'Selected topics not found' }, { status: 400 });
      }
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[new Date().getDay()];

    const result = await generateAdaptiveWorksheet(child, {
      questionCount,
      dayOfWeek,
      forcedSelections,
    });

    await recordUsage(user.id, 'generate', result.worksheetId);

    return NextResponse.json({
      worksheet: {
        id: result.worksheetId,
        title: result.title,
        dayOfWeek,
        weekNumber: null,
        questions: result.questions,
        topicIds: result.topicIds,
      },
      pacing: result.pacing,
      plan: result.plan
        ? {
            remaining: result.plan.remaining,
            weekdaysLeft: result.plan.weekdaysLeft,
            paceNeeded: result.plan.paceNeeded,
            onTrack: result.plan.onTrack,
          }
        : null,
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
