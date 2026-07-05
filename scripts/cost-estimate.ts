// Estimates input token sizes of the REAL generate + grade prompts.
// Run: npx tsx scripts/cost-estimate.ts
import { buildGeneratePrompt, contextsFromSelections } from '../src/lib/prompts/generate-worksheet';
import { buildGradePrompt } from '../src/lib/prompts/grade-worksheet';
import { getTopicsForChild } from '../src/lib/curriculum';
import { TopicSelection } from '../src/lib/curriculum/types';
import { Question } from '../src/types';

// rough tokens ~ chars / 3.7 for English+JSON (Anthropic tokenizer approx)
const tok = (s: string) => Math.round(s.length / 3.7);

// --- GENERATE: realistic 50-question worksheet for Eliana (accelerated 7) ---
const all = getTopicsForChild(7, 'accelerated', 'TX', 'eanes-isd');
// ~14 topics is typical for a 50-question spread
const picked = all.slice(0, 14);
const selections: TopicSelection[] = picked.map((t, i) => ({
  topic: t,
  reason: i < 9 ? 'current' : 'review',
  priority: 100 - i,
}));
const g = buildGeneratePrompt('Eliana', 7, contextsFromSelections(selections, 50), 50);
const gInput = tok(g.system) + tok(g.prompt);
console.log('=== GENERATE (50q) ===');
console.log('system chars', g.system.length, '~tok', tok(g.system));
console.log('prompt chars', g.prompt.length, '~tok', tok(g.prompt));
console.log('input ~tok', gInput);

// --- GRADE: 50 questions in the answer key, some with expectedAnswer ---
const qs: Question[] = Array.from({ length: 50 }, (_, i) => ({
  number: i + 1,
  question:
    'A train travels 240 miles in 4 hours at a constant rate. Write and solve an equation to find its unit rate in miles per hour, then explain what the constant of proportionality represents.',
  answer: '60 mph',
  topicId: picked[i % picked.length].id,
  topicName: picked[i % picked.length].name,
  difficulty: ((i % 3) + 1),
  isVerifiable: true,
  expectedAnswer: i % 3 === 0 ? { kind: 'numeric', value: 60, unit: 'mph' } : undefined,
}));
const gr = buildGradePrompt(qs);
const grInput = tok(gr.system) + tok(gr.prompt);
console.log('\n=== GRADE (50q answer key, text only) ===');
console.log('system chars', gr.system.length, '~tok', tok(gr.system));
console.log('prompt chars', gr.prompt.length, '~tok', tok(gr.prompt));
console.log('text input ~tok', grInput);
