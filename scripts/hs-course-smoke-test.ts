// Live-model smoke test for the HS-credit courses (Algebra 1 = 9, Geometry = 10).
// Prompt-level only — no DB writes. Run:
//   npx tsx --env-file=.env scripts/hs-course-smoke-test.ts 9
//   npx tsx --env-file=.env scripts/hs-course-smoke-test.ts 10
import { getCurriculum } from '../src/lib/curriculum';
import { orderedSequence, seqCountsFor, selectSequential } from '../src/lib/curriculum/sequencing';
import { buildGeneratePrompt, allocateQuestions, contextsFromSelections } from '../src/lib/prompts/generate-worksheet';
import { generateText } from '../src/lib/anthropic';
import { Question } from '../src/types';

async function main() {
  const grade = Number(process.argv[2] || 9);
  const cur = getCurriculum(grade);
  if (!cur) throw new Error(`no curriculum for pseudo-grade ${grade}`);
  console.log(`course: ${cur.label} — ${cur.topics.length} topics, ${cur.topics.filter((t) => t.requiresImage).length} visual`);

  const seq = orderedSequence(cur.topics);
  const { selections } = selectSequential(seq, new Map(), {
    floorIndex: 0,
    counts: seqCountsFor(25, 'steady', 4),
    servesToAdvance: 2,
  });
  const contexts = contextsFromSelections(selections, 25);
  void allocateQuestions;

  const { system, prompt } = buildGeneratePrompt('Jordan', 8, contexts, 25, [], {
    courseLabel: cur.label,
  });
  const t0 = Date.now();
  const text = await generateText(prompt, { system, maxTokens: 32000 });
  console.log('model time', Math.round((Date.now() - t0) / 1000), 's');

  let cleaned = text.trim();
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  const parsed = JSON.parse(cleaned) as { title: string; questions: Question[] };
  const diffs: Record<string, number> = {};
  const formats: Record<string, number> = {};
  const figs: Record<string, number> = {};
  let figCount = 0;
  for (const q of parsed.questions) {
    diffs[q.difficulty] = (diffs[q.difficulty] ?? 0) + 1;
    formats[q.format ?? '?'] = (formats[q.format ?? '?'] ?? 0) + 1;
    if (q.figure) {
      figCount++;
      figs[q.figure.kind] = (figs[q.figure.kind] ?? 0) + 1;
    }
  }
  console.log('TITLE:', parsed.title);
  console.log('COUNT:', parsed.questions.length, '| diffs:', JSON.stringify(diffs), '| figures:', figCount, JSON.stringify(figs));
  console.log('FORMATS:', JSON.stringify(formats));
  for (const q of parsed.questions.slice(0, 6)) {
    console.log(`  Q${q.number} [d${q.difficulty}|${q.format}]${q.figure ? ` {${q.figure.kind}}` : ''} ${q.question.slice(0, 105)}`);
  }
}

main().catch((e) => {
  console.error('SMOKE FAIL:', e);
  process.exit(1);
});
