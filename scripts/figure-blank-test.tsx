// Verifies student-draw figures are blanked (answer removed) while given/read
// figures are kept. Renders a PDF to eyeball. Run: npx tsx scripts/figure-blank-test.tsx
import { writeFileSync } from 'fs';
import { join } from 'path';
import { sanitizeStudentDrawFigure } from '../src/lib/student-figure';
import { renderWorksheetPDF } from '../src/lib/pdf/render';
import { Question, Figure } from '../src/types';

type Case = { label: string; q: string; figure: Figure; expectBlank: boolean };
const cases: Case[] = [
  { label: 'plot ordered pairs', expectBlank: true,
    q: 'Complete the table for y = 3x - 5 using x-values -1, 0, 2, 4. Then plot the ordered pairs on the coordinate plane.',
    figure: { kind: 'coordinate-plane', xRange: [-2, 5], yRange: [-10, 8], points: [
      { x: -1, y: -8, label: '(-1,-8)', style: 'closed' }, { x: 0, y: -5, label: '(0,-5)', style: 'closed' },
      { x: 2, y: 1, label: '(2,1)', style: 'closed' }, { x: 4, y: 7, label: '(4,7)', style: 'closed' } ] } },
  { label: 'graph the line', expectBlank: true,
    q: 'Graph the line y = 2x - 3.',
    figure: { kind: 'coordinate-plane', xRange: [-5, 5], yRange: [-7, 7], functions: [{ expression: '2*x - 3', label: 'y=2x-3' }] } },
  { label: 'find slope through pts (kept)', expectBlank: false,
    q: 'Find the slope of the line passing through the points (2, 7) and (6, -1).',
    figure: { kind: 'coordinate-plane', xRange: [0, 8], yRange: [-3, 9],
      points: [{ x: 2, y: 7, style: 'closed' }, { x: 6, y: -1, style: 'closed' }],
      lines: [{ from: { x: 2, y: 7 }, to: { x: 6, y: -1 } }] } },
  { label: 'slope of line SHOWN (kept)', expectBlank: false,
    q: 'What is the slope of the line shown on the graph?',
    figure: { kind: 'coordinate-plane', xRange: [-5, 5], yRange: [-5, 5], functions: [{ expression: 'x', label: '' }] } },
  { label: 'inequality on number line', expectBlank: true,
    q: 'Solve 2x - 3 >= 9 and graph the solution on the number line.',
    figure: { kind: 'number-line', min: -2, max: 12, majorTick: 2, intervals: [{ from: 6, to: 12, fromStyle: 'closed', toStyle: 'open' }] } },
];

let ok = true;
const questions: Question[] = cases.map((c, i) => {
  const { figure, expectedAnswer } = sanitizeStudentDrawFigure(c.q, c.figure, undefined);
  const cp = figure as Extract<Figure, { kind: 'coordinate-plane' }>;
  const nl = figure as Extract<Figure, { kind: 'number-line' }>;
  const drawn =
    figure?.kind === 'coordinate-plane'
      ? (cp.points?.length ?? 0) + (cp.lines?.length ?? 0) + (cp.functions?.length ?? 0)
      : figure?.kind === 'number-line'
        ? (nl.intervals?.length ?? 0) + (nl.markedPoints?.length ?? 0)
        : 0;
  const isBlank = drawn === 0;
  const pass = isBlank === c.expectBlank;
  if (!pass) ok = false;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${c.label}: drawnElements=${drawn} expectedAnswer=${expectedAnswer?.kind ?? 'none'}`);
  return {
    number: i + 1, question: c.q, answer: 'see key', topicId: 't', topicName: c.label,
    difficulty: 1, isVerifiable: true, section: 'new', figure, expectedAnswer,
  };
});

(async () => {
  const buf = await renderWorksheetPDF('Figure Blanking Test', 'Eliana', questions, 'Test');
  const out = join(process.cwd(), 'figure-blank-test.pdf');
  writeFileSync(out, buf);
  console.log('Wrote', out);
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
