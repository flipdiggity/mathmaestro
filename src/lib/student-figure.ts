// ─────────────────────────────────────────────────────────────────────────────
// Blank the answer out of "student draws it" figures.
//
// When a question asks the student to PLOT / GRAPH / DRAW / MARK something, the
// figure should be a blank canvas (axes + range, or an empty number line) — NOT
// the finished answer. The model sometimes emits the answer directly in the
// figure (e.g. "plot the point (3,-2)" with the point already plotted). This
// strips those answer elements out and preserves them in expectedAnswer so the
// grader still knows the target.
//
// Figures that are GIVEN for the student to read (e.g. "what is the slope of the
// line shown?") are left untouched.
// ─────────────────────────────────────────────────────────────────────────────

import { Figure, ExpectedAnswer } from '@/types';

// Imperative draw verbs aimed at the student.
const DRAW_INTENT =
  /\b(plot|graph|draw|sketch|construct|shade)\b|\bmark\b[^.]*\bnumber line\b/i;

// Phrases that mean the figure is GIVEN to read, not drawn by the student.
const GIVEN_HINT =
  /\b(shown|shows|represents|represented|below|above|pictured|displayed)\b|from the (graph|figure|diagram)/i;

function isStudentDrawTask(questionText: string): boolean {
  if (GIVEN_HINT.test(questionText)) return false;
  return DRAW_INTENT.test(questionText);
}

// Decide whether to blank a figure's answer elements.
// - Number lines are a workspace for the student in almost all cases, so we
//   blank the markers/intervals UNLESS the question explicitly says something is
//   "shown" on them (e.g. "what value is shown on the number line?"). This
//   catches "locate / between which integers / order on a number line" tasks
//   that have no explicit draw verb but would otherwise reveal the answer.
// - Coordinate planes are often GIVEN to read (e.g. "find the slope of the line
//   through (2,7) and (6,-1)"), so we only blank them on an explicit draw verb.
function shouldBlankFigure(kind: 'coordinate-plane' | 'number-line', questionText: string): boolean {
  if (kind === 'number-line') return !GIVEN_HINT.test(questionText);
  return isStudentDrawTask(questionText);
}

// Try to read a linear expression like "2*x - 3" / "2x+1" / "-4*x + 9".
function parseLinear(expr: string): { slope: number; intercept: number } | null {
  const m = expr
    .replace(/\s+/g, '')
    .match(/^(-?\d*\.?\d*)\*?x([+-]\d*\.?\d+)?$/i);
  if (!m) return null;
  const slope = m[1] === '' || m[1] === '+' ? 1 : m[1] === '-' ? -1 : parseFloat(m[1]);
  const intercept = m[2] ? parseFloat(m[2]) : 0;
  if (Number.isNaN(slope)) return null;
  return { slope, intercept };
}

// Build an expectedAnswer from the answer elements we are about to remove, so
// grading still has a target. Only used when no expectedAnswer was provided.
function synthesizeExpected(fig: Figure): ExpectedAnswer | undefined {
  if (fig.kind === 'coordinate-plane') {
    if (fig.points && fig.points.length === 1) {
      return { kind: 'coordinate', x: fig.points[0].x, y: fig.points[0].y };
    }
    if (fig.points && fig.points.length > 1) {
      return { kind: 'coordinate-list', points: fig.points.map((p) => ({ x: p.x, y: p.y })) };
    }
    if (fig.functions && fig.functions.length === 1) {
      const lin = parseLinear(fig.functions[0].expression);
      if (lin) return { kind: 'linear-equation', slope: lin.slope, intercept: lin.intercept };
    }
    if (fig.lines && fig.lines.length >= 1) {
      const through = fig.lines.flatMap((l) => [l.from, l.to]);
      return { kind: 'plotted-line', through };
    }
  }
  if (fig.kind === 'number-line') {
    if (fig.intervals && fig.intervals.length >= 1) {
      const iv = fig.intervals[0];
      return {
        kind: 'interval',
        from: iv.from,
        to: iv.to,
        fromStyle: iv.fromStyle,
        toStyle: iv.toStyle,
      };
    }
    if (fig.markedPoints && fig.markedPoints.length === 1) {
      return { kind: 'numeric', value: fig.markedPoints[0].value };
    }
    if (fig.markedPoints && fig.markedPoints.length > 1) {
      return { kind: 'set', values: fig.markedPoints.map((p) => String(p.value)) };
    }
  }
  return undefined;
}

/**
 * If the question is a student-draw task, return a blanked figure (answer
 * elements removed) plus an expectedAnswer carrying the target. Otherwise
 * returns the inputs unchanged.
 */
export function sanitizeStudentDrawFigure(
  questionText: string,
  figure: Figure | undefined,
  expectedAnswer: ExpectedAnswer | undefined
): { figure: Figure | undefined; expectedAnswer: ExpectedAnswer | undefined } {
  if (!figure) return { figure, expectedAnswer };
  if (figure.kind !== 'coordinate-plane' && figure.kind !== 'number-line') {
    return { figure, expectedAnswer };
  }
  if (!shouldBlankFigure(figure.kind, questionText)) return { figure, expectedAnswer };

  const synthesized = expectedAnswer ?? synthesizeExpected(figure);

  if (figure.kind === 'coordinate-plane') {
    const blank: Figure = {
      kind: 'coordinate-plane',
      xRange: figure.xRange,
      yRange: figure.yRange,
      ...(figure.xStep != null ? { xStep: figure.xStep } : {}),
      ...(figure.yStep != null ? { yStep: figure.yStep } : {}),
    };
    return { figure: blank, expectedAnswer: synthesized };
  }

  // number-line
  const blank: Figure = {
    kind: 'number-line',
    min: figure.min,
    max: figure.max,
    majorTick: figure.majorTick,
    ...(figure.minorTick != null ? { minorTick: figure.minorTick } : {}),
  };
  return { figure: blank, expectedAnswer: synthesized };
}
