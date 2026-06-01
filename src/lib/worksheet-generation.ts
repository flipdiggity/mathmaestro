// Shared worksheet-generation core. Encapsulates "child -> topic selection ->
// LLM -> stored worksheet", including the figure + expectedAnswer passthrough
// that the PDF renderer and grader depend on. Used by the daily cron so it can
// generate adaptively without duplicating (and drifting from) the mapping logic.

import { prisma } from './db';
import { generateText } from './anthropic';
import { selectTopics } from './spaced-repetition';
import { getTopicsForChild, getTopicById } from './curriculum';
import { buildGeneratePrompt } from './prompts/generate-worksheet';
import { verifyWorksheetAnswers } from './answer-verifier';
import { TopicSelection } from './curriculum/types';
import { Question } from '@/types';
import type { TopicReviewRef } from './pdf/render';

export interface GenerationChild {
  id: string;
  name: string;
  grade: number;
  track: string;
  state: string;
  district: string;
  targetTestDate?: Date | null;
}

export interface GeneratedWorksheetResult {
  worksheetId: string;
  title: string;
  questions: Question[];
  topicIds: string[];
  topicReviews: TopicReviewRef[];
}

/**
 * Generate and store a worksheet for a child. Topic selection is mastery-driven
 * (so skills the child has missed bubble up automatically); `biasTopicIds` force-
 * includes specific topics — e.g. yesterday's missed topics — as extra review.
 */
export async function generateAdaptiveWorksheet(
  child: GenerationChild,
  opts: { questionCount?: number; biasTopicIds?: string[]; dayOfWeek?: string } = {}
): Promise<GeneratedWorksheetResult> {
  const questionCount = opts.questionCount ?? 30;
  const allTopics = getTopicsForChild(child.grade, child.track, child.state, child.district);

  const { selections } = await selectTopics(
    child.id,
    allTopics,
    questionCount,
    child.targetTestDate ?? undefined
  );

  // Force-include yesterday's missed topics as extra review practice.
  const selectionList: TopicSelection[] = [...selections];
  const present = new Set(selectionList.map((s) => s.topic.id));
  for (const id of opts.biasTopicIds ?? []) {
    if (!present.has(id)) {
      const topic = getTopicById(id);
      if (topic) {
        selectionList.push({ topic, reason: 'review', priority: 90 });
        present.add(id);
      }
    }
  }

  if (selectionList.length === 0) {
    throw new Error(`No topics available for ${child.name}`);
  }

  const topicReasonMap = new Map<string, 'new' | 'review'>();
  for (const s of selectionList) {
    topicReasonMap.set(s.topic.id, s.reason === 'review' ? 'review' : 'new');
  }

  const { system, prompt } = buildGeneratePrompt(child.name, child.grade, selectionList, questionCount);
  const responseText = await generateText(prompt, { system, temperature: 0.7, maxTokens: 8192 });

  let cleaned = responseText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned) as { title: string; questions: Question[] };
  const verifiedQuestions = verifyWorksheetAnswers(parsed.questions);

  const imageTopicMap = new Map<string, { requiresImage: boolean; imageType?: string }>();
  for (const t of allTopics) {
    if (t.requiresImage) imageTopicMap.set(t.id, { requiresImage: true, imageType: t.imageType });
  }

  const questions: Question[] = verifiedQuestions.map((q, idx) => {
    const section = q.section || topicReasonMap.get(q.topicId) || 'new';
    const imgMeta = imageTopicMap.get(q.topicId);
    return {
      number: idx + 1,
      question: q.question,
      answer: q.answer,
      topicId: q.topicId,
      topicName: q.topicName,
      difficulty: q.difficulty,
      isVerifiable: q.isVerifiable,
      section: section as 'new' | 'review',
      figure: q.figure,
      expectedAnswer: q.expectedAnswer,
      hasGrid: q.hasGrid || imgMeta?.requiresImage || false,
      gridType: q.gridType || (imgMeta?.imageType as Question['gridType']) || undefined,
    };
  });

  const topicIds = selectionList.map((s) => s.topic.id);

  const worksheet = await prisma.worksheet.create({
    data: {
      childId: child.id,
      title: parsed.title,
      weekNumber: getWeekNumber(new Date()),
      dayOfWeek: opts.dayOfWeek ?? null,
      questionsJson: JSON.stringify(questions),
      topicIdsJson: JSON.stringify(topicIds),
      status: 'generated',
    },
  });

  const topicReviews: TopicReviewRef[] = selectionList.map((s) => ({
    topicName: s.topic.name,
    bookRefs: s.topic.bookRefs,
  }));

  return { worksheetId: worksheet.id, title: parsed.title, questions, topicIds, topicReviews };
}

/**
 * Inspect a child's most recent graded worksheet and return the set of topic IDs
 * they got at least one question wrong on. Empty if nothing was graded recently.
 */
export async function getRecentlyMissedTopicIds(childId: string): Promise<string[]> {
  const worksheet = await prisma.worksheet.findFirst({
    where: { childId, gradingResult: { isNot: null } },
    include: { gradingResult: true },
    orderBy: { createdAt: 'desc' },
  });
  if (!worksheet?.gradingResult) return [];

  try {
    const questions = JSON.parse(worksheet.questionsJson) as Question[];
    const results = JSON.parse(worksheet.gradingResult.resultsJson) as Array<{
      number: number;
      isCorrect: boolean;
    }>;
    const missed = new Set<string>();
    for (const r of results) {
      if (r.isCorrect) continue;
      const q = questions.find((x) => x.number === r.number);
      if (q) missed.add(q.topicId);
    }
    return Array.from(missed);
  } catch {
    return [];
  }
}

function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.ceil((diff / (1000 * 60 * 60 * 24) + start.getDay() + 1) / 7);
}
