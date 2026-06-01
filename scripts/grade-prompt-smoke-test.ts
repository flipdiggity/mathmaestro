// Verifies the grade prompt builder anchors on question numbers, ignores other
// days' work, and emits structured grading specs (incl. drawn answers).
// Run: npx tsx scripts/grade-prompt-smoke-test.ts
import { buildGradePrompt } from '../src/lib/prompts/grade-worksheet';
import { Question } from '../src/types';

const questions: Question[] = [
  {
    number: 1, question: 'Evaluate: -7 + (-5).', answer: '-12',
    topicId: '7.ns.4', topicName: 'Signed Arithmetic', difficulty: 1, isVerifiable: true,
    expectedAnswer: { kind: 'numeric', value: -12 },
  },
  {
    number: 2, question: 'Plot the point (3, -2).', answer: '(3, -2)',
    topicId: '8.cp.1', topicName: 'Plotting Points', difficulty: 1, isVerifiable: true,
    figure: { kind: 'coordinate-plane', xRange: [-5, 5], yRange: [-5, 5] },
    expectedAnswer: { kind: 'coordinate', x: 3, y: -2 },
  },
  {
    number: 3, question: 'Graph y = 2x - 3.', answer: 'slope 2, y-int -3',
    topicId: '8.sl.2', topicName: 'Graphing Lines', difficulty: 2, isVerifiable: false,
    figure: { kind: 'coordinate-plane', xRange: [-5, 5], yRange: [-7, 7] },
    expectedAnswer: { kind: 'plotted-line', through: [{ x: 0, y: -3 }, { x: 1, y: -1 }] },
  },
  {
    number: 4, question: 'Solve 2x - 3 >= 9 and graph on a number line.', answer: 'x >= 6',
    topicId: '7.eq.3', topicName: 'Inequalities', difficulty: 2, isVerifiable: true,
    figure: { kind: 'number-line', min: -2, max: 12, majorTick: 2 },
    expectedAnswer: { kind: 'interval', from: 6, to: 12, fromStyle: 'closed', toStyle: 'open' },
  },
  {
    number: 5, question: 'Order from least to greatest: -1/2, 0.4, -3/4, 0.25.', answer: '-3/4, -1/2, 0.25, 0.4',
    topicId: '7.ns.2', topicName: 'Ordering', difficulty: 1, isVerifiable: true,
    expectedAnswer: { kind: 'set', values: ['-3/4', '-1/2', '0.25', '0.4'], ordered: true },
  },
  {
    // No expectedAnswer, but has a figure → should get the DRAWN note fallback.
    number: 6, question: 'Shade 3/8 of the model.', answer: '3/8',
    topicId: '5.fr.1', topicName: 'Fraction Models', difficulty: 1, isVerifiable: true,
    figure: { kind: 'fraction-model', model: 'area-rectangle', totalParts: 8, shadedParts: 0 },
  },
];

const { system, prompt } = buildGradePrompt(questions);

const checks: Array<[string, boolean]> = [
  ['anchors on question number', /anchor on the question number/i.test(system)],
  ['only grades listed numbers', system.includes('Only grade these question numbers: 1, 2, 3, 4, 5, 6')],
  ['warns about other days/scratch', /OTHER days|scratch work|doodles/i.test(system)],
  ['handles blank/not found', /No answer found \/ left blank/i.test(system)],
  ['numeric spec present', prompt.includes('Numeric answer')],
  ['coordinate spec present', prompt.includes('plotted point at (3, -2)')],
  ['plotted-line spec present', prompt.includes('drawn line/curve passing through')],
  ['interval spec present', prompt.includes('open circle) to 12 (open circle)') || /from 6 \(closed circle\) to 12 \(open circle\)/.test(prompt)],
  ['ordered set spec present', prompt.includes('in this exact order: -3/4, -1/2, 0.25, 0.4')],
  ['figure-only DRAWN fallback', prompt.includes('DRAWN on a fraction-model')],
];

let ok = true;
for (const [label, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}`);
  if (!pass) ok = false;
}

console.log('\n----- ANSWER KEY EXCERPT -----');
console.log(prompt.split('ANSWER KEY')[1].split('Return ONLY')[0].trim());

process.exit(ok ? 0 : 1);
