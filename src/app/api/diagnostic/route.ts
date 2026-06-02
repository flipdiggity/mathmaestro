import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { verifyChildOwnership } from '@/lib/ownership';
import { checkUsageAllowance, recordUsage } from '@/lib/billing';
import { generateText } from '@/lib/anthropic';
import { getDiagnosticProbe } from '@/lib/curriculum/diagnostics';
import { buildDiagnosticPrompt } from '@/lib/prompts/diagnostic-worksheet';
import { verifyWorksheetAnswers } from '@/lib/answer-verifier';
import { sanitizeStudentDrawFigure } from '@/lib/student-figure';
import { Question } from '@/types';

// Generates a Week-1 diagnostic placement worksheet for a child. The result is
// stored as a normal Worksheet, so it prints through /api/worksheets/[id]/pdf
// and, once graded, seeds TopicMastery via the normal grading path.
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const { childId } = await request.json();

    if (!childId) {
      return NextResponse.json({ error: 'childId is required' }, { status: 400 });
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

    const probe = getDiagnosticProbe({
      name: child.name,
      grade: child.grade,
      track: child.track,
      state: child.state,
      district: child.district,
    });

    if (probe.topics.length === 0) {
      return NextResponse.json(
        { error: 'No diagnostic probe available for this child' },
        { status: 400 }
      );
    }

    const { system, prompt } = buildDiagnosticPrompt(
      child.name,
      child.grade,
      probe.topics,
      probe.questionsPerTopic
    );

    const responseText = await generateText(prompt, {
      system,
      temperature: 0.4,
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
        { error: 'Failed to parse generated diagnostic', raw: responseText },
        { status: 500 }
      );
    }

    const verifiedQuestions = verifyWorksheetAnswers(parsed.questions);
    const questions: Question[] = verifiedQuestions.map((q, idx) => {
      const { figure, expectedAnswer } = sanitizeStudentDrawFigure(q.question, q.figure, q.expectedAnswer);
      return {
        number: idx + 1,
        question: q.question,
        answer: q.answer,
        topicId: q.topicId,
        topicName: q.topicName,
        difficulty: q.difficulty,
        isVerifiable: q.isVerifiable,
        section: 'new' as const,
        figure,
        expectedAnswer,
        hasGrid: q.hasGrid || false,
        gridType: q.gridType || undefined,
      };
    });

    const title = `Diagnostic — ${probe.label}`;

    const worksheet = await prisma.worksheet.create({
      data: {
        childId,
        title,
        weekNumber: 0,
        dayOfWeek: 'Diagnostic',
        questionsJson: JSON.stringify(questions),
        topicIdsJson: JSON.stringify(probe.topics.map((t) => t.id)),
        status: 'generated',
      },
    });

    await recordUsage(user.id, 'generate', worksheet.id);

    return NextResponse.json({
      worksheet: {
        id: worksheet.id,
        title: worksheet.title,
        label: probe.label,
        description: probe.description,
        questions,
        topicIds: probe.topics.map((t) => t.id),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Diagnostic error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Diagnostic generation failed' },
      { status: 500 }
    );
  }
}
