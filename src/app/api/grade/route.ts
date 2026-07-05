import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { verifyWorksheetOwnership } from '@/lib/ownership';
import { checkUsageAllowance, recordUsage } from '@/lib/billing';
import { gradeWithMultipleImages } from '@/lib/anthropic';
import { buildGradePrompt } from '@/lib/prompts/grade-worksheet';
import { updateMastery } from '@/lib/spaced-repetition';
import { updateAfterGrade, GradedQuestionOutcome } from '@/lib/adaptive';
import { Question, GradingQuestionResult } from '@/types';
import sharp from 'sharp';

// Preprocess a phone photo for the vision grader: auto-orient from EXIF (kids'
// photos are often rotated), flatten onto white, grayscale + contrast-normalize
// to make pencil legible, cap the long edge to keep the payload small, and
// re-encode as JPEG. Falls back to the original bytes if sharp throws.
async function preprocessPhoto(
  input: Buffer
): Promise<{ base64: string; mediaType: 'image/jpeg' }> {
  const processed = await sharp(input)
    .rotate() // auto-orient using EXIF
    .flatten({ background: '#ffffff' })
    .grayscale()
    .normalize() // stretch contrast so faint pencil reads clearly
    .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();
  return { base64: processed.toString('base64'), mediaType: 'image/jpeg' };
}

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

    let images;
    try {
      images = await Promise.all(
        photoFiles.map(async (photo) => {
          const bytes = await photo.arrayBuffer();
          const buffer = Buffer.from(bytes);

          try {
            return await preprocessPhoto(buffer);
          } catch (sharpErr) {
            // Sharp couldn't decode (unusual format, corrupt) — fall back to raw.
            console.error('Photo preprocess failed, using raw image:', sharpErr);
            let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg';
            if (photo.type === 'image/png') mediaType = 'image/png';
            else if (photo.type === 'image/webp') mediaType = 'image/webp';
            return { base64: buffer.toString('base64'), mediaType };
          }
        })
      );
    } catch (imgError) {
      console.error('Image processing error:', imgError);
      return NextResponse.json(
        { error: 'Failed to process uploaded images. Try smaller or fewer photos.' },
        { status: 400 }
      );
    }

    const { system, prompt } = buildGradePrompt(questions);

    let responseText;
    try {
      // Budget covers the model's adaptive thinking (it re-derives answers
      // while reading the handwriting) plus the per-question JSON.
      responseText = await gradeWithMultipleImages(images, prompt, { system, maxTokens: 16384 });
    } catch (aiError) {
      console.error('AI grading API error:', aiError);
      return NextResponse.json(
        { error: 'AI grading service error. The image may be too large or unclear. Please try again with a clearer photo.' },
        { status: 502 }
      );
    }

    let cleaned = responseText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    // The model returns a compact result (number, studentAnswer, isCorrect,
    // feedback) — it no longer echoes question text or the correct answer, which
    // keeps the response small and avoids truncation at 50 questions. We backfill
    // those fields here from the worksheet's own answer key.
    let rawData: {
      results: Array<{
        number: number;
        studentAnswer?: string;
        isCorrect?: boolean;
        feedback?: string;
      }>;
    };

    try {
      rawData = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse grading results', raw: responseText },
        { status: 500 }
      );
    }

    const gradedByNumber = new Map((rawData.results ?? []).map((r) => [r.number, r]));

    // One enriched result per worksheet question, in order. Any question the
    // model didn't return is treated as unanswered/incorrect.
    const enrichedResults: GradingQuestionResult[] = questions.map((q) => {
      const g = gradedByNumber.get(q.number);
      return {
        number: q.number,
        question: q.question,
        correctAnswer: q.answer,
        studentAnswer: g?.studentAnswer ?? 'blank',
        isCorrect: g?.isCorrect ?? false,
        feedback: g?.feedback ?? (g ? '' : 'No answer found / left blank'),
      };
    });

    const totalQuestions = enrichedResults.length;
    const correctCount = enrichedResults.filter((r) => r.isCorrect).length;
    const scorePercent =
      totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 10000) / 100;

    const gradingData = { results: enrichedResults, totalQuestions, correctCount, scorePercent };

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

    // Per-topic outcomes: drive BOTH the mastery EMA and the adaptive
    // difficulty ladder + miss-retry memory.
    const topicOutcomes = new Map<
      string,
      { name: string; outcomes: GradedQuestionOutcome[] }
    >();
    for (const result of gradingData.results) {
      const question = questions.find((q) => q.number === result.number);
      if (!question) continue;

      const entry = topicOutcomes.get(question.topicId) || {
        name: question.topicName,
        outcomes: [],
      };
      entry.outcomes.push({
        difficulty: question.difficulty || 1,
        isCorrect: result.isCorrect,
        question: question.question,
        studentAnswer: result.studentAnswer,
        feedback: result.feedback,
      });
      topicOutcomes.set(question.topicId, entry);
    }

    for (const [topicId, { name, outcomes }] of Array.from(topicOutcomes.entries())) {
      const correct = outcomes.filter((o) => o.isCorrect).length;
      const scorePercent = (correct / outcomes.length) * 100;
      await updateMastery(
        worksheet.childId,
        topicId,
        name,
        worksheet.child.grade,
        scorePercent
      );
      // Difficulty ladder: ≥85% at the served level moves up (toward Challenge),
      // <60% moves down; wrong answers become targeted-retry material tomorrow.
      await updateAfterGrade(worksheet.childId, topicId, outcomes);
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
