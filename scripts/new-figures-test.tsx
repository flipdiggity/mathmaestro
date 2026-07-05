// Renders one question per NEW figure kind into a PDF for visual inspection.
// Run: npx tsx scripts/new-figures-test.tsx  → /tmp/new-figures-test.pdf
import fs from 'fs';
import { renderWorksheetPDF } from '../src/lib/pdf/render';
import { Question } from '../src/types';

const q = (n: number, text: string, figure: Question['figure'], format = 'visual'): Question => ({
  number: n,
  question: text,
  answer: 'x',
  topicId: 't',
  topicName: 'Test',
  difficulty: 2,
  format,
  isVerifiable: true,
  section: 'new',
  figure,
});

const questions: Question[] = [
  q(1, 'Measure the angle shown with the protractor. What is its measure?', {
    kind: 'angle', degrees: 137, rotation: 15, shown: false, vertexLabel: 'B', rayLabels: ['A', 'C'], protractor: true,
  }),
  q(2, 'Angle 1 and angle 2 are supplementary. If angle 1 = 55 deg, find angle 2.', {
    kind: 'geometric-figure', shape: 'angle-pair',
    parameters: { type: 'supplementary', angle1: 55, rotation: 20 },
    labels: [
      { position: 'angle', ref: '1', text: '55 deg' },
      { position: 'angle', ref: '2', text: '?' },
    ],
  }),
  q(3, 'Vertical angles with a 50 deg angle. Find angles 2, 3, 4.', {
    kind: 'geometric-figure', shape: 'angle-pair',
    parameters: { type: 'vertical', angle1: 50, rotation: 70 },
    labels: [
      { position: 'angle', ref: '1', text: '50' },
      { position: 'angle', ref: '2', text: '2' },
      { position: 'angle', ref: '3', text: '3' },
      { position: 'angle', ref: '4', text: '4' },
    ],
  }),
  q(4, 'Complete the table for y = 2x - 5.', {
    kind: 'table', headers: ['x', 'y'], rows: [[-1, null], [0, -5], [2, null], [4, 3]], caption: 'y = 2x - 5',
  }),
  q(5, 'Maya has 35 stickers. Together Maya and Jo have 120. How many does Jo have?', {
    kind: 'tape-diagram',
    bars: [{ label: 'Maya', segments: [{ label: '35', units: 1, shaded: true }, { label: '?', units: 2 }] }],
    totalLabel: '120 stickers in all',
  }),
  q(6, 'A car travels 150 miles in 3 hours. Fill in the missing value.', {
    kind: 'double-number-line', topLabel: 'miles', bottomLabel: 'hours',
    pairs: [{ top: 0, bottom: 0 }, { top: 150, bottom: 3 }, { top: null, bottom: 5 }],
  }),
  q(7, 'What time does the clock show?', { kind: 'clock', hour: 4, minute: 35 }),
  q(8, 'Use the area model to find 23 x 47.', {
    kind: 'area-model', rowParts: [20, 3], colParts: [40, 7],
    cellLabels: [['800', null], [null, '21']],
  }),
  q(9, 'Find the area of the polygon. Each square is 1 sq ft.', {
    kind: 'polygon-grid', cols: 10, rowsCount: 8,
    vertices: [{ x: 1, y: 1 }, { x: 7, y: 1 }, { x: 7, y: 5 }, { x: 4, y: 7 }, { x: 1, y: 5 }],
    unitLabel: '1 square = 1 sq ft',
  }),
  q(10, 'Find the surface area of the rectangular prism from its net.', {
    kind: 'net', solid: 'rectangular-prism', dims: { width: 6, height: 3, depth: 2 }, unit: 'cm',
  }),
  q(11, 'Find the surface area of the cylinder from its net.', {
    kind: 'net', solid: 'cylinder', dims: { radius: 2, height: 5 }, unit: 'in',
  }),
  q(12, 'Draw an angle of 72 degrees (blank angle canvas, no protractor).', {
    kind: 'angle', degrees: 72, rotation: 200, shown: true,
  }),
];

async function main() {
  const pdf = await renderWorksheetPDF(
    'New Figure Kinds — Visual Smoke Test',
    'Tester',
    questions,
    'July 4, 2026',
    undefined,
    {
      url: 'https://mathmaestro-tan.vercel.app/watch/test123',
      videos: [
        { topicName: 'Angles', title: 'Math Antics: Angle Basics', minutes: 8 },
        { topicName: 'Area Models', title: 'Khan Academy: Multiplying with area models' },
      ],
    }
  );
  const out = '/private/tmp/claude-501/-Users-felipefernandes-Projects-mathmaestro/0ff4055d-de0a-4a48-99a3-5cb6fa7383fa/scratchpad/new-figures-test.pdf';
  fs.writeFileSync(out, pdf);
  console.log('wrote', out, pdf.length, 'bytes');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
