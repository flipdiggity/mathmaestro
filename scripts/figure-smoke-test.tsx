// Smoke test for the structured-figure PDF pipeline.
// Run: npx tsx scripts/figure-smoke-test.tsx
// Renders one worksheet exercising every figure kind to ./figure-smoke-test.pdf
import { writeFileSync } from 'fs';
import { join } from 'path';
import { renderWorksheetPDF, TopicReviewRef } from '../src/lib/pdf/render';
import { Question } from '../src/types';

const questions: Question[] = [
  {
    number: 1,
    question: 'Evaluate: -3/4 + 5/6. Give your answer as a simplified fraction.',
    answer: '1/12',
    topicId: '7.ns.1',
    topicName: 'Signed Rational Arithmetic',
    difficulty: 1,
    isVerifiable: true,
    section: 'review',
  },
  {
    number: 2,
    question: 'Plot the point (3, -2) on the coordinate plane.',
    answer: '(3, -2)',
    topicId: '8.cp.1',
    topicName: 'Plotting Points',
    difficulty: 1,
    isVerifiable: true,
    section: 'new',
    figure: {
      kind: 'coordinate-plane',
      xRange: [-5, 5],
      yRange: [-5, 5],
      points: [{ x: 3, y: -2, label: '(3,-2)', style: 'closed' }],
    },
  },
  {
    number: 3,
    question: 'Graph the line y = 2x - 3.',
    answer: 'slope 2, y-intercept -3',
    topicId: '8.sl.2',
    topicName: 'Graphing Linear Equations',
    difficulty: 2,
    isVerifiable: false,
    section: 'new',
    figure: {
      kind: 'coordinate-plane',
      xRange: [-5, 5],
      yRange: [-7, 7],
      functions: [{ expression: '2*x - 3', label: 'y = 2x - 3' }],
    },
  },
  {
    number: 4,
    question: 'Solve 2x - 3 >= 9 and graph the solution on the number line. (Tests >= and <= glyphs.)',
    answer: 'x >= 6',
    topicId: '7.eq.3',
    topicName: 'Inequalities',
    difficulty: 2,
    isVerifiable: true,
    section: 'new',
    figure: {
      kind: 'number-line',
      min: -2,
      max: 12,
      majorTick: 2,
      intervals: [{ from: 6, to: 12, fromStyle: 'closed', toStyle: 'open' }],
    },
  },
  {
    number: 5,
    question: 'Triangle ABC is a right triangle with legs 3 and 4. Find the length of the hypotenuse.',
    answer: '5',
    topicId: '8.pt.1',
    topicName: 'Pythagorean Theorem',
    difficulty: 2,
    isVerifiable: true,
    section: 'new',
    figure: {
      kind: 'geometric-figure',
      shape: 'right-triangle',
      parameters: { legA: 3, legB: 4 },
      labels: [
        { position: 'side', ref: 'AB', text: '3' },
        { position: 'side', ref: 'AC', text: '4' },
      ],
    },
  },
  {
    number: 6,
    question: 'The box plot shows test scores. What is the median?',
    answer: '8',
    topicId: '8.st.2',
    topicName: 'Box Plots',
    difficulty: 2,
    isVerifiable: true,
    section: 'new',
    figure: {
      kind: 'data-display',
      display: 'box-plot',
      fiveNumber: { min: 2, q1: 5, median: 8, q3: 12, max: 18 },
    },
  },
  {
    number: 7,
    question: 'What fraction of the model is shaded?',
    answer: '3/8',
    topicId: '5.fr.1',
    topicName: 'Fraction Models',
    difficulty: 1,
    isVerifiable: true,
    section: 'new',
    figure: {
      kind: 'fraction-model',
      model: 'area-rectangle',
      totalParts: 8,
      shadedParts: 3,
    },
  },
];

const topicReviews: TopicReviewRef[] = [
  {
    topicName: 'Pythagorean Theorem',
    bookRefs: [
      { title: 'The Big Fat Middle School Math Workbook', isbn: '9781523513581', chapter: 44, note: 'Pythagorean Theorem' },
    ],
  },
  {
    topicName: 'Graphing Linear Equations',
    bookRefs: [
      { title: 'The Big Fat Middle School Math Workbook', isbn: '9781523513581', chapter: 57, note: 'Slope' },
      { title: 'The Big Fat Middle School Math Workbook', isbn: '9781523513581', chapter: 58 },
    ],
  },
];

(async () => {
  const buf = await renderWorksheetPDF(
    'Figure Smoke Test — Eliana',
    'Eliana',
    questions,
    'Monday, June 1, 2026',
    topicReviews,
  );
  const out = join(process.cwd(), 'figure-smoke-test.pdf');
  writeFileSync(out, buf);
  console.log('Wrote', out, buf.length, 'bytes');
})().catch((e) => {
  console.error('RENDER FAILED:', e);
  process.exit(1);
});
