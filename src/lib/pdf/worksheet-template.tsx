import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Line, Circle, G } from '@react-pdf/renderer';
import { Question } from '@/types';

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
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#666',
  },
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
  questionBlock: {
    marginBottom: 16,
    paddingLeft: 4,
  },
  questionNumber: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },
  questionText: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 1.4,
  },
  answerSpace: {
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderBottomStyle: 'dashed',
    height: 24,
    width: '60%',
  },
  answerLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
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
  scoreLabel: {
    fontSize: 10,
    color: '#666',
  },
  scoreLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    width: 50,
    height: 20,
    marginTop: 4,
  },
  gridContainer: {
    marginTop: 4,
    marginBottom: 8,
    alignItems: 'center',
  },
});

// 10x10 coordinate plane grid (200x200 points, origin at center)
function CoordinatePlaneGrid() {
  const size = 200;
  const half = size / 2;
  const step = size / 10;
  const gridLines: React.ReactElement[] = [];
  const labels: React.ReactElement[] = [];

  // Grid lines
  for (let i = 0; i <= 10; i++) {
    const pos = i * step;
    const isAxis = i === 5;
    gridLines.push(
      <Line key={`h${i}`} x1={0} y1={pos} x2={size} y2={pos}
        style={{ stroke: isAxis ? '#333' : '#ccc', strokeWidth: isAxis ? 1.5 : 0.5 }} />,
      <Line key={`v${i}`} x1={pos} y1={0} x2={pos} y2={size}
        style={{ stroke: isAxis ? '#333' : '#ccc', strokeWidth: isAxis ? 1.5 : 0.5 }} />,
    );
  }

  // Axis tick labels (-5 to 5)
  for (let n = -5; n <= 5; n++) {
    const px = half + n * step;
    if (n !== 0) {
      labels.push(
        <Circle key={`tx${n}`} cx={px} cy={half} r={0.8} style={{ fill: '#333' }} />,
        <Circle key={`ty${n}`} cx={half} cy={half - n * step} r={0.8} style={{ fill: '#333' }} />,
      );
    }
  }

  return (
    <View style={styles.gridContainer}>
      <Svg width={220} height={220} viewBox="-10 -10 220 220">
        <G>{gridLines}</G>
        <G>{labels}</G>
        {/* X-axis label */}
        <G>
          <Line x1={0} y1={half} x2={size} y2={half} style={{ stroke: '#333', strokeWidth: 1.5 }} />
          <Line x1={half} y1={0} x2={half} y2={size} style={{ stroke: '#333', strokeWidth: 1.5 }} />
        </G>
      </Svg>
      <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>
        (Each square = 1 unit. Origin at center.)
      </Text>
    </View>
  );
}

function NumberLineGrid() {
  const width = 300;
  const height = 40;
  const margin = 20;
  const lineY = 20;
  const tickCount = 21; // -10 to 10
  const step = (width - 2 * margin) / (tickCount - 1);

  const ticks: React.ReactElement[] = [];
  for (let i = 0; i < tickCount; i++) {
    const x = margin + i * step;
    const val = i - 10;
    const isMajor = val % 5 === 0;
    ticks.push(
      <Line key={`t${i}`} x1={x} y1={lineY - (isMajor ? 6 : 3)} x2={x} y2={lineY + (isMajor ? 6 : 3)}
        style={{ stroke: '#333', strokeWidth: isMajor ? 1 : 0.5 }} />,
    );
  }

  return (
    <View style={styles.gridContainer}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line x1={margin} y1={lineY} x2={width - margin} y2={lineY} style={{ stroke: '#333', strokeWidth: 1 }} />
        <G>{ticks}</G>
      </Svg>
      <Text style={{ fontSize: 8, color: '#666', marginTop: 1 }}>
        (Number line: -10 to 10, major ticks at every 5)
      </Text>
    </View>
  );
}

interface WorksheetDay {
  title: string;
  questions: Question[];
  date?: string;
}

interface WorksheetPDFProps {
  title: string;
  childName: string;
  questions: Question[];
  date?: string;
}

interface BatchWorksheetPDFProps {
  childName: string;
  days: WorksheetDay[];
}

function renderQuestion(q: Question) {
  return (
    <View key={q.number} style={styles.questionBlock} wrap={false}>
      <Text>
        <Text style={styles.questionNumber}>{q.number}. </Text>
        <Text style={styles.questionText}>{q.question}</Text>
      </Text>
      {q.hasGrid && q.gridType === 'coordinate-plane' && <CoordinatePlaneGrid />}
      {q.hasGrid && q.gridType === 'number-line' && <NumberLineGrid />}
      <View style={styles.answerSpace} />
      <Text style={styles.answerLabel}>Answer</Text>
    </View>
  );
}

function WorksheetPage({ title, childName, questions, dateStr }: {
  title: string;
  childName: string;
  questions: Question[];
  dateStr: string;
}) {
  const hasNewSection = questions.some((q) => q.section === 'new');
  const hasReviewSection = questions.some((q) => q.section === 'review');
  const hasSections = hasNewSection && hasReviewSection;

  const newQuestions = hasSections ? questions.filter((q) => q.section === 'new') : [];
  const reviewQuestions = hasSections ? questions.filter((q) => q.section === 'review') : [];

  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>MathMaestro</Text>
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

      {hasSections ? (
        <>
          {newQuestions.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>New Topics</Text>
              </View>
              {newQuestions.map(renderQuestion)}
            </>
          )}
          {reviewQuestions.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>Review</Text>
              </View>
              {reviewQuestions.map(renderQuestion)}
            </>
          )}
        </>
      ) : (
        questions.map(renderQuestion)
      )}

      <Text style={styles.footer}>
        Generated by MathMaestro • {dateStr}
      </Text>
    </Page>
  );
}

export function WorksheetPDF({ title, childName, questions, date }: WorksheetPDFProps) {
  const dateStr = date || new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <WorksheetPage title={title} childName={childName} questions={questions} dateStr={dateStr} />
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
        />
      ))}
    </Document>
  );
}
