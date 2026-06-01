// Verifies diagnostic probes resolve and renders a sample diagnostic PDF.
// Run: npx tsx scripts/diagnostic-smoke-test.tsx
import { writeFileSync } from 'fs';
import { join } from 'path';
import { getDiagnosticProbe } from '../src/lib/curriculum/diagnostics';
import { buildDiagnosticPrompt } from '../src/lib/prompts/diagnostic-worksheet';
import { renderWorksheetPDF, TopicReviewRef } from '../src/lib/pdf/render';
import { Question } from '../src/types';

const kids = [
  { name: 'Eliana', grade: 7, track: 'accelerated' },
  { name: 'Mylo', grade: 4, track: 'standard' },
];

for (const kid of kids) {
  const probe = getDiagnosticProbe(kid);
  console.log(`\n=== ${kid.name} — ${probe.label} (${probe.totalQuestions} questions) ===`);
  console.log(probe.description);
  for (const t of probe.topics) console.log(`  • ${t.id}  ${t.name}  [${t.tpiCode}]`);
  if (probe.topics.length !== probe.totalQuestions / probe.questionsPerTopic) {
    console.error('  !! some probe topic IDs failed to resolve');
    process.exit(1);
  }
  // Prove the prompt actually lists every probed skill by name.
  const { prompt } = buildDiagnosticPrompt(kid.name, kid.grade, probe.topics, probe.questionsPerTopic);
  const missing = probe.topics.filter((t) => !prompt.includes(t.name));
  if (missing.length) {
    console.error('  !! prompt missing topics:', missing.map((t) => t.name));
    process.exit(1);
  }
  console.log('  prompt lists all probed skills: OK');
}

// Render a representative Eliana diagnostic so the printed layout can be eyeballed.
const sample: Question[] = [
  { number: 1, question: 'Evaluate: -7 + (-5).', answer: '-12', topicId: '7.ns.4', topicName: 'Adding and Subtracting Rational Numbers', difficulty: 1, isVerifiable: true, section: 'new' },
  { number: 2, question: 'Evaluate: 2/3 - (-5/6). Give your answer as a simplified fraction.', answer: '3/2', topicId: '7.ns.4', topicName: 'Adding and Subtracting Rational Numbers', difficulty: 1, isVerifiable: true, section: 'new' },
  { number: 3, question: 'Evaluate: (-4) x (-2.5).', answer: '10', topicId: '7.ns.5', topicName: 'Multiplying and Dividing Rational Numbers', difficulty: 1, isVerifiable: true, section: 'new' },
  { number: 4, question: 'Order from least to greatest: -1/2, 0.4, -3/4, 0.25.', answer: '-3/4, -1/2, 0.25, 0.4', topicId: '7.ns.2', topicName: 'Comparing and Ordering Rational Numbers', difficulty: 1, isVerifiable: true, section: 'new' },
  { number: 5, question: 'A car travels 150 miles on 5 gallons of gas. What is the unit rate in miles per gallon?', answer: '30 mpg', topicId: '7.pr.1', topicName: 'Constant of Proportionality and Unit Rates', difficulty: 1, isVerifiable: true, section: 'new' },
  { number: 6, question: 'A jacket costs $40 and is marked up 25%. What is the new price?', answer: '$50', topicId: '7.pr.3', topicName: 'Percent Increase and Decrease', difficulty: 1, isVerifiable: true, section: 'new' },
];

const elianaProbe = getDiagnosticProbe(kids[0]);
const topicReviews: TopicReviewRef[] = elianaProbe.topics.map((t) => ({ topicName: t.name, bookRefs: t.bookRefs }));

(async () => {
  const buf = await renderWorksheetPDF(
    `Diagnostic — ${elianaProbe.label}`,
    'Eliana',
    sample,
    'Week 1 Placement',
    topicReviews,
  );
  const out = join(process.cwd(), 'diagnostic-sample.pdf');
  writeFileSync(out, buf);
  console.log('\nWrote', out, buf.length, 'bytes');
})().catch((e) => { console.error('RENDER FAILED:', e); process.exit(1); });
