import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { correctMastery } from '@/lib/spaced-repetition';
import { Question, GradingQuestionResult } from '@/types';

interface OverrideInput {
  number: number;
  isCorrect: boolean;
}

// Per-topic correct/total over a results array, scoped to the topics that matter.
function topicScore(
  results: GradingQuestionResult[],
  questionTopic: Map<number, string>,
  topicId: string
): number {
  let correct = 0;
  let total = 0;
  for (const r of results) {
    if (questionTopic.get(r.number) !== topicId) continue;
    total++;
    if (r.isCorrect) correct++;
  }
  return total === 0 ? 0 : (correct / total) * 100;
}

// Manually override the AI's grading on individual questions, then recompute the
// score and feed the CORRECTED grades into spaced repetition (so the teacher's
// judgment — not the AI's mistake — drives the practice plan).
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const { gradingResultId, overrides } = (await request.json()) as {
      gradingResultId?: string;
      overrides?: OverrideInput[];
    };

    if (!gradingResultId || !Array.isArray(overrides) || overrides.length === 0) {
      return NextResponse.json(
        { error: 'gradingResultId and a non-empty overrides array are required' },
        { status: 400 }
      );
    }

    const gradingResult = await prisma.gradingResult.findUnique({
      where: { id: gradingResultId },
      include: { worksheet: { include: { child: true } } },
    });

    if (!gradingResult || gradingResult.worksheet.child.userId !== user.id) {
      return NextResponse.json({ error: 'Grading result not found' }, { status: 404 });
    }

    const originalResults = JSON.parse(gradingResult.resultsJson) as GradingQuestionResult[];
    const questions = JSON.parse(gradingResult.worksheet.questionsJson) as Question[];
    const questionTopic = new Map<number, string>();
    for (const q of questions) questionTopic.set(q.number, q.topicId);

    // Apply overrides.
    const overrideMap = new Map(overrides.map((o) => [o.number, o.isCorrect]));
    const changedNumbers = new Set<number>();
    const correctedResults: GradingQuestionResult[] = originalResults.map((r) => {
      if (!overrideMap.has(r.number)) return r;
      const isCorrect = overrideMap.get(r.number)!;
      if (isCorrect === r.isCorrect) return r;
      changedNumbers.add(r.number);
      return {
        ...r,
        isCorrect,
        feedback: isCorrect ? 'Marked correct by reviewer' : r.feedback || 'Marked incorrect by reviewer',
      };
    });

    if (changedNumbers.size === 0) {
      return NextResponse.json({
        gradingResult: {
          id: gradingResult.id,
          totalQuestions: gradingResult.totalQuestions,
          correctCount: gradingResult.correctCount,
          scorePercent: gradingResult.scorePercent,
          results: originalResults,
        },
      });
    }

    // Recompute summary.
    const correctCount = correctedResults.filter((r) => r.isCorrect).length;
    const totalQuestions = correctedResults.length;
    const scorePercent = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 10000) / 100;

    // Re-feed spaced repetition for each affected topic.
    const affectedTopics = new Set<string>();
    for (const n of Array.from(changedNumbers)) {
      const t = questionTopic.get(n);
      if (t) affectedTopics.add(t);
    }
    for (const topicId of Array.from(affectedTopics)) {
      const previous = topicScore(originalResults, questionTopic, topicId);
      const corrected = topicScore(correctedResults, questionTopic, topicId);
      await correctMastery(gradingResult.worksheet.childId, topicId, previous, corrected);
    }

    const updated = await prisma.gradingResult.update({
      where: { id: gradingResultId },
      data: {
        resultsJson: JSON.stringify(correctedResults),
        correctCount,
        scorePercent,
      },
    });

    return NextResponse.json({
      gradingResult: {
        id: updated.id,
        totalQuestions,
        correctCount,
        scorePercent,
        results: correctedResults,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Override error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Override failed' },
      { status: 500 }
    );
  }
}
