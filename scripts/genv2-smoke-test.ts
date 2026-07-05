// End-to-end smoke test of the v2 generation prompt (NO DB writes).
// Simulates Eliana day-3 on her frontier topics with a miss record + format
// history, calls the real model, and reports difficulty/format/figure stats.
// Run: npx tsx --env-file=.env scripts/genv2-smoke-test.ts
import { getTopicsForChild } from '../src/lib/curriculum';
import {
  orderedSequence,
  floorIndexFor,
  seqCountsFor,
  selectSequential,
  SeqMastery,
} from '../src/lib/curriculum/sequencing';
import { buildGeneratePrompt, allocateQuestions, TopicGenContext } from '../src/lib/prompts/generate-worksheet';
import { generateText } from '../src/lib/anthropic';
import { Question } from '../src/types';

async function main() {
  const pool = getTopicsForChild(7, 'accelerated');
  const seq = orderedSequence(pool);
  const floor = floorIndexFor(seq, { grade: 7, fromOrder: 17 });

  // Simulate: 2 serves already on the first topics (day 3), one graded miss.
  const mastery = new Map<string, SeqMastery>();
  const counts = seqCountsFor(25, 'steady', 5);
  const { selections } = selectSequential(seq, mastery, {
    floorIndex: floor,
    counts,
    servesToAdvance: 2,
  });

  const alloc = allocateQuestions(selections, 25);
  const contexts: TopicGenContext[] = selections.map((s, i) => ({
    selection: s,
    serveLevel: i === 0 ? 3 : i === 1 ? 2 : 1, // escalated first topics
    dayNumber: i < 2 ? 3 : 1,
    recentFormats: i === 0 ? ['computation', 'word-problem', 'computation'] : [],
    recentFigures: i === 0 ? ['coordinate-plane', 'coordinate-plane'] : [],
    misses:
      i === 1
        ? [{ q: 'Find the slope of the line through (2,5) and (8,17).', a: '-2', fb: 'sign error on rise', d: '2026-07-03' }]
        : [],
    questionCount: alloc[i],
  }));

  const { system, prompt } = buildGeneratePrompt('Eliana', 6, contexts, 25, [
    'Find the slope of the line passing through the points (2, 5) and (8, 17).',
    'A phone plan charges a flat monthly fee of $20 plus $0.05 per text message.',
  ], {
    courseLabel: 'Math 8 Accelerated (6th grade)',
    planNote: 'Eliana is on a plan to finish 60 remaining topics by August 12 (~2.4 topics/school day).',
  });

  console.log('--- prompt sizes: system', system.length, 'chars; prompt', prompt.length, 'chars');
  const t0 = Date.now();
  const responseText = await generateText(prompt, { system, maxTokens: 32000 });
  console.log('--- model time', Math.round((Date.now() - t0) / 1000), 's; response', responseText.length, 'chars');

  let cleaned = responseText.trim();
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  const parsed = JSON.parse(cleaned) as { title: string; questions: Question[] };

  console.log('TITLE:', parsed.title);
  console.log('COUNT:', parsed.questions.length);
  const diffs: Record<string, number> = {};
  const formats: Record<string, number> = {};
  const figures: Record<string, number> = {};
  let figCount = 0;
  for (const q of parsed.questions) {
    diffs[q.difficulty] = (diffs[q.difficulty] ?? 0) + 1;
    formats[q.format ?? '?'] = (formats[q.format ?? '?'] ?? 0) + 1;
    if (q.figure) {
      figCount++;
      figures[q.figure.kind] = (figures[q.figure.kind] ?? 0) + 1;
    }
  }
  console.log('DIFFICULTIES:', JSON.stringify(diffs));
  console.log('FORMATS:', JSON.stringify(formats));
  console.log('FIGURES:', figCount, JSON.stringify(figures));
  console.log('\nSAMPLE QUESTIONS:');
  for (const q of parsed.questions.slice(0, 8)) {
    console.log(`  Q${q.number} [d${q.difficulty}|${q.format}]${q.figure ? ` {${q.figure.kind}}` : ''} ${q.question.slice(0, 100)}`);
  }
  const perTopic: Record<string, number> = {};
  for (const q of parsed.questions) perTopic[q.topicName] = (perTopic[q.topicName] ?? 0) + 1;
  console.log('PER-TOPIC:', JSON.stringify(perTopic, null, 0));
}

main().catch((e) => {
  console.error('SMOKE FAIL:', e);
  process.exit(1);
});
