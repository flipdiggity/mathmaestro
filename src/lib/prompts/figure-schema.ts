// ─────────────────────────────────────────────────────────────────────────────
// Shared figure-schema prompt text.
//
// Both the normal worksheet prompt and the diagnostic prompt teach the model the
// same structured "figure" schema so it emits real diagrams (coordinate planes,
// number lines, triangles, data displays, ...) instead of describing graphs in
// prose. The PDF renderer in src/lib/pdf/worksheet-template.tsx dispatches on
// figure.kind. Keep this in sync with the Figure types in src/types/index.ts.
// ─────────────────────────────────────────────────────────────────────────────

// Maps a topic's imageType to a short human hint about the figure it should emit.
export const FIGURE_KIND_HINTS: Record<string, string> = {
  'coordinate-plane':
    'a coordinate plane — emit figure.kind "coordinate-plane" with xRange/yRange and the points, lines, functions, or polygons to draw',
  'number-line':
    'a number line — emit figure.kind "number-line" with min/max/majorTick and the markedPoints or intervals to draw',
  'geometric-figure':
    'a geometric figure — emit figure.kind "geometric-figure" with the shape and labeled sides/angles',
  'data-display':
    'a data display — emit figure.kind "data-display" with the display type (dot-plot, bar-chart, box-plot, scatter-plot, histogram) and its data',
  'function-mapping':
    'a function mapping diagram — emit figure.kind "function-mapping" with inputs, outputs, and mappings',
  'fraction-model':
    'a fraction model — emit figure.kind "fraction-model" with model, totalParts, and shadedParts',
  angle:
    'a drawn angle — emit figure.kind "angle" with degrees, a varied rotation, and shown=false for measure/solve tasks (optionally protractor: true)',
  table:
    'a data table — emit figure.kind "table" with headers and rows (null cells = blanks the student fills in)',
  'tape-diagram':
    'a tape/bar model — emit figure.kind "tape-diagram" with bars and labeled segments',
  'double-number-line':
    'a double number line — emit figure.kind "double-number-line" with paired values (null = blank to fill)',
  clock: 'an analog clock — emit figure.kind "clock" with hour and minute',
  'area-model':
    'an area model — emit figure.kind "area-model" with rowParts/colParts (and cellLabels or blanks)',
  'polygon-grid':
    'a polygon on a unit grid — emit figure.kind "polygon-grid" with cols/rowsCount and vertices',
  net: 'a net of a 3-D solid — emit figure.kind "net" with the solid and its dims',
};

export const FIGURE_SCHEMA_PROMPT = `
FIGURES — HOW TO DRAW GRAPHS AND DIAGRAMS
Many middle-school problems require a real visual: a plotted point, a graphed line, a
number line with an interval, a labeled triangle, a box plot, etc. DO NOT describe these
in words and DO NOT ask the student to imagine a grid. Instead, attach a structured
"figure" object to the question. The system renders it as a real diagram.

RULES:
- Put the diagram in the "figure" field. Never describe coordinates, axes, or shapes to draw inside the question text itself.
- NO ANSWERS IN CAPTIONS OR LABELS: a figure's caption/label/title must never contain something the student is asked to find. If the question says "write an equation, then complete the table", the table caption must NOT be that equation — omit the caption or use a neutral one ("Cost per box"). Only restate values the question already gives.
- Only attach a figure when the problem genuinely needs one. Plain arithmetic gets no figure (omit the field or set it to null).
- BLANK CANVAS FOR STUDENT-DRAW TASKS: when the problem asks the student to plot, graph, draw, sketch, or mark something THEMSELVES, the figure must be an EMPTY canvas — a coordinate plane with only axes and the right xRange/yRange, or a number line with only ticks. Do NOT include the points/lines/functions/intervals that are the answer. Put the answer in "expectedAnswer" instead. (e.g. "Plot (3,-2)" -> figure is a blank plane; expectedAnswer is the point. NOT a plane with (3,-2) already drawn.)
- DO show the figure when it is GIVEN for the student to READ (e.g. "What is the slope of the line shown?") — then the line belongs in the figure.
- NO answer-revealing figure for purely algebraic questions. "Identify the slope and y-intercept of y = -4x + 9" is answered from the equation — do NOT attach a graph that draws/labels the line or intercept (that hands over the answer). Use figure: null.
- Use ASCII math operators in all text: >= <= != and write "pi", "sqrt", "x" for multiply, "deg" for degrees.

The "figure" field is a JSON object with a "kind" discriminator. Supported kinds:

1. coordinate-plane:
   { "kind": "coordinate-plane", "xRange": [-5,5], "yRange": [-5,5], "xStep": 1, "yStep": 1,
     "points": [{ "x": 3, "y": -2, "label": "(3,-2)", "style": "closed" }],
     "lines": [{ "from": {"x":-4,"y":0}, "to": {"x":4,"y":8}, "style": "solid" }],
     "functions": [{ "expression": "2*x - 3", "label": "y = 2x - 3" }],
     "polygons": [{ "vertices": [{"x":0,"y":0},{"x":2,"y":0},{"x":2,"y":3}], "label": "A", "fillOpacity": 0.1 }] }
   (include only the arrays you need; expressions use JS Math, e.g. "x*x", "Math.abs(x)")

2. number-line:
   { "kind": "number-line", "min": -2, "max": 12, "majorTick": 2, "minorTick": 1,
     "markedPoints": [{ "value": 6, "style": "closed", "label": "x" }],
     "intervals": [{ "from": 6, "to": 12, "fromStyle": "closed", "toStyle": "open" }] }

3. geometric-figure:
   { "kind": "geometric-figure", "shape": "right-triangle",
     "parameters": { "legA": 3, "legB": 4 },
     "labels": [{ "position": "side", "ref": "AB", "text": "3 cm" }, { "position": "side", "ref": "AC", "text": "4 cm" }] }
   shapes: triangle, right-triangle, rectangle, square, circle, angle-pair,
   parallel-lines-transversal, prism-3d, cylinder-3d, cone-3d, sphere-3d, pyramid-3d.
   parameters depend on shape: right-triangle {legA,legB}; triangle {vertices:[{x,y}x3]}
   (vary the vertices — scalene, obtuse, different orientations); rectangle/square
   {width,height}; circle {radius};
   angle-pair {type: "complementary"|"supplementary"|"vertical", angle1: <true measure of
   the first angle in degrees>, rotation: <0-360, VARY every time>} — angle1 makes the
   drawing match the actual measures in the problem; label refs "1","2",... name the
   angular regions in order;
   3d shapes {width,height,depth} or {radius,height}. label.position is side|angle|vertex,
   and ref names a side like "AB", a vertex like "A", or a region like "1".

4. data-display:
   { "kind": "data-display", "display": "box-plot", "fiveNumber": {"min":2,"q1":5,"median":8,"q3":12,"max":18} }
   { "kind": "data-display", "display": "dot-plot", "values": [3,3,4,5,5,5,6] }
   { "kind": "data-display", "display": "bar-chart", "categories": [{"label":"Mon","value":4},{"label":"Tue","value":7}] }
   { "kind": "data-display", "display": "scatter-plot", "points": [{"x":1,"y":2},{"x":3,"y":5}], "trendLine": {"slope":1.5,"intercept":0.5} }

5. fraction-model:
   { "kind": "fraction-model", "model": "area-rectangle", "totalParts": 8, "shadedParts": 3 }
   (models: area-rectangle, area-circle, bar; optional "compare": {totalParts, shadedParts} for side-by-side)

6. function-mapping:
   { "kind": "function-mapping", "inputs": [1,2,3], "outputs": [2,4,6], "mappings": [{"from":0,"to":0},{"from":1,"to":1},{"from":2,"to":2}], "inputLabel": "x", "outputLabel": "y" }

7. angle — a real drawn angle. VARY "rotation" (0-360) every time so no two angles look alike:
   { "kind": "angle", "degrees": 137, "rotation": 25, "shown": false, "vertexLabel": "B", "rayLabels": ["A","C"] }
   shown:false prints "?" (student measures/solves — put the measure in expectedAnswer);
   shown:true prints the measure (given information). "protractor": true overlays a protractor
   for measuring practice. "label" overrides the printed text (e.g. "x", "(2x+10) deg").

8. table — real rendered table; null cells are blanks the student fills in:
   { "kind": "table", "headers": ["x", "y"], "rows": [[-1, null], [0, -5], [2, null], [4, 3]], "caption": "y = 2x - 5" }
   USE THIS for every "complete the table" problem — never describe a table in the question text.

9. tape-diagram — bar model for part/whole and ratio word problems:
   { "kind": "tape-diagram", "bars": [{ "label": "Maya", "segments": [{"label": "35", "units": 1, "shaded": true}, {"label": "?", "units": 1}] }], "totalLabel": "120 stickers in all" }

10. double-number-line — ratios/rates/percents; null = blank to fill:
   { "kind": "double-number-line", "topLabel": "miles", "bottomLabel": "hours", "pairs": [{"top":0,"bottom":0},{"top":150,"bottom":3},{"top":null,"bottom":5}] }

11. clock — analog clock face (reading time, elapsed time):
   { "kind": "clock", "hour": 4, "minute": 35 }

12. area-model — partial products / distributive property:
   { "kind": "area-model", "rowParts": [20, 3], "colParts": [40, 7], "cellLabels": [["800", null], [null, "21"]] }
   (null cells = the student computes those partial products)

13. polygon-grid — polygon on a unit grid for area/perimeter by counting:
   { "kind": "polygon-grid", "cols": 10, "rowsCount": 8, "vertices": [{"x":1,"y":1},{"x":7,"y":1},{"x":7,"y":5},{"x":4,"y":7},{"x":1,"y":5}], "unitLabel": "1 square = 1 sq ft" }

14. net — unfolded net of a solid (surface area):
   { "kind": "net", "solid": "rectangular-prism", "dims": {"width": 6, "height": 3, "depth": 2}, "unit": "cm" }
   solids: cube {side}; rectangular-prism {width,height,depth}; square-pyramid {base,slant};
   triangular-prism {base,triHeight,length}; cylinder {radius,height}.

WORKED EXAMPLES:
- "Plot the point (3, -2) on the coordinate plane." ->
  figure: { "kind": "coordinate-plane", "xRange": [-5,5], "yRange": [-5,5], "points": [{ "x": 3, "y": -2, "label": "(3,-2)", "style": "closed" }] }
- "Graph the line y = 2x - 3." ->
  figure: { "kind": "coordinate-plane", "xRange": [-5,5], "yRange": [-7,7], "functions": [{ "expression": "2*x - 3", "label": "y = 2x - 3" }] }
- "Triangle ABC is a right triangle with legs 3 and 4. Find the hypotenuse." ->
  figure: { "kind": "geometric-figure", "shape": "right-triangle", "parameters": { "legA": 3, "legB": 4 }, "labels": [{ "position": "side", "ref": "AB", "text": "3" }, { "position": "side", "ref": "AC", "text": "4" }] }
- "Solve 2x - 3 >= 9 and graph the solution on a number line." ->
  figure: { "kind": "number-line", "min": -2, "max": 12, "majorTick": 2, "intervals": [{ "from": 6, "to": 12, "fromStyle": "closed", "toStyle": "open" }] }
`;

// Teaches the model to emit a structured, machine-checkable expected answer so
// the photo grader can grade drawn/graphed work — not just typed numbers.
export const EXPECTED_ANSWER_SCHEMA_PROMPT = `
EXPECTED ANSWER — HELP THE GRADER CHECK THE WORK
Besides the plain "answer" string, add an "expectedAnswer" object whenever the answer
can be described structurally. This lets the auto-grader check handwritten AND drawn
answers precisely. Use the kind that best fits; omit (null) only for purely open-ended prose.

Kinds:
- { "kind": "numeric", "value": 30, "tolerance": 0, "unit": "mph" }   // tolerance optional
- { "kind": "fraction", "value": "3/4" }                                // accepts equivalents
- { "kind": "exact", "value": "yes" }                                   // short text answers
- { "kind": "coordinate", "x": 3, "y": -2 }                             // a plotted point
- { "kind": "coordinate-list", "points": [{"x":1,"y":2},{"x":3,"y":5}] }
- { "kind": "linear-equation", "slope": 2, "intercept": -3 }            // graded by m and b
- { "kind": "plotted-line", "through": [{"x":0,"y":-3},{"x":1,"y":-1}] } // a drawn line
- { "kind": "interval", "from": 6, "to": 12, "fromStyle": "closed", "toStyle": "open" } // number-line solution
- { "kind": "set", "values": ["-3/4","-1/2","0.25","0.4"], "ordered": true } // ordering problems
- { "kind": "fraction-model", "totalParts": 8, "shadedParts": 3 }       // shade-the-model answers
- { "kind": "explanation", "rubric": "must mention ..." }              // open-ended reasoning

RULE: when a question has a "figure" the student draws on (plot a point, graph a line,
shade a model, mark a number line), the expectedAnswer should describe the CORRECT
drawing (coordinate / plotted-line / interval / fraction-model), so the grader can
check the marks on the page.
`;
