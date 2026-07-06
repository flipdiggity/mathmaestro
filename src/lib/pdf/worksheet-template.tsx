import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Line,
  Circle,
  Rect,
  Polygon,
  Polyline,
  Path,
  G,
  Image,
} from '@react-pdf/renderer';
import {
  Question,
  Figure,
  CoordinatePlaneFigure,
  NumberLineFigure,
  GeometricFigure,
  DataDisplayFigure,
  FractionModelFigure,
  FunctionMappingFigure,
  AngleFigure,
  TableFigure,
  TapeDiagramFigure,
  DoubleNumberLineFigure,
  ClockFigure,
  AreaModelFigure,
  PolygonGridFigure,
  NetFigure,
} from '@/types';
import { BookRef } from '@/lib/curriculum/types';

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 12,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1, paddingRight: 12 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#666' },
  nameDate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    fontSize: 11,
  },
  nameLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    width: 200,
    paddingBottom: 2,
  },
  dateLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    width: 120,
    paddingBottom: 2,
  },
  reviewBlock: {
    marginBottom: 18,
    padding: 10,
    backgroundColor: '#f5f7fb',
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  reviewHeader: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#3730a3',
    marginBottom: 6,
  },
  reviewRow: { fontSize: 10, color: '#1f2937', marginBottom: 3, lineHeight: 1.4 },
  reviewTopic: { fontFamily: 'Helvetica-Bold' },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#aaa',
  },
  sectionHeaderText: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#444',
  },
  questionBlock: { marginBottom: 16, paddingLeft: 4 },
  questionNumber: { fontFamily: 'Helvetica-Bold', fontSize: 12 },
  questionText: { fontSize: 12, marginTop: 2, lineHeight: 1.4 },
  answerSpace: {
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderBottomStyle: 'dashed',
    height: 24,
    width: '60%',
  },
  answerLabel: { fontSize: 10, color: '#999', marginTop: 2 },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 9,
    color: '#999',
  },
  scoreBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    width: 80,
    alignItems: 'center',
  },
  scoreLabel: { fontSize: 10, color: '#666' },
  scoreLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    width: 50,
    height: 20,
    marginTop: 4,
  },
  figureContainer: { marginTop: 4, marginBottom: 8, alignItems: 'center' },
  figureCaption: { fontSize: 8, color: '#666', marginTop: 2 },
  bookRefLine: { fontSize: 8, color: '#6366f1', marginTop: 3 },
  watchBox: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#fefce8',
    borderLeftWidth: 3,
    borderLeftColor: '#eab308',
    alignItems: 'center',
  },
  watchLeft: { flex: 1, paddingRight: 10 },
  watchHeader: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#854d0e',
    marginBottom: 4,
  },
  watchRow: { fontSize: 9, color: '#1f2937', marginBottom: 2, lineHeight: 1.35 },
  watchUrl: { fontSize: 8, color: '#6b7280', marginTop: 3 },
  watchQr: { width: 110, height: 110 },
  watchQrLabel: { fontSize: 7, color: '#854d0e', textAlign: 'center', marginTop: 1 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: substitute ASCII operators for Unicode equivalents.
//
// Helvetica (the default @react-pdf/renderer font) doesn't have ≥ ≤ ≠ × ÷ π glyphs,
// which renders as a placeholder ("d" in the case observed in Eliana's week 1).
// We do the reverse substitution: take ASCII operators and replace them with
// readable text-based equivalents that Helvetica DOES support.
// ─────────────────────────────────────────────────────────────────────────────

function asciifyMath(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/≠/g, '!=')
    .replace(/×/g, 'x')   // multiplication
    .replace(/÷/g, '/')   // division
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')
    .replace(/°/g, ' deg');
}

// ─────────────────────────────────────────────────────────────────────────────
// Coordinate plane renderer — actual axes, points, lines, function plots
// ─────────────────────────────────────────────────────────────────────────────

const CP_SIZE = 220; // pixels (square)
const CP_PAD = 16;   // padding for axis labels

function renderCoordinatePlane(fig: CoordinatePlaneFigure) {
  const [xMin, xMax] = fig.xRange;
  const [yMin, yMax] = fig.yRange;
  const xStep = fig.xStep ?? 1;
  const yStep = fig.yStep ?? 1;
  const w = CP_SIZE;
  const h = CP_SIZE;

  // Coordinate → SVG pixel
  const px = (x: number) => CP_PAD + ((x - xMin) / (xMax - xMin)) * (w - 2 * CP_PAD);
  const py = (y: number) => h - CP_PAD - ((y - yMin) / (yMax - yMin)) * (h - 2 * CP_PAD);

  const elements: React.ReactElement[] = [];

  // Gridlines
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
    elements.push(
      <Line
        key={`gx${x}`}
        x1={px(x)} y1={py(yMin)} x2={px(x)} y2={py(yMax)}
        style={{ stroke: '#e5e7eb', strokeWidth: 0.5 }}
      />,
    );
  }
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
    elements.push(
      <Line
        key={`gy${y}`}
        x1={px(xMin)} y1={py(y)} x2={px(xMax)} y2={py(y)}
        style={{ stroke: '#e5e7eb', strokeWidth: 0.5 }}
      />,
    );
  }

  // Axes
  if (xMin <= 0 && xMax >= 0) {
    elements.push(
      <Line key="yaxis"
        x1={px(0)} y1={py(yMin)} x2={px(0)} y2={py(yMax)}
        style={{ stroke: '#374151', strokeWidth: 1.5 }} />,
    );
  }
  if (yMin <= 0 && yMax >= 0) {
    elements.push(
      <Line key="xaxis"
        x1={px(xMin)} y1={py(0)} x2={px(xMax)} y2={py(0)}
        style={{ stroke: '#374151', strokeWidth: 1.5 }} />,
    );
  }

  // Axis tick labels (every xStep / yStep)
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
    if (x === 0) continue;
    if (yMin <= 0 && yMax >= 0) {
      elements.push(
        <SvgText key={`xt${x}`} x={px(x)} y={py(0) + 9} fontSize={6} fill="#6b7280" textAnchor="middle">
          {String(x)}
        </SvgText>,
      );
    }
  }
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
    if (y === 0) continue;
    if (xMin <= 0 && xMax >= 0) {
      elements.push(
        <SvgText key={`yt${y}`} x={px(0) - 4} y={py(y) + 2} fontSize={6} fill="#6b7280" textAnchor="end">
          {String(y)}
        </SvgText>,
      );
    }
  }

  // Function plots — sample over the visible range
  (fig.functions ?? []).forEach((f, i) => {
    const points: string[] = [];
    const samples = 80;
    for (let i = 0; i <= samples; i++) {
      const x = xMin + (i / samples) * (xMax - xMin);
      const y = safeEval(f.expression, x);
      if (Number.isFinite(y) && y >= yMin && y <= yMax) {
        points.push(`${px(x)},${py(y)}`);
      }
    }
    if (points.length > 1) {
      elements.push(
        <Polyline key={`fn${i}`} points={points.join(' ')}
          style={{
            fill: 'none',
            stroke: '#2563eb',
            strokeWidth: 1.2,
            strokeDasharray: f.style === 'dashed' ? '3 2' : undefined,
          }} />,
      );
    }
  });

  // Polygons (for transformations / shaded regions)
  (fig.polygons ?? []).forEach((poly, i) => {
    const pts = poly.vertices.map((v) => `${px(v.x)},${py(v.y)}`).join(' ');
    elements.push(
      <Polygon key={`poly${i}`} points={pts}
        style={{
          fill: '#3b82f6',
          fillOpacity: poly.fillOpacity ?? 0.12,
          stroke: '#1e40af',
          strokeWidth: 1,
        }} />,
    );
    if (poly.label) {
      const cx = poly.vertices.reduce((a, v) => a + v.x, 0) / poly.vertices.length;
      const cy = poly.vertices.reduce((a, v) => a + v.y, 0) / poly.vertices.length;
      elements.push(
        <SvgText key={`pl${i}`} x={px(cx)} y={py(cy)} fontSize={7} fill="#1e40af" textAnchor="middle">
          {poly.label}
        </SvgText>,
      );
    }
  });

  // Lines
  (fig.lines ?? []).forEach((ln, i) => {
    elements.push(
      <Line key={`ln${i}`}
        x1={px(ln.from.x)} y1={py(ln.from.y)}
        x2={px(ln.to.x)} y2={py(ln.to.y)}
        style={{
          stroke: '#2563eb',
          strokeWidth: 1.2,
          strokeDasharray: ln.style === 'dashed' ? '3 2' : undefined,
        }} />,
    );
    if (ln.label) {
      const mx = (ln.from.x + ln.to.x) / 2;
      const my = (ln.from.y + ln.to.y) / 2;
      elements.push(
        <SvgText key={`ll${i}`} x={px(mx) + 4} y={py(my) - 2} fontSize={6} fill="#1e40af">
          {ln.label}
        </SvgText>,
      );
    }
  });

  // Points
  (fig.points ?? []).forEach((pt, i) => {
    elements.push(
      <Circle key={`pt${i}`}
        cx={px(pt.x)} cy={py(pt.y)} r={2.5}
        style={{
          fill: pt.style === 'open' ? '#ffffff' : '#dc2626',
          stroke: '#dc2626',
          strokeWidth: 1,
        }} />,
    );
    if (pt.label) {
      elements.push(
        <SvgText key={`pl${i}`} x={px(pt.x) + 4} y={py(pt.y) - 3} fontSize={6} fill="#374151">
          {pt.label}
        </SvgText>,
      );
    }
  });

  // Free-floating labels
  (fig.labels ?? []).forEach((lbl, i) => {
    elements.push(
      <SvgText key={`fl${i}`} x={px(lbl.x)} y={py(lbl.y)} fontSize={7} fill="#374151">
        {lbl.text}
      </SvgText>,
    );
  });

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <G>{elements}</G>
      </Svg>
      <Text style={styles.figureCaption}>
        x: [{xMin}, {xMax}], y: [{yMin}, {yMax}]
      </Text>
    </View>
  );
}

// Safe eval for "y = f(x)" function plots. Allows numbers, parens, basic
// operators, and the Math.* namespace. NOT a general sandbox — adequate for
// curriculum-generated expressions like "2*x - 3", "x*x", "Math.abs(x)".
function safeEval(expr: string, x: number): number {
  if (!/^[\d\s+\-*/()xMath.,a-z]+$/i.test(expr)) return NaN;
  try {
    return Function('x', 'Math', `"use strict"; return (${expr});`)(x, Math);
  } catch {
    return NaN;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Number line renderer — real range, marked points, intervals
// ─────────────────────────────────────────────────────────────────────────────

function renderNumberLine(fig: NumberLineFigure) {
  const width = 360;
  const height = 50;
  const margin = 20;
  const lineY = 24;
  const px = (v: number) =>
    margin + ((v - fig.min) / (fig.max - fig.min)) * (width - 2 * margin);

  const els: React.ReactElement[] = [];

  // Main line
  els.push(
    <Line key="main"
      x1={margin} y1={lineY} x2={width - margin} y2={lineY}
      style={{ stroke: '#374151', strokeWidth: 1 }} />,
  );
  // Arrows on each end
  els.push(
    <Polygon key="al" points={`${margin - 6},${lineY} ${margin},${lineY - 3} ${margin},${lineY + 3}`}
      style={{ fill: '#374151' }} />,
    <Polygon key="ar" points={`${width - margin + 6},${lineY} ${width - margin},${lineY - 3} ${width - margin},${lineY + 3}`}
      style={{ fill: '#374151' }} />,
  );

  // Major ticks + labels
  for (let v = Math.ceil(fig.min / fig.majorTick) * fig.majorTick; v <= fig.max; v += fig.majorTick) {
    const x = px(v);
    els.push(
      <Line key={`mt${v}`} x1={x} y1={lineY - 5} x2={x} y2={lineY + 5}
        style={{ stroke: '#374151', strokeWidth: 1 }} />,
      <SvgText key={`ml${v}`} x={x} y={lineY + 14} fontSize={7} fill="#374151" textAnchor="middle">
        {String(Math.round(v * 100) / 100)}
      </SvgText>,
    );
  }
  // Minor ticks
  if (fig.minorTick) {
    for (let v = Math.ceil(fig.min / fig.minorTick) * fig.minorTick; v <= fig.max; v += fig.minorTick) {
      if (Math.abs(v % fig.majorTick) < 0.001) continue;
      const x = px(v);
      els.push(
        <Line key={`mn${v}`} x1={x} y1={lineY - 2} x2={x} y2={lineY + 2}
          style={{ stroke: '#9ca3af', strokeWidth: 0.5 }} />,
      );
    }
  }

  // Intervals (shaded segments)
  (fig.intervals ?? []).forEach((iv, i) => {
    const x1 = px(iv.from);
    const x2 = px(iv.to);
    els.push(
      <Line key={`iv${i}`} x1={x1} y1={lineY} x2={x2} y2={lineY}
        style={{ stroke: '#2563eb', strokeWidth: 2.5 }} />,
      <Circle key={`ivf${i}`} cx={x1} cy={lineY} r={3}
        style={{
          fill: iv.fromStyle === 'open' ? '#ffffff' : '#2563eb',
          stroke: '#2563eb', strokeWidth: 1.2,
        }} />,
      <Circle key={`ivt${i}`} cx={x2} cy={lineY} r={3}
        style={{
          fill: iv.toStyle === 'open' ? '#ffffff' : '#2563eb',
          stroke: '#2563eb', strokeWidth: 1.2,
        }} />,
    );
  });

  // Marked points
  (fig.markedPoints ?? []).forEach((pt, i) => {
    els.push(
      <Circle key={`pt${i}`} cx={px(pt.value)} cy={lineY} r={3.5}
        style={{
          fill: pt.style === 'open' ? '#ffffff' : '#dc2626',
          stroke: '#dc2626', strokeWidth: 1.2,
        }} />,
    );
    if (pt.label) {
      els.push(
        <SvgText key={`ptl${i}`} x={px(pt.value)} y={lineY - 8} fontSize={7} fill="#374151" textAnchor="middle">
          {pt.label}
        </SvgText>,
      );
    }
  });

  return (
    <View style={styles.figureContainer}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <G>{els}</G>
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Geometric figure renderer — dispatches by shape
// ─────────────────────────────────────────────────────────────────────────────

function renderGeometricFigure(fig: GeometricFigure) {
  switch (fig.shape) {
    case 'triangle':
    case 'right-triangle':
      return renderTriangle(fig);
    case 'rectangle':
    case 'square':
      return renderRectangle(fig);
    case 'circle':
      return renderCircle(fig);
    case 'parallel-lines-transversal':
      return renderParallelLinesTransversal(fig);
    case 'angle-pair':
      return renderAnglePair(fig);
    case 'prism-3d':
    case 'cylinder-3d':
    case 'cone-3d':
    case 'sphere-3d':
    case 'pyramid-3d':
      return render3DShape(fig);
    default:
      // Composite or unknown — render a labeled placeholder note.
      return (
        <View style={styles.figureContainer}>
          <Text style={styles.figureCaption}>[See figure described in problem]</Text>
        </View>
      );
  }
}

function renderTriangle(fig: GeometricFigure) {
  const w = 220;
  const h = 160;
  // Parameters: { vertices?: [[x,y],[x,y],[x,y]] } in figure-local coords
  // or for right-triangle: { legA: number, legB: number } with right angle at A.
  const params = fig.parameters as {
    vertices?: Array<{ x: number; y: number }>;
    legA?: number;
    legB?: number;
    rightAngleAt?: 'A' | 'B' | 'C';
  };

  let verts: Array<{ x: number; y: number }>;
  if (params.vertices && params.vertices.length === 3) {
    verts = params.vertices;
  } else if (fig.shape === 'right-triangle' && params.legA && params.legB) {
    // Standard orientation: right angle at origin, legA horizontal, legB vertical
    verts = [
      { x: 0, y: 0 },
      { x: params.legA, y: 0 },
      { x: 0, y: params.legB },
    ];
  } else {
    // Default equilateral-ish for visualization
    verts = [{ x: 0, y: 4 }, { x: -3, y: 0 }, { x: 3, y: 0 }];
  }

  // Fit to viewport with padding
  const pad = 30;
  const xs = verts.map((v) => v.x);
  const ys = verts.map((v) => v.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const xRange = Math.max(xMax - xMin, 1);
  const yRange = Math.max(yMax - yMin, 1);
  const scale = Math.min((w - 2 * pad) / xRange, (h - 2 * pad) / yRange);
  const px = (x: number) => pad + (x - xMin) * scale;
  const py = (y: number) => h - pad - (y - yMin) * scale;

  const pts = verts.map((v) => `${px(v.x)},${py(v.y)}`).join(' ');

  // Label helpers
  const sideLabels = (fig.labels ?? []).filter((l) => l.position === 'side');
  const angleLabels = (fig.labels ?? []).filter((l) => l.position === 'angle');
  const vertexLabels = (fig.labels ?? []).filter((l) => l.position === 'vertex');

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Polygon points={pts}
          style={{ fill: 'none', stroke: '#1e40af', strokeWidth: 1.5 }} />

        {/* Vertex labels (default A, B, C) */}
        {verts.map((v, i) => {
          const defaultName = String.fromCharCode(65 + i);
          const customLabel = vertexLabels.find((l) => l.ref === defaultName);
          const text = customLabel?.text ?? defaultName;
          // Push label slightly outward
          const cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2;
          const dx = v.x - cx, dy = v.y - cy;
          const len = Math.hypot(dx, dy) || 1;
          const ox = (dx / len) * 8;
          const oy = -(dy / len) * 8;
          return (
            <SvgText key={`v${i}`}
              x={px(v.x) + ox} y={py(v.y) + oy}
              fontSize={9} fontFamily="Helvetica-Bold" fill="#1e40af" textAnchor="middle">
              {text}
            </SvgText>
          );
        })}

        {/* Side labels — between two vertex letters (e.g. ref "AB") */}
        {sideLabels.map((lbl, i) => {
          if (lbl.ref.length !== 2) return null;
          const a = lbl.ref.charCodeAt(0) - 65;
          const b = lbl.ref.charCodeAt(1) - 65;
          if (!verts[a] || !verts[b]) return null;
          const mx = (verts[a].x + verts[b].x) / 2;
          const my = (verts[a].y + verts[b].y) / 2;
          // Push label outward from centroid
          const cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2;
          const dx = mx - cx, dy = my - cy;
          const len = Math.hypot(dx, dy) || 1;
          return (
            <SvgText key={`s${i}`}
              x={px(mx) + (dx / len) * 12} y={py(my) - (dy / len) * 12 + 2}
              fontSize={8} fill="#374151" textAnchor="middle">
              {lbl.text}
            </SvgText>
          );
        })}

        {/* Angle labels — at the vertex letter */}
        {angleLabels.map((lbl, i) => {
          const a = lbl.ref.charCodeAt(0) - 65;
          if (!verts[a]) return null;
          const cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2;
          const dx = verts[a].x - cx, dy = verts[a].y - cy;
          const len = Math.hypot(dx, dy) || 1;
          // Pull label inward from vertex
          return (
            <SvgText key={`a${i}`}
              x={px(verts[a].x) - (dx / len) * 14} y={py(verts[a].y) + (dy / len) * 14 + 2}
              fontSize={7} fill="#7c3aed" textAnchor="middle">
              {lbl.text}
            </SvgText>
          );
        })}

        {/* Right-angle marker if right-triangle */}
        {fig.shape === 'right-triangle' && params.legA && params.legB && (
          <Polygon
            points={`${px(0) + 6},${py(0)} ${px(0) + 6},${py(0) - 6} ${px(0)},${py(0) - 6}`}
            style={{ fill: 'none', stroke: '#1e40af', strokeWidth: 0.8 }} />
        )}
      </Svg>
    </View>
  );
}

function renderRectangle(fig: GeometricFigure) {
  const w = 220;
  const h = 140;
  const params = fig.parameters as { width?: number; height?: number };
  const rw = params.width ?? 8;
  const rh = params.height ?? (fig.shape === 'square' ? rw : 5);
  const pad = 30;
  const scale = Math.min((w - 2 * pad) / rw, (h - 2 * pad) / rh);
  const drawW = rw * scale;
  const drawH = rh * scale;
  const x0 = (w - drawW) / 2;
  const y0 = (h - drawH) / 2;

  const sideLabels = (fig.labels ?? []).filter((l) => l.position === 'side');
  const findLabel = (ref: string) => sideLabels.find((l) => l.ref === ref);

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Rect x={x0} y={y0} width={drawW} height={drawH}
          style={{ fill: 'none', stroke: '#1e40af', strokeWidth: 1.5 }} />
        {/* Width label (bottom) */}
        {(findLabel('bottom') || findLabel('width')) && (
          <SvgText x={x0 + drawW / 2} y={y0 + drawH + 12} fontSize={9} fill="#374151" textAnchor="middle">
            {findLabel('bottom')?.text ?? findLabel('width')?.text}
          </SvgText>
        )}
        {/* Height label (right side) */}
        {(findLabel('right') || findLabel('height')) && (
          <SvgText x={x0 + drawW + 8} y={y0 + drawH / 2 + 3} fontSize={9} fill="#374151">
            {findLabel('right')?.text ?? findLabel('height')?.text}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}

function renderCircle(fig: GeometricFigure) {
  const w = 200;
  const h = 200;
  const params = fig.parameters as { radius?: number };
  const r = (params.radius ?? 5) * 12;
  const cx = w / 2;
  const cy = h / 2;
  const sideLabels = (fig.labels ?? []);

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Circle cx={cx} cy={cy} r={r}
          style={{ fill: 'none', stroke: '#1e40af', strokeWidth: 1.5 }} />
        {/* Radius line (right) */}
        <Line x1={cx} y1={cy} x2={cx + r} y2={cy}
          style={{ stroke: '#1e40af', strokeWidth: 1, strokeDasharray: '3 2' }} />
        <Circle cx={cx} cy={cy} r={1.5} style={{ fill: '#1e40af' }} />
        {sideLabels.map((lbl, i) => (
          <SvgText key={i} x={cx + r / 2} y={cy - 4} fontSize={8} fill="#374151" textAnchor="middle">
            {lbl.text}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

function renderParallelLinesTransversal(fig: GeometricFigure) {
  const w = 260;
  const h = 160;
  // Two horizontal lines + slanted transversal
  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Parallel lines */}
        <Line x1={20} y1={50} x2={w - 20} y2={50}
          style={{ stroke: '#1e40af', strokeWidth: 1.2 }} />
        <Line x1={20} y1={110} x2={w - 20} y2={110}
          style={{ stroke: '#1e40af', strokeWidth: 1.2 }} />
        {/* Transversal */}
        <Line x1={70} y1={20} x2={w - 60} y2={140}
          style={{ stroke: '#dc2626', strokeWidth: 1.2 }} />
        {/* Angle markers (1-8) at the two intersections */}
        {(fig.labels ?? []).map((lbl, i) => {
          const positions: Record<string, { x: number; y: number }> = {
            '1': { x: 85, y: 40 }, '2': { x: 120, y: 40 },
            '3': { x: 85, y: 65 }, '4': { x: 120, y: 65 },
            '5': { x: 150, y: 100 }, '6': { x: 185, y: 100 },
            '7': { x: 150, y: 125 }, '8': { x: 185, y: 125 },
          };
          const p = positions[lbl.ref] ?? { x: 130, y: 80 };
          return (
            <SvgText key={i} x={p.x} y={p.y} fontSize={8} fill="#7c3aed" textAnchor="middle">
              {lbl.text}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

// Angle pairs with REAL parameterized measures + rotation, so the figure
// matches the problem and never looks the same twice. parameters:
// { type, angle1?, angle2?, rotation? } — angle1 is the first region's measure
// (falls back to sensible defaults), rotation spins the whole figure.
function renderAnglePair(fig: GeometricFigure) {
  const w = 230;
  const h = 150;
  const cx = w / 2;
  const cy = h / 2 + 10;
  const r = 62;
  const params = fig.parameters as {
    type?: 'complementary' | 'supplementary' | 'vertical' | 'adjacent';
    angle1?: number;
    angle2?: number;
    rotation?: number;
  };
  const type = params.type ?? 'supplementary';
  const rot = params.rotation ?? 0;
  const a1 = params.angle1 ?? (type === 'complementary' ? 35 : type === 'vertical' ? 50 : 55);

  // Math-convention angles (CCW, degrees); SVG y flips so we negate sin.
  const pt = (angDeg: number, radius: number) => {
    const rad = (angDeg * Math.PI) / 180;
    return { x: cx + Math.cos(rad) * radius, y: cy - Math.sin(rad) * radius };
  };

  // Ray directions + the angular regions labels refer to ("1", "2", ...).
  let rays: number[];
  let regions: Array<[number, number]>;
  if (type === 'complementary') {
    rays = [rot, rot + a1, rot + 90];
    regions = [[rot, rot + a1], [rot + a1, rot + 90]];
  } else if (type === 'vertical') {
    rays = [rot, rot + a1, rot + 180, rot + a1 + 180];
    regions = [
      [rot, rot + a1],
      [rot + a1, rot + 180],
      [rot + 180, rot + a1 + 180],
      [rot + a1 + 180, rot + 360],
    ];
  } else {
    // supplementary / adjacent on a line
    rays = [rot, rot + a1, rot + 180];
    regions = [[rot, rot + a1], [rot + a1, rot + 180]];
  }

  const els: React.ReactElement[] = [];
  rays.forEach((ang, i) => {
    const end = pt(ang, r);
    els.push(
      <Line key={`ray${i}`} x1={cx} y1={cy} x2={end.x} y2={end.y}
        style={{ stroke: '#1e40af', strokeWidth: 1.3 }} />,
    );
  });
  // Small arcs marking each region
  regions.forEach(([from, to], i) => {
    const arcR = 14 + i * 5;
    const s = pt(from, arcR);
    const e = pt(to, arcR);
    const large = Math.abs(to - from) > 180 ? 1 : 0;
    els.push(
      <Path key={`arc${i}`}
        d={`M ${s.x} ${s.y} A ${arcR} ${arcR} 0 ${large} 0 ${e.x} ${e.y}`}
        style={{ fill: 'none', stroke: '#7c3aed', strokeWidth: 0.8 }} />,
    );
  });
  // Region labels on bisectors: label ref "1" → first region, etc.
  (fig.labels ?? []).forEach((lbl, i) => {
    const idx = Math.max(0, Math.min(regions.length - 1, parseInt(lbl.ref, 10) - 1 || i));
    const [from, to] = regions[idx];
    const mid = pt((from + to) / 2, 34 + (idx % 2) * 6);
    els.push(
      <SvgText key={`lbl${i}`} x={mid.x} y={mid.y + 2} fontSize={8} fill="#7c3aed" textAnchor="middle">
        {lbl.text}
      </SvgText>,
    );
  });
  els.push(<Circle key="vtx" cx={cx} cy={cy} r={1.6} style={{ fill: '#1e40af' }} />);

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <G>{els}</G>
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single angle (with optional protractor) — measure practice, angle reasoning
// ─────────────────────────────────────────────────────────────────────────────

function renderAngle(fig: AngleFigure) {
  const w = 230;
  const h = fig.protractor ? 170 : 140;
  const cx = w / 2;
  const cy = fig.protractor ? h - 40 : h / 2 + 14;
  const r = 66;
  const rot = fig.rotation ?? 0;
  const deg = fig.degrees;

  const pt = (angDeg: number, radius: number) => {
    const rad = (angDeg * Math.PI) / 180;
    return { x: cx + Math.cos(rad) * radius, y: cy - Math.sin(rad) * radius };
  };

  const els: React.ReactElement[] = [];

  // Protractor overlay: half-disc aligned with the base ray.
  if (fig.protractor) {
    const outer = 58;
    const inner = 46;
    const s = pt(rot, outer);
    const e = pt(rot + 180, outer);
    els.push(
      <Path key="prot"
        d={`M ${e.x} ${e.y} A ${outer} ${outer} 0 0 1 ${s.x} ${s.y}`}
        style={{ fill: '#f8fafc', stroke: '#9ca3af', strokeWidth: 0.8 }} />,
      <Line key="protbase" x1={e.x} y1={e.y} x2={s.x} y2={s.y}
        style={{ stroke: '#9ca3af', strokeWidth: 0.8 }} />,
    );
    for (let t = 0; t <= 180; t += 10) {
      const o = pt(rot + t, outer);
      const inn = pt(rot + t, t % 30 === 0 ? inner - 4 : inner);
      els.push(
        <Line key={`pt${t}`} x1={inn.x} y1={inn.y} x2={o.x} y2={o.y}
          style={{ stroke: '#9ca3af', strokeWidth: t % 30 === 0 ? 0.8 : 0.4 }} />,
      );
      if (t % 30 === 0) {
        const lp = pt(rot + t, inner - 11);
        els.push(
          <SvgText key={`ptl${t}`} x={lp.x} y={lp.y + 2} fontSize={5} fill="#6b7280" textAnchor="middle">
            {String(t)}
          </SvgText>,
        );
      }
    }
  }

  // The two rays
  const end1 = pt(rot, r);
  const end2 = pt(rot + deg, r);
  els.push(
    <Line key="r1" x1={cx} y1={cy} x2={end1.x} y2={end1.y}
      style={{ stroke: '#1e40af', strokeWidth: 1.4 }} />,
    <Line key="r2" x1={cx} y1={cy} x2={end2.x} y2={end2.y}
      style={{ stroke: '#1e40af', strokeWidth: 1.4 }} />,
    <Circle key="v" cx={cx} cy={cy} r={1.8} style={{ fill: '#1e40af' }} />,
  );

  // Arc marking the angle (right-angle square for 90°)
  if (Math.abs(deg - 90) < 0.01) {
    const a = pt(rot, 12);
    const b = pt(rot + 45, 16.97);
    const c = pt(rot + 90, 12);
    els.push(
      <Path key="sq" d={`M ${a.x} ${a.y} L ${b.x} ${b.y} L ${c.x} ${c.y}`}
        style={{ fill: 'none', stroke: '#7c3aed', strokeWidth: 0.9 }} />,
    );
  } else {
    const arcR = 16;
    const s = pt(rot, arcR);
    const e = pt(rot + deg, arcR);
    const large = deg > 180 ? 1 : 0;
    els.push(
      <Path key="arc" d={`M ${s.x} ${s.y} A ${arcR} ${arcR} 0 ${large} 0 ${e.x} ${e.y}`}
        style={{ fill: 'none', stroke: '#7c3aed', strokeWidth: 0.9 }} />,
    );
  }

  // Measure label on the bisector (or "?" for solve/measure tasks)
  const labelText = fig.label ?? (fig.shown ? `${Math.round(deg)} deg` : '?');
  const lp = pt(rot + deg / 2, deg < 40 ? 40 : 30);
  els.push(
    <SvgText key="ml" x={lp.x} y={lp.y + 2} fontSize={8} fill="#7c3aed" textAnchor="middle">
      {labelText}
    </SvgText>,
  );

  // Vertex / ray endpoint labels
  if (fig.vertexLabel) {
    const vp = pt(rot + deg / 2 + 180, 10);
    els.push(
      <SvgText key="vl" x={vp.x} y={vp.y + 3} fontSize={8} fontFamily="Helvetica-Bold" fill="#1e40af" textAnchor="middle">
        {fig.vertexLabel}
      </SvgText>,
    );
  }
  if (fig.rayLabels) {
    const p1 = pt(rot, r + 8);
    const p2 = pt(rot + deg, r + 8);
    els.push(
      <SvgText key="rl1" x={p1.x} y={p1.y + 3} fontSize={8} fill="#1e40af" textAnchor="middle">
        {fig.rayLabels[0]}
      </SvgText>,
      <SvgText key="rl2" x={p2.x} y={p2.y + 3} fontSize={8} fill="#1e40af" textAnchor="middle">
        {fig.rayLabels[1]}
      </SvgText>,
    );
  }

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <G>{els}</G>
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Table — headers + rows; null cells are blanks for the student to fill in
// ─────────────────────────────────────────────────────────────────────────────

function renderTable(fig: TableFigure) {
  const cols = Math.max(fig.headers.length, 1);
  const colW = Math.min(90, Math.max(46, 320 / cols));
  const w = colW * cols + 2;
  const rowH = 20;
  const h = rowH * (fig.rows.length + 1) + (fig.caption ? 14 : 0) + 2;

  const els: React.ReactElement[] = [];
  // Header row
  fig.headers.forEach((hd, c) => {
    els.push(
      <Rect key={`h${c}`} x={1 + c * colW} y={1} width={colW} height={rowH}
        style={{ fill: '#eef2ff', stroke: '#1e40af', strokeWidth: 0.8 }} />,
      <SvgText key={`ht${c}`} x={1 + c * colW + colW / 2} y={1 + rowH / 2 + 3}
        fontSize={8} fontFamily="Helvetica-Bold" fill="#3730a3" textAnchor="middle">
        {asciifyMath(String(hd))}
      </SvgText>,
    );
  });
  // Body
  fig.rows.forEach((row, ri) => {
    for (let c = 0; c < cols; c++) {
      const v = row[c];
      const y = 1 + (ri + 1) * rowH;
      els.push(
        <Rect key={`c${ri}-${c}`} x={1 + c * colW} y={y} width={colW} height={rowH}
          style={{ fill: '#ffffff', stroke: '#1e40af', strokeWidth: 0.6 }} />,
      );
      if (v !== null && v !== undefined && String(v) !== '') {
        els.push(
          <SvgText key={`ct${ri}-${c}`} x={1 + c * colW + colW / 2} y={y + rowH / 2 + 3}
            fontSize={8} fill="#111827" textAnchor="middle">
            {asciifyMath(String(v))}
          </SvgText>,
        );
      }
    }
  });

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <G>{els}</G>
      </Svg>
      {fig.caption ? <Text style={styles.figureCaption}>{asciifyMath(fig.caption)}</Text> : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tape diagram (bar model) — part/whole word problems, ratios
// ─────────────────────────────────────────────────────────────────────────────

function renderTapeDiagram(fig: TapeDiagramFigure) {
  const labelW = fig.bars.some((b) => b.label) ? 52 : 6;
  const barAreaW = 250;
  const barH = 24;
  const gap = 12;
  const topPad = fig.totalLabel ? 24 : 6;
  const w = labelW + barAreaW + 10;
  const h = topPad + fig.bars.length * (barH + gap);

  const els: React.ReactElement[] = [];
  const maxUnits = Math.max(
    ...fig.bars.map((b) => b.segments.reduce((a, s) => a + (s.units ?? 1), 0)),
    1
  );

  fig.bars.forEach((bar, bi) => {
    const y = topPad + bi * (barH + gap);
    if (bar.label) {
      els.push(
        <SvgText key={`bl${bi}`} x={labelW - 6} y={y + barH / 2 + 3} fontSize={8} fill="#374151" textAnchor="end">
          {bar.label}
        </SvgText>,
      );
    }
    let x = labelW;
    bar.segments.forEach((seg, si) => {
      const segW = ((seg.units ?? 1) / maxUnits) * barAreaW;
      els.push(
        <Rect key={`s${bi}-${si}`} x={x} y={y} width={segW} height={barH}
          style={{
            fill: seg.shaded ? '#dbeafe' : '#ffffff',
            stroke: '#1e40af',
            strokeWidth: 1,
          }} />,
        <SvgText key={`st${bi}-${si}`} x={x + segW / 2} y={y + barH / 2 + 3}
          fontSize={8} fill="#111827" textAnchor="middle">
          {asciifyMath(seg.label)}
        </SvgText>,
      );
      x += segW;
    });
    // Total bracket over the FIRST bar
    if (bi === 0 && fig.totalLabel) {
      const totalW = x - labelW;
      els.push(
        <Line key="tb" x1={labelW} y1={y - 8} x2={labelW + totalW} y2={y - 8}
          style={{ stroke: '#6b7280', strokeWidth: 0.8 }} />,
        <Line key="tb1" x1={labelW} y1={y - 8} x2={labelW} y2={y - 4}
          style={{ stroke: '#6b7280', strokeWidth: 0.8 }} />,
        <Line key="tb2" x1={labelW + totalW} y1={y - 8} x2={labelW + totalW} y2={y - 4}
          style={{ stroke: '#6b7280', strokeWidth: 0.8 }} />,
        <SvgText key="tbl" x={labelW + totalW / 2} y={y - 12} fontSize={8} fill="#374151" textAnchor="middle">
          {asciifyMath(fig.totalLabel)}
        </SvgText>,
      );
    }
  });

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <G>{els}</G>
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Double number line — ratios, unit rates, percents
// ─────────────────────────────────────────────────────────────────────────────

function renderDoubleNumberLine(fig: DoubleNumberLineFigure) {
  const labelW = 58;
  const lineW = 250;
  const w = labelW + lineW + 20;
  const h = 78;
  const topY = 22;
  const botY = 56;
  const n = Math.max(fig.pairs.length, 2);
  const px = (i: number) => labelW + (i / (n - 1)) * lineW;

  const els: React.ReactElement[] = [];
  [
    { y: topY, label: fig.topLabel },
    { y: botY, label: fig.bottomLabel },
  ].forEach(({ y, label }, li) => {
    els.push(
      <Line key={`l${li}`} x1={labelW - 4} y1={y} x2={labelW + lineW + 8} y2={y}
        style={{ stroke: '#374151', strokeWidth: 1 }} />,
      <Polygon key={`la${li}`}
        points={`${labelW + lineW + 14},${y} ${labelW + lineW + 8},${y - 3} ${labelW + lineW + 8},${y + 3}`}
        style={{ fill: '#374151' }} />,
      <SvgText key={`ll${li}`} x={labelW - 10} y={y + 3} fontSize={8} fill="#374151" textAnchor="end">
        {label}
      </SvgText>,
    );
  });
  fig.pairs.forEach((pair, i) => {
    const x = px(i);
    [
      { y: topY, v: pair.top, dy: -7 },
      { y: botY, v: pair.bottom, dy: 14 },
    ].forEach(({ y, v, dy }, pi) => {
      els.push(
        <Line key={`t${i}-${pi}`} x1={x} y1={y - 4} x2={x} y2={y + 4}
          style={{ stroke: '#374151', strokeWidth: 1 }} />,
      );
      if (v === null || v === undefined || String(v) === '') {
        // Blank box for the student to fill in
        els.push(
          <Rect key={`b${i}-${pi}`} x={x - 10} y={y + (dy < 0 ? -18 : 7)} width={20} height={12}
            style={{ fill: '#ffffff', stroke: '#9ca3af', strokeWidth: 0.7, strokeDasharray: '2 1.5' }} />,
        );
      } else {
        els.push(
          <SvgText key={`v${i}-${pi}`} x={x} y={y + dy} fontSize={8} fill="#111827" textAnchor="middle">
            {asciifyMath(String(v))}
          </SvgText>,
        );
      }
    });
  });

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <G>{els}</G>
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Analog clock — reading time, elapsed time
// ─────────────────────────────────────────────────────────────────────────────

function renderClock(fig: ClockFigure) {
  const w = 130;
  const h = 130;
  const cx = w / 2;
  const cy = h / 2;
  const r = 54;

  const els: React.ReactElement[] = [
    <Circle key="face" cx={cx} cy={cy} r={r}
      style={{ fill: '#ffffff', stroke: '#1e40af', strokeWidth: 1.6 }} />,
    <Circle key="hub" cx={cx} cy={cy} r={2} style={{ fill: '#1e40af' }} />,
  ];
  for (let i = 1; i <= 12; i++) {
    const ang = ((i * 30 - 90) * Math.PI) / 180;
    const xo = cx + Math.cos(ang) * (r - 5);
    const yo = cy + Math.sin(ang) * (r - 5);
    const xi = cx + Math.cos(ang) * (r - 10);
    const yi = cy + Math.sin(ang) * (r - 10);
    els.push(
      <Line key={`t${i}`} x1={xi} y1={yi} x2={xo} y2={yo}
        style={{ stroke: '#374151', strokeWidth: 1 }} />,
      <SvgText key={`n${i}`}
        x={cx + Math.cos(ang) * (r - 17)} y={cy + Math.sin(ang) * (r - 17) + 2.5}
        fontSize={7} fill="#374151" textAnchor="middle">
        {String(i)}
      </SvgText>,
    );
  }
  const minAng = ((fig.minute * 6 - 90) * Math.PI) / 180;
  const hourAng = (((fig.hour % 12) * 30 + fig.minute * 0.5 - 90) * Math.PI) / 180;
  els.push(
    <Line key="hh" x1={cx} y1={cy}
      x2={cx + Math.cos(hourAng) * (r - 26)} y2={cy + Math.sin(hourAng) * (r - 26)}
      style={{ stroke: '#111827', strokeWidth: 2.4 }} />,
    <Line key="mh" x1={cx} y1={cy}
      x2={cx + Math.cos(minAng) * (r - 13)} y2={cy + Math.sin(minAng) * (r - 13)}
      style={{ stroke: '#111827', strokeWidth: 1.4 }} />,
  );

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <G>{els}</G>
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Area model (partial products / distributive) — rows × cols partition
// ─────────────────────────────────────────────────────────────────────────────

function renderAreaModel(fig: AreaModelFigure) {
  const asNum = (v: number | string) => (typeof v === 'number' ? v : NaN);
  const rowVals = fig.rowParts.map(asNum);
  const colVals = fig.colParts.map(asNum);
  const rowsNumeric = rowVals.every((v) => Number.isFinite(v) && v > 0);
  const colsNumeric = colVals.every((v) => Number.isFinite(v) && v > 0);

  const totalW = 240;
  const totalH = 120;
  const labelPad = 22;

  // Proportional partition when numeric (min 22px so labels fit), equal otherwise.
  const partSizes = (parts: Array<number | string>, vals: number[], numeric: boolean, span: number) => {
    if (!numeric) return parts.map(() => span / parts.length);
    const sum = vals.reduce((a, b) => a + b, 0);
    const raw = vals.map((v) => (v / sum) * span);
    return raw.map((r) => Math.max(26, r));
  };
  const colWs = partSizes(fig.colParts, colVals, colsNumeric, totalW);
  const rowHs = partSizes(fig.rowParts, rowVals, rowsNumeric, totalH);
  const w = labelPad + colWs.reduce((a, b) => a + b, 0) + 4;
  const h = labelPad + rowHs.reduce((a, b) => a + b, 0) + 4;

  const els: React.ReactElement[] = [];
  // Column part labels (top edge)
  let x = labelPad;
  fig.colParts.forEach((p, c) => {
    els.push(
      <SvgText key={`cl${c}`} x={x + colWs[c] / 2} y={labelPad - 6} fontSize={8} fill="#1e40af" textAnchor="middle">
        {asciifyMath(String(p))}
      </SvgText>,
    );
    x += colWs[c];
  });
  // Row part labels (left edge)
  let y = labelPad;
  fig.rowParts.forEach((p, r) => {
    els.push(
      <SvgText key={`rl${r}`} x={labelPad - 6} y={y + rowHs[r] / 2 + 3} fontSize={8} fill="#1e40af" textAnchor="end">
        {asciifyMath(String(p))}
      </SvgText>,
    );
    y += rowHs[r];
  });
  // Cells
  y = labelPad;
  fig.rowParts.forEach((_, r) => {
    let cx2 = labelPad;
    fig.colParts.forEach((__, c) => {
      const label = fig.cellLabels?.[r]?.[c];
      els.push(
        <Rect key={`cell${r}-${c}`} x={cx2} y={y} width={colWs[c]} height={rowHs[r]}
          style={{ fill: '#ffffff', stroke: '#1e40af', strokeWidth: 0.9 }} />,
      );
      if (label) {
        els.push(
          <SvgText key={`ct${r}-${c}`} x={cx2 + colWs[c] / 2} y={y + rowHs[r] / 2 + 3}
            fontSize={8} fill="#111827" textAnchor="middle">
            {asciifyMath(label)}
          </SvgText>,
        );
      }
      cx2 += colWs[c];
    });
    y += rowHs[r];
  });

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <G>{els}</G>
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Polygon on a unit grid — area/perimeter by counting, irregular figures
// ─────────────────────────────────────────────────────────────────────────────

function renderPolygonGrid(fig: PolygonGridFigure) {
  const cell = Math.min(22, 260 / Math.max(fig.cols, 1), 170 / Math.max(fig.rowsCount, 1));
  const w = fig.cols * cell + 8;
  const h = fig.rowsCount * cell + 8;
  const ox = 4;
  const oy = 4;
  const px = (gx: number) => ox + gx * cell;
  const py = (gy: number) => oy + (fig.rowsCount - gy) * cell;

  const els: React.ReactElement[] = [];
  for (let c = 0; c <= fig.cols; c++) {
    els.push(
      <Line key={`v${c}`} x1={px(c)} y1={py(0)} x2={px(c)} y2={py(fig.rowsCount)}
        style={{ stroke: '#d1d5db', strokeWidth: 0.5 }} />,
    );
  }
  for (let r = 0; r <= fig.rowsCount; r++) {
    els.push(
      <Line key={`h${r}`} x1={px(0)} y1={py(r)} x2={px(fig.cols)} y2={py(r)}
        style={{ stroke: '#d1d5db', strokeWidth: 0.5 }} />,
    );
  }
  els.push(
    <Polygon key="poly"
      points={fig.vertices.map((v) => `${px(v.x)},${py(v.y)}`).join(' ')}
      style={{ fill: '#3b82f6', fillOpacity: 0.15, stroke: '#1e40af', strokeWidth: 1.4 }} />,
  );

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <G>{els}</G>
      </Svg>
      {fig.unitLabel ? <Text style={styles.figureCaption}>{fig.unitLabel}</Text> : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Net of a 3-D solid — surface area
// ─────────────────────────────────────────────────────────────────────────────

function renderNet(fig: NetFigure) {
  const unit = fig.unit ? ` ${fig.unit}` : '';
  const els: React.ReactElement[] = [];
  let w = 250;
  let h = 190;

  const rect = (x: number, y: number, rw: number, rh: number, key: string) =>
    els.push(
      <Rect key={key} x={x} y={y} width={rw} height={rh}
        style={{ fill: '#ffffff', stroke: '#1e40af', strokeWidth: 1 }} />,
    );
  const label = (x: number, y: number, text: string, key: string) =>
    els.push(
      <SvgText key={key} x={x} y={y} fontSize={7} fill="#374151" textAnchor="middle">
        {text}
      </SvgText>,
    );

  if (fig.solid === 'cube') {
    const s = 40;
    const ox = (w - 4 * s) / 2;
    const oy = (h - 3 * s) / 2;
    // Cross: 4 across the middle, 1 above, 1 below the second square
    rect(ox + s, oy, s, s, 'top');
    for (let i = 0; i < 4; i++) rect(ox + i * s, oy + s, s, s, `m${i}`);
    rect(ox + s, oy + 2 * s, s, s, 'bot');
    label(ox + s / 2, oy + s - 4, `${fig.dims.side ?? 's'}${unit}`, 'l1');
  } else if (fig.solid === 'rectangular-prism') {
    const { width: dw = 4, height: dh = 3, depth: dd = 2 } = fig.dims;
    const scale = Math.min(160 / (2 * dw + 2 * dd), 150 / (dh + 2 * dd), 22);
    const W = dw * scale, H = dh * scale, D = dd * scale;
    w = 2 * W + 2 * D + 20;
    h = H + 2 * D + 28;
    const ox = 10, oy = D + 14;
    // Middle band: side(D) front(W) side(D) back(W); top/bottom (W×D) over/under front
    rect(ox, oy, D, H, 'left');
    rect(ox + D, oy, W, H, 'front');
    rect(ox + D + W, oy, D, H, 'right');
    rect(ox + D + W + D, oy, W, H, 'back');
    rect(ox + D, oy - D, W, D, 'top');
    rect(ox + D, oy + H, W, D, 'bottom');
    label(ox + D + W / 2, oy - D - 3, `${dw}${unit}`, 'lw');
    label(ox + D / 2, oy + H / 2 + 2, `${dd}${unit}`, 'ld');
    label(ox + D + W + D + W + 2, oy + H / 2 + 2, `${dh}${unit}`, 'lh');
  } else if (fig.solid === 'square-pyramid') {
    const { base = 4, slant = 3 } = fig.dims;
    const scale = Math.min(90 / base, 60 / slant, 20);
    const B = base * scale, S = slant * scale;
    w = B + 2 * S + 20;
    h = B + 2 * S + 24;
    const ox = 10 + S, oy = 12 + S;
    rect(ox, oy, B, B, 'base');
    const tri = (points: string, key: string) =>
      els.push(
        <Polygon key={key} points={points}
          style={{ fill: '#ffffff', stroke: '#1e40af', strokeWidth: 1 }} />,
      );
    tri(`${ox},${oy} ${ox + B},${oy} ${ox + B / 2},${oy - S}`, 't');
    tri(`${ox},${oy + B} ${ox + B},${oy + B} ${ox + B / 2},${oy + B + S}`, 'b');
    tri(`${ox},${oy} ${ox},${oy + B} ${ox - S},${oy + B / 2}`, 'l');
    tri(`${ox + B},${oy} ${ox + B},${oy + B} ${ox + B + S},${oy + B / 2}`, 'r');
    label(ox + B / 2, oy + B / 2 + 2, `${base}${unit}`, 'lb');
    label(ox + B / 2 + 14, oy - S / 2, `${slant}${unit}`, 'ls');
  } else if (fig.solid === 'triangular-prism') {
    const { base = 4, triHeight = 3, length = 6 } = fig.dims;
    const side = Math.hypot(base / 2, triHeight);
    const scale = Math.min(150 / length, 110 / (base + 2 * side), 18);
    const B = base * scale, TH = triHeight * scale, L = length * scale, SD = side * scale;
    w = L + 2 * B + 24;
    h = B + 2 * SD + 20;
    const ox = 10 + B, oy = 10 + SD;
    // Three rectangles stacked (widths L; heights side, base, side) + 2 end triangles
    rect(ox, oy - SD, L, SD, 'r1');
    rect(ox, oy, L, B, 'r2');
    rect(ox, oy + B, L, SD, 'r3');
    els.push(
      <Polygon key="t1" points={`${ox},${oy} ${ox},${oy + B} ${ox - TH},${oy + B / 2}`}
        style={{ fill: '#ffffff', stroke: '#1e40af', strokeWidth: 1 }} />,
      <Polygon key="t2" points={`${ox + L},${oy} ${ox + L},${oy + B} ${ox + L + TH},${oy + B / 2}`}
        style={{ fill: '#ffffff', stroke: '#1e40af', strokeWidth: 1 }} />,
    );
    label(ox + L / 2, oy + B / 2 + 2, `${length} x ${base}${unit}`, 'lm');
    label(ox - TH / 2 - 2, oy + B / 2 - 6, `${triHeight}${unit}`, 'lt');
  } else {
    // cylinder
    const { radius = 2, height: ch = 5 } = fig.dims;
    const scale = Math.min(60 / radius, 70 / ch, 16);
    const R = radius * scale;
    const CH = ch * scale;
    const RW = 2 * Math.PI * R;
    const drawW = Math.min(RW, 200);
    w = Math.max(drawW, 2 * R) + 40;
    h = 2 * R + CH + 2 * R + 36;
    const cx = w / 2;
    els.push(
      <Circle key="c1" cx={cx} cy={12 + R} r={R}
        style={{ fill: '#ffffff', stroke: '#1e40af', strokeWidth: 1 }} />,
    );
    rect(cx - drawW / 2, 16 + 2 * R, drawW, CH, 'body');
    els.push(
      <Circle key="c2" cx={cx} cy={20 + 2 * R + CH + R} r={R}
        style={{ fill: '#ffffff', stroke: '#1e40af', strokeWidth: 1 }} />,
    );
    label(cx, 12 + R + 2, `r = ${radius}${unit}`, 'lr');
    label(cx, 16 + 2 * R + CH / 2 + 2, `h = ${ch}${unit}`, 'lh');
  }

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <G>{els}</G>
      </Svg>
    </View>
  );
}

function render3DShape(fig: GeometricFigure) {
  const w = 220;
  const h = 160;
  // Simplified 2D representation: just the silhouette with depth lines.
  const params = fig.parameters as {
    width?: number; height?: number; depth?: number; radius?: number;
  };

  let svg: React.ReactElement;
  switch (fig.shape) {
    case 'cylinder-3d': {
      const r = 40;
      svg = (
        <G>
          {/* Top ellipse */}
          <Path d={`M ${w / 2 - r} 30 a ${r} 10 0 1 0 ${2 * r} 0 a ${r} 10 0 1 0 ${-2 * r} 0`}
            style={{ fill: 'none', stroke: '#1e40af', strokeWidth: 1.2 }} />
          {/* Sides */}
          <Line x1={w / 2 - r} y1={30} x2={w / 2 - r} y2={130}
            style={{ stroke: '#1e40af', strokeWidth: 1.2 }} />
          <Line x1={w / 2 + r} y1={30} x2={w / 2 + r} y2={130}
            style={{ stroke: '#1e40af', strokeWidth: 1.2 }} />
          {/* Bottom front arc */}
          <Path d={`M ${w / 2 - r} 130 a ${r} 10 0 0 0 ${2 * r} 0`}
            style={{ fill: 'none', stroke: '#1e40af', strokeWidth: 1.2 }} />
          {/* Bottom back arc (dashed) */}
          <Path d={`M ${w / 2 - r} 130 a ${r} 10 0 0 1 ${2 * r} 0`}
            style={{ fill: 'none', stroke: '#1e40af', strokeWidth: 0.8, strokeDasharray: '3 2' }} />
        </G>
      );
      break;
    }
    case 'cone-3d': {
      const r = 50;
      svg = (
        <G>
          <Path d={`M ${w / 2} 30 L ${w / 2 - r} 130 L ${w / 2 + r} 130 Z`}
            style={{ fill: 'none', stroke: '#1e40af', strokeWidth: 1.2 }} />
          <Path d={`M ${w / 2 - r} 130 a ${r} 10 0 0 0 ${2 * r} 0`}
            style={{ fill: 'none', stroke: '#1e40af', strokeWidth: 1.2 }} />
          <Path d={`M ${w / 2 - r} 130 a ${r} 10 0 0 1 ${2 * r} 0`}
            style={{ fill: 'none', stroke: '#1e40af', strokeWidth: 0.8, strokeDasharray: '3 2' }} />
        </G>
      );
      break;
    }
    case 'sphere-3d': {
      const r = 50;
      svg = (
        <G>
          <Circle cx={w / 2} cy={h / 2} r={r}
            style={{ fill: 'none', stroke: '#1e40af', strokeWidth: 1.2 }} />
          {/* Equator (suggests 3D) */}
          <Path d={`M ${w / 2 - r} ${h / 2} a ${r} 12 0 0 0 ${2 * r} 0`}
            style={{ fill: 'none', stroke: '#1e40af', strokeWidth: 0.8, strokeDasharray: '2 2' }} />
        </G>
      );
      break;
    }
    case 'prism-3d': {
      const bw = 110, bh = 70, depth = 25;
      const x0 = (w - bw) / 2;
      const y0 = (h - bh) / 2 + 10;
      svg = (
        <G>
          <Rect x={x0} y={y0} width={bw} height={bh}
            style={{ fill: 'none', stroke: '#1e40af', strokeWidth: 1.2 }} />
          {/* Back face offset */}
          <Polygon points={`${x0},${y0} ${x0 + depth},${y0 - depth} ${x0 + bw + depth},${y0 - depth} ${x0 + bw},${y0}`}
            style={{ fill: 'none', stroke: '#1e40af', strokeWidth: 1.2 }} />
          <Line x1={x0 + bw} y1={y0} x2={x0 + bw + depth} y2={y0 - depth}
            style={{ stroke: '#1e40af', strokeWidth: 1.2 }} />
          <Line x1={x0 + bw} y1={y0 + bh} x2={x0 + bw + depth} y2={y0 + bh - depth}
            style={{ stroke: '#1e40af', strokeWidth: 1.2 }} />
          <Line x1={x0 + bw + depth} y1={y0 - depth} x2={x0 + bw + depth} y2={y0 + bh - depth}
            style={{ stroke: '#1e40af', strokeWidth: 0.8, strokeDasharray: '3 2' }} />
        </G>
      );
      break;
    }
    default:
      svg = <SvgText x={w / 2} y={h / 2} fontSize={9} fill="#6b7280" textAnchor="middle">
        [{fig.shape}]
      </SvgText>;
  }

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {svg}
        {(fig.labels ?? []).map((lbl, i) => (
          <SvgText key={i} x={w / 2} y={h - 4 + i * 10} fontSize={8} fill="#374151" textAnchor="middle">
            {lbl.text}
          </SvgText>
        ))}
        <SvgText x={w / 2} y={h - 16} fontSize={7} fill="#9ca3af" textAnchor="middle">
          {params.radius != null ? `r = ${params.radius}` : ''}
          {params.height != null ? `  h = ${params.height}` : ''}
          {params.width != null ? `  w = ${params.width}` : ''}
          {params.depth != null ? `  d = ${params.depth}` : ''}
        </SvgText>
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Data display renderer
// ─────────────────────────────────────────────────────────────────────────────

function renderDataDisplay(fig: DataDisplayFigure) {
  switch (fig.display) {
    case 'dot-plot': return renderDotPlot(fig);
    case 'bar-chart': return renderBarChart(fig);
    case 'box-plot': return renderBoxPlot(fig);
    case 'scatter-plot': return renderScatterPlot(fig);
    case 'histogram': return renderHistogram(fig);
  }
}

function renderDotPlot(fig: DataDisplayFigure) {
  const values = fig.values ?? [];
  if (values.length === 0) return null;
  const w = 320;
  const h = 100;
  const margin = 20;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const px = (v: number) => margin + ((v - min) / Math.max(max - min, 1)) * (w - 2 * margin);

  // Stack dots at each value
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);

  const dots: React.ReactElement[] = [];
  counts.forEach((count, v) => {
    for (let i = 0; i < count; i++) {
      dots.push(
        <Circle key={`${v}-${i}`} cx={px(v)} cy={h - 25 - i * 8} r={3}
          style={{ fill: '#2563eb', stroke: '#1e40af', strokeWidth: 0.5 }} />,
      );
    }
  });

  const ticks: React.ReactElement[] = [];
  for (let v = min; v <= max; v++) {
    ticks.push(
      <Line key={`t${v}`} x1={px(v)} y1={h - 20} x2={px(v)} y2={h - 16}
        style={{ stroke: '#374151', strokeWidth: 0.6 }} />,
      <SvgText key={`tl${v}`} x={px(v)} y={h - 8} fontSize={7} fill="#374151" textAnchor="middle">
        {v}
      </SvgText>,
    );
  }

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Line x1={margin} y1={h - 20} x2={w - margin} y2={h - 20}
          style={{ stroke: '#374151', strokeWidth: 1 }} />
        {ticks}
        {dots}
      </Svg>
    </View>
  );
}

function renderBarChart(fig: DataDisplayFigure) {
  const cats = fig.categories ?? [];
  if (cats.length === 0) return null;
  const w = 320;
  const h = 160;
  const margin = 30;
  const max = Math.max(...cats.map((c) => c.value));
  const barW = (w - 2 * margin) / cats.length * 0.7;
  const gap = (w - 2 * margin) / cats.length * 0.3;

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Line x1={margin} y1={h - margin} x2={w - margin} y2={h - margin}
          style={{ stroke: '#374151', strokeWidth: 1 }} />
        <Line x1={margin} y1={margin} x2={margin} y2={h - margin}
          style={{ stroke: '#374151', strokeWidth: 1 }} />
        {cats.map((c, i) => {
          const x = margin + i * (barW + gap) + gap / 2;
          const barH = (c.value / max) * (h - 2 * margin);
          return (
            <G key={i}>
              <Rect x={x} y={h - margin - barH} width={barW} height={barH}
                style={{ fill: '#3b82f6', stroke: '#1e40af', strokeWidth: 0.5 }} />
              <SvgText x={x + barW / 2} y={h - margin + 10} fontSize={7} fill="#374151" textAnchor="middle">
                {c.label}
              </SvgText>
              <SvgText x={x + barW / 2} y={h - margin - barH - 3} fontSize={7} fill="#1e40af" textAnchor="middle">
                {c.value}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

function renderBoxPlot(fig: DataDisplayFigure) {
  const five = fig.fiveNumber;
  if (!five) return null;
  const w = 360;
  const h = 80;
  const margin = 30;
  const min = five.min;
  const max = five.max;
  const range = Math.max(max - min, 1);
  const px = (v: number) => margin + ((v - min) / range) * (w - 2 * margin);
  const boxY = 30;
  const boxH = 24;

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Whiskers */}
        <Line x1={px(min)} y1={boxY + boxH / 2} x2={px(five.q1)} y2={boxY + boxH / 2}
          style={{ stroke: '#374151', strokeWidth: 1 }} />
        <Line x1={px(five.q3)} y1={boxY + boxH / 2} x2={px(max)} y2={boxY + boxH / 2}
          style={{ stroke: '#374151', strokeWidth: 1 }} />
        {/* End caps */}
        <Line x1={px(min)} y1={boxY + 4} x2={px(min)} y2={boxY + boxH - 4}
          style={{ stroke: '#374151', strokeWidth: 1 }} />
        <Line x1={px(max)} y1={boxY + 4} x2={px(max)} y2={boxY + boxH - 4}
          style={{ stroke: '#374151', strokeWidth: 1 }} />
        {/* Box */}
        <Rect x={px(five.q1)} y={boxY} width={px(five.q3) - px(five.q1)} height={boxH}
          style={{ fill: '#dbeafe', stroke: '#1e40af', strokeWidth: 1 }} />
        {/* Median */}
        <Line x1={px(five.median)} y1={boxY} x2={px(five.median)} y2={boxY + boxH}
          style={{ stroke: '#1e40af', strokeWidth: 1.5 }} />
        {/* Labels */}
        {[
          { v: min, label: 'min' },
          { v: five.q1, label: 'Q1' },
          { v: five.median, label: 'med' },
          { v: five.q3, label: 'Q3' },
          { v: max, label: 'max' },
        ].map((m, i) => (
          <SvgText key={i} x={px(m.v)} y={boxY + boxH + 12} fontSize={7} fill="#374151" textAnchor="middle">
            {m.v}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

function renderScatterPlot(fig: DataDisplayFigure) {
  const points = fig.points ?? [];
  if (points.length === 0) return null;
  const w = 240;
  const h = 200;
  const margin = 30;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = fig.xRange?.[0] ?? Math.min(...xs);
  const xMax = fig.xRange?.[1] ?? Math.max(...xs);
  const yMin = fig.yRange?.[0] ?? Math.min(...ys);
  const yMax = fig.yRange?.[1] ?? Math.max(...ys);
  const px = (x: number) => margin + ((x - xMin) / Math.max(xMax - xMin, 1)) * (w - 2 * margin);
  const py = (y: number) => h - margin - ((y - yMin) / Math.max(yMax - yMin, 1)) * (h - 2 * margin);

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Line x1={margin} y1={h - margin} x2={w - margin} y2={h - margin}
          style={{ stroke: '#374151', strokeWidth: 1 }} />
        <Line x1={margin} y1={margin} x2={margin} y2={h - margin}
          style={{ stroke: '#374151', strokeWidth: 1 }} />
        {points.map((p, i) => (
          <Circle key={i} cx={px(p.x)} cy={py(p.y)} r={2.5}
            style={{ fill: '#2563eb', stroke: '#1e40af', strokeWidth: 0.5 }} />
        ))}
        {fig.trendLine && (
          <Line
            x1={px(xMin)} y1={py(fig.trendLine.slope * xMin + fig.trendLine.intercept)}
            x2={px(xMax)} y2={py(fig.trendLine.slope * xMax + fig.trendLine.intercept)}
            style={{ stroke: '#dc2626', strokeWidth: 1, strokeDasharray: '4 2' }} />
        )}
        {fig.xLabel && (
          <SvgText x={w / 2} y={h - 6} fontSize={8} fill="#374151" textAnchor="middle">
            {fig.xLabel}
          </SvgText>
        )}
        {fig.yLabel && (
          <SvgText x={10} y={h / 2} fontSize={8} fill="#374151" textAnchor="middle">
            {fig.yLabel}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}

function renderHistogram(fig: DataDisplayFigure) {
  return renderBarChart({
    ...fig,
    categories: (fig.values ?? []).map((v, i) => ({ label: String(i), value: v })),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Fraction model renderer (area-rectangle / area-circle / bar)
// ─────────────────────────────────────────────────────────────────────────────

function renderFractionModel(fig: FractionModelFigure) {
  const w = 240;
  const h = 80;
  const renderModel = (model: FractionModelFigure['model'], total: number, shaded: number, x0: number, y0: number, label?: string) => {
    if (model === 'area-circle') {
      const r = 30;
      const cx = x0 + r + 10;
      const cy = y0 + r;
      const slices: React.ReactElement[] = [];
      for (let i = 0; i < total; i++) {
        const a1 = (i / total) * 2 * Math.PI - Math.PI / 2;
        const a2 = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2;
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
        const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
        const large = a2 - a1 > Math.PI ? 1 : 0;
        slices.push(
          <Path key={i}
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
            style={{
              fill: i < shaded ? '#3b82f6' : '#ffffff',
              stroke: '#1e40af', strokeWidth: 0.8,
            }} />,
        );
      }
      return (
        <G>
          {slices}
          {label && <SvgText x={cx} y={cy + r + 12} fontSize={8} fill="#374151" textAnchor="middle">{label}</SvgText>}
        </G>
      );
    } else {
      // area-rectangle / bar
      const bw = 100;
      const bh = 40;
      const sliceW = bw / total;
      const slices: React.ReactElement[] = [];
      for (let i = 0; i < total; i++) {
        slices.push(
          <Rect key={i} x={x0 + i * sliceW} y={y0} width={sliceW} height={bh}
            style={{
              fill: i < shaded ? '#3b82f6' : '#ffffff',
              stroke: '#1e40af', strokeWidth: 0.8,
            }} />,
        );
      }
      return (
        <G>
          {slices}
          {label && <SvgText x={x0 + bw / 2} y={y0 + bh + 12} fontSize={8} fill="#374151" textAnchor="middle">{label}</SvgText>}
        </G>
      );
    }
  };

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {renderModel(fig.model, fig.totalParts, fig.shadedParts, 10, 10,
          fig.label ?? `${fig.shadedParts}/${fig.totalParts}`)}
        {fig.compare && renderModel(
          fig.model, fig.compare.totalParts, fig.compare.shadedParts, 130, 10,
          fig.compare.label ?? `${fig.compare.shadedParts}/${fig.compare.totalParts}`,
        )}
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Function mapping diagram (set X → set Y with arrows)
// ─────────────────────────────────────────────────────────────────────────────

function renderFunctionMapping(fig: FunctionMappingFigure) {
  const w = 220;
  const h = Math.max(fig.inputs.length, fig.outputs.length) * 22 + 40;
  const leftX = 50;
  const rightX = w - 50;
  const topY = 30;
  const rowH = 22;

  return (
    <View style={styles.figureContainer}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Left column */}
        <Rect x={leftX - 30} y={topY - 14} width={60} height={fig.inputs.length * rowH + 12}
          rx={20} ry={20}
          style={{ fill: 'none', stroke: '#1e40af', strokeWidth: 1 }} />
        {fig.inputs.map((v, i) => (
          <SvgText key={`l${i}`} x={leftX} y={topY + i * rowH + 4} fontSize={9} fill="#374151" textAnchor="middle">
            {String(v)}
          </SvgText>
        ))}
        {/* Right column */}
        <Rect x={rightX - 30} y={topY - 14} width={60} height={fig.outputs.length * rowH + 12}
          rx={20} ry={20}
          style={{ fill: 'none', stroke: '#1e40af', strokeWidth: 1 }} />
        {fig.outputs.map((v, i) => (
          <SvgText key={`r${i}`} x={rightX} y={topY + i * rowH + 4} fontSize={9} fill="#374151" textAnchor="middle">
            {String(v)}
          </SvgText>
        ))}
        {/* Mappings */}
        {fig.mappings.map((m, i) => (
          <Line key={`m${i}`}
            x1={leftX + 18} y1={topY + m.from * rowH}
            x2={rightX - 18} y2={topY + m.to * rowH}
            style={{ stroke: '#7c3aed', strokeWidth: 1 }} />
        ))}
        {/* Labels */}
        {fig.inputLabel && (
          <SvgText x={leftX} y={topY - 22} fontSize={8} fontFamily="Helvetica-Bold" fill="#1e40af" textAnchor="middle">
            {fig.inputLabel}
          </SvgText>
        )}
        {fig.outputLabel && (
          <SvgText x={rightX} y={topY - 22} fontSize={8} fontFamily="Helvetica-Bold" fill="#1e40af" textAnchor="middle">
            {fig.outputLabel}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG Text helper (Text inside Svg, since @react-pdf treats them differently)
// ─────────────────────────────────────────────────────────────────────────────

// react-pdf Svg exports Text but here we shadow with a typed local component
// to make the props less leaky.
import { Text as PdfSvgText } from '@react-pdf/renderer';
function SvgText({ children, ...rest }: {
  children: React.ReactNode;
  x: number; y: number;
  fontSize?: number;
  fill?: string;
  fontFamily?: string;
  textAnchor?: 'start' | 'middle' | 'end';
}) {
  return <PdfSvgText {...rest}>{children}</PdfSvgText>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Top-level figure dispatch
// ─────────────────────────────────────────────────────────────────────────────

function renderFigure(figure: Figure) {
  switch (figure.kind) {
    case 'coordinate-plane': return renderCoordinatePlane(figure);
    case 'number-line': return renderNumberLine(figure);
    case 'geometric-figure': return renderGeometricFigure(figure);
    case 'data-display': return renderDataDisplay(figure);
    case 'fraction-model': return renderFractionModel(figure);
    case 'function-mapping': return renderFunctionMapping(figure);
    case 'angle': return renderAngle(figure);
    case 'table': return renderTable(figure);
    case 'tape-diagram': return renderTapeDiagram(figure);
    case 'double-number-line': return renderDoubleNumberLine(figure);
    case 'clock': return renderClock(figure);
    case 'area-model': return renderAreaModel(figure);
    case 'polygon-grid': return renderPolygonGrid(figure);
    case 'net': return renderNet(figure);
    default:
      // Unknown kind from a newer/older generator — degrade gracefully.
      return (
        <View style={styles.figureContainer}>
          <Text style={styles.figureCaption}>[See figure described in problem]</Text>
        </View>
      );
  }
}

// Legacy fallback: old questions only had hasGrid + gridType. Render the
// simplest possible plane / number line so historical worksheets still display.
function renderLegacyGrid(q: Question) {
  if (q.gridType === 'coordinate-plane') {
    return renderCoordinatePlane({
      kind: 'coordinate-plane',
      xRange: [-10, 10],
      yRange: [-10, 10],
    });
  }
  if (q.gridType === 'number-line') {
    return renderNumberLine({
      kind: 'number-line',
      min: -10,
      max: 10,
      majorTick: 5,
      minorTick: 1,
    });
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Worksheet components
// ─────────────────────────────────────────────────────────────────────────────

interface TopicReviewRef {
  topicId?: string;
  topicName: string;
  bookRefs?: BookRef[];
}

// "Watch first" block: a QR code to the worksheet's /watch page + the top
// video titles, printed at the top of the sheet so kids watch BEFORE working.
export interface WatchBlock {
  qrDataUrl?: string;      // PNG data URL (generated in render.ts via `qrcode`)
  url?: string;            // human-readable short URL fallback
  videos: Array<{ topicName: string; title: string; minutes?: number }>;
}

interface WorksheetDay {
  title: string;
  questions: Question[];
  date?: string;
  topicReviews?: TopicReviewRef[];
  watch?: WatchBlock;
}

interface WorksheetPDFProps {
  title: string;
  childName: string;
  questions: Question[];
  date?: string;
  topicReviews?: TopicReviewRef[];
  watch?: WatchBlock;
}

interface BatchWorksheetPDFProps {
  childName: string;
  days: WorksheetDay[];
}

function formatBookRef(ref: BookRef): string {
  if (ref.chapter != null) return `Ch ${ref.chapter}`;
  if (ref.chapters) return `Ch ${ref.chapters[0]}–${ref.chapters[1]}`;
  if (ref.unit) return ref.unit;
  return '';
}

function formatBookRefs(refs?: BookRef[]): string {
  if (!refs || refs.length === 0) return '';
  const parts = refs
    .map((r) => {
      const where = formatBookRef(r);
      const note = r.note ? ` (${r.note})` : '';
      return where ? `${where}${note}` : '';
    })
    .filter(Boolean);
  return parts.length ? `Book: ${parts.join(', ')}` : '';
}

function renderQuestion(q: Question, refsByTopic?: Map<string, BookRef[] | undefined>) {
  // Match by topicId first (reliable), then topicName as a fallback.
  const refs = refsByTopic?.get(q.topicId) ?? refsByTopic?.get(q.topicName);
  const refLine = formatBookRefs(refs);
  return (
    <View key={q.number} style={styles.questionBlock} wrap={false}>
      <Text>
        <Text style={styles.questionNumber}>{q.number}. </Text>
        <Text style={styles.questionText}>{asciifyMath(q.question)}</Text>
      </Text>
      {refLine ? <Text style={styles.bookRefLine}>{refLine}</Text> : null}
      {q.figure ? renderFigure(q.figure) : (q.hasGrid && renderLegacyGrid(q))}
      <View style={styles.answerSpace} />
      <Text style={styles.answerLabel}>Answer</Text>
    </View>
  );
}

function WatchFirstBox({ watch }: { watch: WatchBlock }) {
  if (!watch.videos.length && !watch.qrDataUrl) return null;
  return (
    <View style={styles.watchBox}>
      <View style={styles.watchLeft}>
        <Text style={styles.watchHeader}>New today — watch these two first (optional)</Text>
        {watch.videos.slice(0, 2).map((v, i) => (
          <Text key={i} style={styles.watchRow}>
            • {v.topicName}: {v.title}
            {v.minutes ? ` (${v.minutes} min)` : ''}
          </Text>
        ))}
        <Text style={styles.watchRow}>
          Stuck on ANY question? Scan the code — every question number has its own help
          video there.
        </Text>
        {watch.url ? <Text style={styles.watchUrl}>{watch.url}</Text> : null}
      </View>
      {watch.qrDataUrl ? (
        <View>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={watch.qrDataUrl} style={styles.watchQr} />
          <Text style={styles.watchQrLabel}>Scan for help videos</Text>
        </View>
      ) : null}
    </View>
  );
}

function WorksheetPage({ title, childName, questions, dateStr, topicReviews, watch }: {
  title: string;
  childName: string;
  questions: Question[];
  dateStr: string;
  topicReviews?: TopicReviewRef[];
  watch?: WatchBlock;
}) {
  const hasNewSection = questions.some((q) => q.section === 'new');
  const hasReviewSection = questions.some((q) => q.section === 'review');
  const hasSections = hasNewSection && hasReviewSection;

  const newQuestions = hasSections ? questions.filter((q) => q.section === 'new') : [];
  const reviewQuestions = hasSections ? questions.filter((q) => q.section === 'review') : [];

  // Look up each question's book chapters, keyed by BOTH topicId and topicName
  // so renderQuestion can match on id (reliable) or fall back to name.
  const refsByTopic = new Map<string, BookRef[] | undefined>();
  for (const t of topicReviews ?? []) {
    if (t.topicId) refsByTopic.set(t.topicId, t.bookRefs);
    refsByTopic.set(t.topicName, t.bookRefs);
  }

  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>Math Maestro</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Score</Text>
            <View style={styles.scoreLine} />
          </View>
        </View>
        <View style={styles.nameDate}>
          <View>
            <Text>Name: <Text style={styles.nameLine}>  {childName}  </Text></Text>
          </View>
          <View>
            <Text>Date: <Text style={styles.dateLine}>  {dateStr}  </Text></Text>
          </View>
        </View>
      </View>

      {watch ? <WatchFirstBox watch={watch} /> : null}

      {hasSections ? (
        <>
          {newQuestions.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>New Topics</Text>
              </View>
              {newQuestions.map((q) => renderQuestion(q, refsByTopic))}
            </>
          )}
          {reviewQuestions.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>Review</Text>
              </View>
              {reviewQuestions.map((q) => renderQuestion(q, refsByTopic))}
            </>
          )}
        </>
      ) : (
        questions.map((q) => renderQuestion(q, refsByTopic))
      )}

      <Text style={styles.footer}>
        Generated by Math Maestro • {dateStr}
      </Text>
    </Page>
  );
}

export function WorksheetPDF({ title, childName, questions, date, topicReviews, watch }: WorksheetPDFProps) {
  const dateStr = date || new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <WorksheetPage title={title} childName={childName} questions={questions} dateStr={dateStr} topicReviews={topicReviews} watch={watch} />
    </Document>
  );
}

export function BatchWorksheetPDF({ childName, days }: BatchWorksheetPDFProps) {
  const defaultDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      {days.map((day, i) => (
        <WorksheetPage
          key={i}
          title={day.title}
          childName={childName}
          questions={day.questions}
          dateStr={day.date || defaultDate}
          topicReviews={day.topicReviews}
          watch={day.watch}
        />
      ))}
    </Document>
  );
}
