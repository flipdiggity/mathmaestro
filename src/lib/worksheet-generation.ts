// Shared worksheet-generation core. Encapsulates "child -> topic selection ->
// LLM -> stored worksheet" for ALL generation paths (single, batch, daily cron):
//   • adaptive difficulty per topic (graded ladder + ungraded serve escalation)
//   • per-topic question allocation and format/figure rotation memory
//   • miss-retry problems targeting recent wrong answers
//   • serve recording so the curriculum advances even without photo grading
//   • "watch first" video links + QR for the printed sheet

import { prisma } from './db';
import { generateText } from './anthropic';
import { selectTopics } from './spaced-repetition';
import { resolveCurriculumForChild } from './curriculum/courses';
import { getVideosForTopic, watchPageUrl } from './curriculum/videos';
import {
  buildGeneratePrompt,
  allocateQuestions,
  TopicGenContext,
} from './prompts/generate-worksheet';
import { verifyWorksheetAnswers } from './answer-verifier';
import { sanitizeStudentDrawFigure } from './student-figure';
import {
  loadAdaptiveStates,
  recordServes,
  serveLevel,
  ServeRecord,
  QUESTION_FORMATS,
  AdaptiveTopicState,
} from './adaptive';
import { PlanStatus } from './plan';
import { TopicSelection, CurriculumTopic } from './curriculum/types';
import { Question, Figure } from '@/types';
import type { TopicReviewRef, WatchInput } from './pdf/render';

export interface GenerationChild {
  id: string;
  name: string;
  grade: number;
  track: string;
  state: string;
  district: string;
  targetTestDate?: Date | null;
  courseId?: string | null;
  displayGrade?: number | null;
  planEndDate?: Date | null;
}

export interface GeneratedWorksheetResult {
  worksheetId: string;
  title: string;
  questions: Question[];
  topicIds: string[];
  topicReviews: TopicReviewRef[];
  /** "Watch first" payload for the printed PDF (QR → /watch page). */
  watch: WatchInput;
  /** Study-plan status at generation time (for emails/dashboards). */
  plan?: PlanStatus;
  pacing: 'accelerating' | 'steady' | 'reinforcing';
}

/**
 * The question texts from a child's most recent worksheets, so the generator can
 * avoid repeating them day to day. Capped so the prompt doesn't balloon.
 */
export async function getRecentQuestionTexts(childId: string, maxQuestions = 45): Promise<string[]> {
  const recent = await prisma.worksheet.findMany({
    where: { childId },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { questionsJson: true },
  });
  const texts: string[] = [];
  for (const w of recent) {
    try {
      const qs = JSON.parse(w.questionsJson) as Array<{ question?: string }>;
      for (const q of qs) if (q.question) texts.push(q.question);
    } catch {
      // skip unparseable
    }
  }
  return texts.slice(0, maxQuestions);
}

// A stable, compact signature for a figure ("geometric-figure:right-triangle")
// used for the visual-variety rotation memory.
function figureSignature(fig: Figure): string {
  switch (fig.kind) {
    case 'geometric-figure':
      return `geometric-figure:${fig.shape}`;
    case 'data-display':
      return `data-display:${fig.display}`;
    case 'fraction-model':
      return `fraction-model:${fig.model}`;
    case 'net':
      return `net:${fig.solid}`;
    default:
      return fig.kind;
  }
}

function planNoteFor(plan: PlanStatus | undefined, childName: string): string | undefined {
  if (!plan || !plan.planEnd || plan.paceNeeded == null) return undefined;
  const dateStr = plan.planEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const pace = Math.round(plan.paceNeeded * 10) / 10;
  return `${childName} is on a plan to finish ${plan.remaining} remaining topics by ${dateStr} (~${pace} topics/school day${plan.onTrack === false ? ' — currently BEHIND, keep sheets focused and rigorous' : ''}).`;
}

export async function generateAdaptiveWorksheet(
  child: GenerationChild,
  opts: {
    questionCount?: number;
    biasTopicIds?: string[];
    dayOfWeek?: string;
    /** @deprecated The serve-advance rule progresses multi-day batches now. */
    windowOffset?: number;
    /** Extra question texts to avoid (e.g. earlier days of the same batch). */
    avoidQuestions?: string[];
    /** Prefix for the stored title (the batch flow uses "Monday: ..."). */
    titlePrefix?: string;
    /** Bypass adaptive selection entirely (parent hand-picked topics). */
    forcedSelections?: TopicSelection[];
  } = {}
): Promise<GeneratedWorksheetResult> {
  const questionCount = opts.questionCount ?? 25;

  // ── Topic selection + adaptive state ──
  let selectionList: TopicSelection[];
  let states: Map<string, AdaptiveTopicState>;
  let plan: PlanStatus | undefined;
  let courseLabel: string | undefined;
  let pacing: 'accelerating' | 'steady' | 'reinforcing' = 'steady';

  if (opts.forcedSelections) {
    selectionList = [...opts.forcedSelections];
    const resolved = resolveCurriculumForChild(child);
    courseLabel = resolved.course?.label;
    states = await loadAdaptiveStates(child.id, new Set(resolved.topics.map((t) => t.id)));
  } else {
    const result = await selectTopics(child, questionCount, {
      windowOffset: opts.windowOffset,
    });
    selectionList = [...result.selections];
    states = result.states;
    plan = result.plan;
    pacing = result.pacing;
    courseLabel = resolveCurriculumForChild(child).course?.label;
  }
  // NOTE: we intentionally do NOT force-inject missed topics here — misses lower
  // mastery which raises review priority, and per-topic MISS records already
  // drive targeted retry problems. `biasTopicIds` accepted for back-compat.
  void opts.biasTopicIds;

  if (selectionList.length === 0) {
    throw new Error(`No topics available for ${child.name}`);
  }

  // ── Per-topic generation contexts (difficulty, rotation, misses, counts) ──
  const counts = allocateQuestions(selectionList, questionCount);
  const contexts: TopicGenContext[] = selectionList.map((s, i) => {
    const st = states.get(s.topic.id);
    return {
      selection: s,
      serveLevel: s.maintenance
        ? Math.min(4, serveLevel(st, s.topic) + 1) // mastered refreshers come back HARDER
        : serveLevel(st, s.topic),
      dayNumber: (st?.timesServed ?? 0) + 1,
      recentFormats: st?.recentFormats ?? [],
      recentFigures: st?.recentFigures ?? [],
      misses: st?.misses ?? [],
      questionCount: counts[i],
    };
  });

  const topicReasonMap = new Map<string, 'new' | 'review'>();
  for (const s of selectionList) {
    topicReasonMap.set(s.topic.id, s.reason === 'review' ? 'review' : 'new');
  }

  // Cross-day variety: tell the model what it already gave this child recently so
  // it doesn't keep re-emitting the same canonical problem (e.g. y = 3x - 5).
  const previousQuestions = [
    ...(opts.avoidQuestions ?? []),
    ...(await getRecentQuestionTexts(child.id)),
  ].slice(0, 60);

  const { system, prompt } = buildGeneratePrompt(
    child.name,
    child.displayGrade ?? child.grade,
    contexts,
    questionCount,
    previousQuestions,
    { courseLabel, planNote: planNoteFor(plan, child.name) }
  );

  // Generate with one retry: a truncated/malformed JSON response (the usual
  // failure mode at high temperature) should not kill the child's daily sheet.
  let parsed: { title: string; questions: Question[] } | null = null;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    try {
      // Sonnet 5 thinks adaptively before writing (it verifies its own answer
      // key) — max_tokens must cover thinking + the ~10K-token worksheet JSON.
      const responseText = await generateText(prompt, {
        system,
        maxTokens: 32000,
      });
      let cleaned = responseText.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      parsed = JSON.parse(cleaned) as { title: string; questions: Question[] };
    } catch (e) {
      lastError = e;
      console.error(
        `generateAdaptiveWorksheet: attempt ${attempt + 1} failed for ${child.name}:`,
        e instanceof Error ? e.message : e
      );
    }
  }
  if (!parsed) {
    throw lastError instanceof Error
      ? lastError
      : new Error(`Worksheet generation failed for ${child.name}`);
  }
  const verifiedQuestions = verifyWorksheetAnswers(parsed.questions);

  const topicById = new Map<string, CurriculumTopic>();
  for (const s of selectionList) topicById.set(s.topic.id, s.topic);
  const knownFormats = new Set<string>(QUESTION_FORMATS);

  const questions: Question[] = verifiedQuestions.map((q, idx) => {
    const section = q.section || topicReasonMap.get(q.topicId) || 'new';
    const topicMeta = topicById.get(q.topicId);
    const { figure, expectedAnswer } = sanitizeStudentDrawFigure(q.question, q.figure, q.expectedAnswer);
    return {
      number: idx + 1,
      question: q.question,
      answer: q.answer,
      topicId: q.topicId,
      topicName: q.topicName,
      difficulty: q.difficulty,
      format: q.format && knownFormats.has(q.format) ? q.format : undefined,
      isVerifiable: q.isVerifiable,
      section: section as 'new' | 'review',
      figure,
      expectedAnswer,
      hasGrid: q.hasGrid || false,
      gridType: q.gridType || (topicMeta?.requiresImage ? (topicMeta.imageType as Question['gridType']) : undefined),
    };
  });

  const topicIds = selectionList.map((s) => s.topic.id);

  const worksheet = await prisma.worksheet.create({
    data: {
      childId: child.id,
      title: opts.titlePrefix ? `${opts.titlePrefix}: ${parsed.title}` : parsed.title,
      weekNumber: getWeekNumber(new Date()),
      dayOfWeek: opts.dayOfWeek ?? null,
      questionsJson: JSON.stringify(questions),
      topicIdsJson: JSON.stringify(topicIds),
      status: 'generated',
    },
  });

  // ── Record serves (formats + figure kinds per topic) so tomorrow adapts ──
  const perTopic = new Map<string, { formats: string[]; figureKinds: string[] }>();
  for (const q of questions) {
    const entry = perTopic.get(q.topicId) ?? { formats: [], figureKinds: [] };
    if (q.format) entry.formats.push(q.format);
    if (q.figure) entry.figureKinds.push(figureSignature(q.figure));
    perTopic.set(q.topicId, entry);
  }
  const serves: ServeRecord[] = [];
  for (const s of selectionList) {
    const entry = perTopic.get(s.topic.id);
    if (!entry) continue; // the model produced no questions for this topic
    serves.push({ topic: s.topic, formats: entry.formats, figureKinds: entry.figureKinds });
  }
  try {
    await recordServes(child.id, serves);
  } catch (e) {
    // Serve tracking must never fail a successfully generated sheet.
    console.error(`recordServes failed for ${child.name}:`, e);
  }

  const topicReviews: TopicReviewRef[] = selectionList.map((s) => ({
    topicId: s.topic.id,
    topicName: s.topic.name,
    bookRefs: s.topic.bookRefs,
  }));

  // ── "Watch first" videos: one per CURRENT topic (full list on the web page) ──
  const watchVideos = selectionList
    .filter((s) => s.reason === 'current' || s.reason === 'new')
    .slice(0, 4)
    .map((s) => {
      const v = getVideosForTopic(s.topic)[0];
      return v ? { topicName: s.topic.name, title: v.title, minutes: v.minutes } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);
  const watch: WatchInput = {
    url: watchPageUrl(worksheet.id),
    videos: watchVideos,
  };

  return {
    worksheetId: worksheet.id,
    title: parsed.title,
    questions,
    topicIds,
    topicReviews,
    watch,
    plan,
    pacing,
  };
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
