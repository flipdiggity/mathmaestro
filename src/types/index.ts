// ─────────────────────────────────────────────────────────────────────────────
// Figure payload — per-question structured data telling the PDF SVG renderer
// what to draw. Replaces the old hasGrid + gridType pair (which only drew a
// generic blank grid with no per-question content).
//
// Each variant is discriminated by `kind`. Add new kinds as needed; the SVG
// renderer in src/lib/pdf/worksheet-template.tsx dispatches on this field.
// ─────────────────────────────────────────────────────────────────────────────

export interface CoordinatePlaneFigure {
  kind: 'coordinate-plane';
  xRange: [number, number];   // e.g. [-10, 10]
  yRange: [number, number];
  xStep?: number;             // gridline spacing (default 1)
  yStep?: number;             // gridline spacing (default 1)
  // Elements to draw on the plane:
  points?: Array<{
    x: number;
    y: number;
    label?: string;
    style?: 'open' | 'closed'; // open = circle outline, closed = filled
  }>;
  lines?: Array<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    label?: string;
    style?: 'solid' | 'dashed';
    arrow?: 'none' | 'forward' | 'both';
  }>;
  // Sample y = f(x) across xRange to draw a curve. Expression should be safe
  // to evaluate (no var assignments / function calls beyond Math.*).
  functions?: Array<{
    expression: string;       // e.g. "2*x - 3", "x*x", "Math.abs(x)"
    label?: string;
    style?: 'solid' | 'dashed';
  }>;
  // Polygons (for transformations: preimage + image; for area: shaded region)
  polygons?: Array<{
    vertices: Array<{ x: number; y: number }>;
    label?: string;
    fillOpacity?: number;     // 0 = unfilled, default 0.1
  }>;
  // Free-floating labels at a coordinate
  labels?: Array<{ x: number; y: number; text: string }>;
}

export interface NumberLineFigure {
  kind: 'number-line';
  min: number;
  max: number;
  majorTick: number;          // major tick interval
  minorTick?: number;         // minor tick interval (defaults to none)
  markedPoints?: Array<{
    value: number;
    style: 'open' | 'closed';
    label?: string;
  }>;
  intervals?: Array<{
    from: number;
    to: number;
    fromStyle: 'open' | 'closed';
    toStyle: 'open' | 'closed';
    label?: string;
  }>;
}

export interface GeometricFigure {
  kind: 'geometric-figure';
  // Each shape is rendered by a dedicated SVG component; `parameters` is the
  // shape-specific data bag. See worksheet-template.tsx for what each shape
  // expects.
  shape:
    | 'triangle' | 'right-triangle'
    | 'rectangle' | 'square'
    | 'parallelogram' | 'trapezoid'
    | 'pentagon' | 'hexagon'
    | 'circle'
    | 'composite'              // multiple shapes combined
    | 'angle-pair'             // two angles meeting at a vertex
    | 'parallel-lines-transversal'
    | 'prism-3d' | 'cylinder-3d' | 'cone-3d' | 'sphere-3d' | 'pyramid-3d';
  parameters: Record<string, unknown>;
  labels?: Array<{
    position: 'side' | 'angle' | 'vertex' | 'inside' | 'outside';
    ref: string;               // which side/angle/vertex (shape-specific)
    text: string;              // label text e.g. "8 cm", "60°", "A"
  }>;
}

export interface DataDisplayFigure {
  kind: 'data-display';
  display: 'dot-plot' | 'bar-chart' | 'box-plot' | 'scatter-plot' | 'histogram';
  // dot-plot / histogram:
  values?: number[];
  // bar-chart:
  categories?: Array<{ label: string; value: number }>;
  // box-plot: five-number summary
  fiveNumber?: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
  };
  // scatter-plot:
  points?: Array<{ x: number; y: number }>;
  trendLine?: { slope: number; intercept: number };
  // Axis bounds (auto-computed if omitted)
  xRange?: [number, number];
  yRange?: [number, number];
  xLabel?: string;
  yLabel?: string;
  title?: string;
}

export interface FractionModelFigure {
  kind: 'fraction-model';
  model: 'area-rectangle' | 'area-circle' | 'bar';
  totalParts: number;
  shadedParts: number;
  // For comparing two fractions side-by-side:
  compare?: {
    totalParts: number;
    shadedParts: number;
    label?: string;
  };
  label?: string;
}

export interface FunctionMappingFigure {
  kind: 'function-mapping';
  // Mapping diagram: two columns of values with arrows between them
  inputs: Array<string | number>;
  outputs: Array<string | number>;
  mappings: Array<{ from: number; to: number }>; // indices into inputs / outputs
  inputLabel?: string;
  outputLabel?: string;
}

export type Figure =
  | CoordinatePlaneFigure
  | NumberLineFigure
  | GeometricFigure
  | DataDisplayFigure
  | FractionModelFigure
  | FunctionMappingFigure;

// ─────────────────────────────────────────────────────────────────────────────
// ExpectedAnswer — a structured, machine-checkable description of the correct
// answer, used by the grading model to judge handwritten AND drawn answers. It
// parallels the Figure union: a coordinate-plane "graph this line" question can
// carry a `plotted-line` expected answer, a number-line inequality carries an
// `interval`, etc. Optional — when absent, grading falls back to the plain
// `answer` string. Lives inside questionsJson, so adding it needs no migration.
// ─────────────────────────────────────────────────────────────────────────────

export type ExpectedAnswer =
  // A single number; accept within ±tolerance (default exact). unit is optional/ignored.
  | { kind: 'numeric'; value: number; tolerance?: number; unit?: string }
  // A fraction like "3/4"; accept any equivalent or decimal form.
  | { kind: 'fraction'; value: string }
  // Exact-ish string match after normalizing case/whitespace/punctuation.
  | { kind: 'exact'; value: string }
  // A single plotted point.
  | { kind: 'coordinate'; x: number; y: number; tolerance?: number }
  // Several plotted points (order-independent unless `ordered`).
  | { kind: 'coordinate-list'; points: Array<{ x: number; y: number }>; tolerance?: number; ordered?: boolean }
  // A line, graded semantically by slope + y-intercept (e.g. "y = 2x - 3").
  | { kind: 'linear-equation'; slope: number; intercept: number; tolerance?: number }
  // A drawn line, graded by whether it passes through these reference points.
  | { kind: 'plotted-line'; through: Array<{ x: number; y: number }>; tolerance?: number }
  // A number-line solution region with open/closed endpoints.
  | {
      kind: 'interval';
      from: number;
      to: number;
      fromStyle: 'open' | 'closed';
      toStyle: 'open' | 'closed';
    }
  // A set/list of values, e.g. an ordering problem. ordered=true requires sequence.
  | { kind: 'set'; values: string[]; ordered?: boolean }
  // A shaded fraction model: shadedParts/totalParts (accept equivalent fractions).
  | { kind: 'fraction-model'; totalParts: number; shadedParts: number }
  // Open-ended/explanation — cannot be auto-graded strictly; judge reasoning.
  | { kind: 'explanation'; rubric?: string };

// ─────────────────────────────────────────────────────────────────────────────
// Question — what the AI generates per problem on a worksheet.
// ─────────────────────────────────────────────────────────────────────────────

export interface Question {
  number: number;
  question: string;
  answer: string;
  topicId: string;
  topicName: string;
  difficulty: number;
  isVerifiable: boolean;
  section?: 'new' | 'review';
  // Per-question structured figure (preferred). When present, renders via the
  // SVG component for its `kind`.
  figure?: Figure;
  // Structured, machine-checkable expected answer for the grader. Optional;
  // grading falls back to the `answer` string when absent.
  expectedAnswer?: ExpectedAnswer;
  // Legacy fields — kept for back-compat with existing DB rows generated
  // before the structured figure schema landed. New worksheets should populate
  // `figure` instead. Renderer falls back to these if `figure` is absent.
  hasGrid?: boolean;
  gridType?: 'coordinate-plane' | 'number-line';
}

export interface GradingQuestionResult {
  number: number;
  question: string;
  correctAnswer: string;
  studentAnswer: string;
  isCorrect: boolean;
  feedback?: string;
}

export interface WorksheetWithRelations {
  id: string;
  childId: string;
  child: {
    id: string;
    name: string;
    grade: number;
  };
  title: string;
  weekNumber: number | null;
  dayOfWeek: string | null;
  questionsJson: string;
  topicIdsJson: string;
  status: string;
  createdAt: Date;
  gradingResult: {
    id: string;
    totalQuestions: number;
    correctCount: number;
    scorePercent: number;
    resultsJson: string;
  } | null;
}
