// ─────────────────────────────────────────────────────────────────────────────
// Week-1 diagnostic probes.
//
// A diagnostic is a short (~20 min) placement worksheet that samples a fixed set
// of skills at baseline difficulty. Unlike a normal worksheet it does NOT ramp
// difficulty or mix in spaced-repetition review — the point is to measure where
// each kid actually stands so the first weeks of spaced repetition can be
// weighted toward their gaps. When graded, the per-topic results flow into
// TopicMastery via the normal updateMastery path, so no special handling is
// needed downstream.
// ─────────────────────────────────────────────────────────────────────────────

import { getTopicById, getTopicsForChild } from './index';
import { CurriculumTopic } from './types';

export interface DiagnosticProbe {
  label: string;
  description: string;
  topicIds: string[];
  questionsPerTopic: number;
}

export interface DiagnosticChildInput {
  name: string;
  grade: number;
  track: string;
  state?: string;
  district?: string;
}

export interface ResolvedDiagnostic {
  label: string;
  description: string;
  topics: CurriculumTopic[];
  totalQuestions: number;
  questionsPerTopic: number;
}

// Named probes, keyed by lowercased child name. Tuned to each kid's known
// starting point (see HANDOFF_DEBRIEF.md / kids_summer_math memory).
const NAMED_PROBES: Record<string, DiagnosticProbe> = {
  // Eliana skipped into the accelerated Math 7/8 track. Her placement exam
  // covered through mid-7; signed-rational arithmetic is her biggest fluency
  // gap. This probe measures mid-7 number sense + proportional reasoning so we
  // know which mid-7 topics to over-weight in Weeks 2–5.
  eliana: {
    label: 'Mid-7 Placement Probe',
    description:
      'Signed-rational arithmetic, proportional reasoning, and foundational algebra — the mid-7 skills the accelerated Math 7/8 track assumes.',
    topicIds: [
      '7.ns.4', // Adding and Subtracting Rational Numbers (signed) — key gap
      '7.ns.5', // Multiplying and Dividing Rational Numbers (signed) — key gap
      '7.ns.2', // Comparing and Ordering Rational Numbers
      '7.ns.3', // Converting Between Fractions, Decimals, and Percents
      '7.pr.1', // Constant of Proportionality and Unit Rates
      '7.pr.2', // Proportional vs. Non-Proportional Relationships
      '7.pr.3', // Percent Increase and Decrease
      '7.ee.1', // Simplifying Expressions and Combining Like Terms
      '7.ee.3', // Solving Two-Step Equations
    ],
    questionsPerTopic: 3,
  },

  // Mylo is entering 4th. This probe checks the 3rd-grade foundations 4th grade
  // builds on, so we know whether Week 1 starts with foundation review or jumps
  // straight into 4.2 place value.
  mylo: {
    label: '3rd-Grade Foundations Probe',
    description:
      'Multi-digit add/subtract fluency, multiplication & division facts, and fraction concepts from 3rd grade.',
    topicIds: [
      '3.nbt.3',  // Addition with Regrouping
      '3.nbt.4',  // Subtraction with Regrouping
      '3.nbt.5',  // Multiplication Facts (0-10)
      '3.nbt.6',  // Division Facts
      '3.frac.1', // Fractions on a Number Line
      '3.frac.2', // Comparing Fractions
      '3.frac.3', // Equivalent Fractions with Models
    ],
    questionsPerTopic: 3,
  },
};

// Generic fallback for any other child: sample the first grading period's
// intro/developing topics for their grade.
function buildFallbackProbe(child: DiagnosticChildInput): DiagnosticProbe {
  const all = getTopicsForChild(child.grade, child.track, child.state, child.district);
  const firstPeriod = all
    .filter((t) => t.gradeLevel === child.grade && t.nineWeeks === 1)
    .sort((a, b) => a.order - b.order)
    .slice(0, 7);
  return {
    label: `Grade ${child.grade} Placement Probe`,
    description: `Samples the opening topics of grade ${child.grade} to establish a baseline.`,
    topicIds: firstPeriod.map((t) => t.id),
    questionsPerTopic: 3,
  };
}

export function getDiagnosticProbe(child: DiagnosticChildInput): ResolvedDiagnostic {
  const probe = NAMED_PROBES[child.name.trim().toLowerCase()] ?? buildFallbackProbe(child);

  const topics = probe.topicIds
    .map((id) => getTopicById(id))
    .filter((t): t is CurriculumTopic => Boolean(t));

  return {
    label: probe.label,
    description: probe.description,
    topics,
    questionsPerTopic: probe.questionsPerTopic,
    totalQuestions: topics.length * probe.questionsPerTopic,
  };
}
