import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { verifyWorksheetOwnership } from '@/lib/ownership';
import { checkUsageAllowance, recordUsage } from '@/lib/billing';
import { gradeWithMultipleImages } from '@/lib/anthropic';
import { buildGradePrompt } from '@/lib/prompts/grade-worksheet';
import { updateMastery } from '@/lib/spaced-repetition';
import { Question, GradingQuestionResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const formData = await request.formData();
    const worksheetId = formData.get('worksheetId') as string;

    let photoFiles = formData.getAll('photos').filter((f): f is File => f instanceof File);
    if (photoFiles.length === 0) {
      const singlePhoto = formData.get('photo');
      if (singlePhoto instanceof File) {
        photoFiles = [singlePhoto];
      }
    }

    if (!worksheetId || photoFiles.length === 0) {
      return NextResponse.json(
        { error: 'worksheetId and at least one photo are required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const worksheet = await verifyWorksheetOwnership(worksheetId, user.id);
    if (!worksheet) {
      return NextResponse.json({ error: 'Worksheet not found' }, { status: 404 });
    }

    // Check billing
    const allowed = await checkUsageAllowance(user.id, 'grade');
    if (!allowed.allowed) {
      return NextResponse.json(
        { error: 'Usage limit reached', requiresPayment: true, message: allowed.message },
        { status: 402 }
      );
    }

    const questions: Question[] = JSON.parse(worksheet.questionsJson);

    const images = await Promise.all(
      photoFiles.map(async (photo) => {
        const bytes = await photo.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');

        let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg';
        if (photo.type === 'image/png') mediaType = 'image/png';
        else if (photo.type === 'image/webp') mediaType = 'image/webp';

        return { base64, mediaType };
      })
    );

    const { system, prompt } = buildGradePrompt(questions);
    const responseText = await gradeWithMultipleImages(images, prompt, { system });

    let cleaned = responseText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    let gradingData: {
      results: GradingQuestionResult[];
      totalQuestions: number;
      correctCount: number;
      scorePercent: number;
    };

    try {
      gradingData = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse grading results', raw: responseText },
        { status: 500 }
      );
    }

    const gradingResult = await prisma.gradingResult.create({
      data: {
        worksheetId,
        totalQuestions: gradingData.totalQuestions,
        correctCount: gradingData.correctCount,
        scorePercent: gradingData.scorePercent,
        resultsJson: JSON.stringify(gradingData.results),
      },
    });

    await prisma.worksheet.update({
      where: { id: worksheetId },
      data: { status: 'graded' },
    });

    // Record usage
    await recordUsage(user.id, 'grade', worksheetId);

    const topicScores = new Map<string, { correct: number; total: number; name: string; grade: number }>();
    for (const result of gradingData.results) {
      const question = questions.find((q) => q.number === result.number);
      if (!question) continue;

      const existing = topicScores.get(question.topicId) || {
        correct: 0,
        total: 0,
        name: question.topicName,
        grade: 0,
      };
      existing.total++;
      if (result.isCorrect) existing.correct++;
      existing.name = question.topicName;
      topicScores.set(question.topicId, existing);
    }

    for (const [topicId, scores] of Array.from(topicScores.entries())) {
      const scorePercent = (scores.correct / scores.total) * 100;
      await updateMastery(
        worksheet.childId,
        topicId,
        scores.name,
        worksheet.child.grade,
        scorePercent
      );
    }

    return NextResponse.json({
      gradingResult: {
        id: gradingResult.id,
        totalQuestions: gradingData.totalQuestions,
        correctCount: gradingData.correctCount,
        scorePercent: gradingData.scorePercent,
        results: gradingData.results,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Grading error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Grading failed' },
      { status: 500 }
    );
  }
}
