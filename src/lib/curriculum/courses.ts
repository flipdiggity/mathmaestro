// ─────────────────────────────────────────────────────────────────────────────
// Course presets — the official Eanes ISD math pathway courses.
//
// Per the district's published pathways (eanesisd.net → Academics → Advanced &
// Accelerated; 5th-12th Math Pathways Family Handbook):
//   Standard:    Math 3 → Math 4 → Math 5 → Math 6 → Math 7 → Math 8
//   Elementary:  Math 5/6 Compacted (5th grade; all 5th+6th TEKS; qualify via
//                Student Data Matrix in spring of 4th grade)
//   Middle:      Math 6 Accelerated (6th) → Math 8 Accelerated → Algebra 1
//                Honors by 8th; Math 7/8 Compacted as the 7th-grade entry point.
//                Math 8 Accelerated can also be entered by placement exam (80%),
//                which is how a 6th grader can take it directly.
//
// A child's SCHOOL GRADE (displayGrade) and their MATH COURSE are independent
// choices: the same course (e.g. Math 8 Accelerated) is taken by 6th or 7th
// graders. `offeredInGrades` says who can pick it; `grades` defines the
// curriculum pool the engine walks, with an optional start floor.
// ─────────────────────────────────────────────────────────────────────────────

import { CurriculumTopic } from './types';
import { getCurriculum, getTopicsForChild } from './index';
import { StartFloor, getStartFloor, orderedSequence, floorIndexFor } from './sequencing';

export interface CoursePreset {
  id: string;
  label: string;
  description: string;
  /** Curriculum grades pooled for this course, in teaching order. */
  grades: number[];
  /** Where in the ordered sequence teaching starts (earlier topics = review only). */
  floor?: StartFloor;
  /** School grades that can take this course (drives the picker). */
  offeredInGrades: number[];
}

export const COURSES: CoursePreset[] = [
  // ── Standard grade-level courses ──
  ...[3, 4, 5, 6, 7, 8].map((g) => ({
    id: `eanes-g${g}`,
    label: `Math ${g}`,
    description: `On-level Eanes ISD Math ${g} — the full grade ${g} TEKS sequence in teaching order.`,
    grades: [g],
    offeredInGrades: [g],
  })),
  // ── Elementary acceleration ──
  {
    id: 'eanes-g4-accel-ready',
    label: 'Math 4 + Compacted-Math Prep',
    description:
      'All of Math 4 at increasing depth, then Math 5 preview — building toward the Student Data Matrix qualification (spring of 4th grade) for Math 5/6 Compacted.',
    grades: [4, 5],
    offeredInGrades: [4],
  },
  {
    id: 'eanes-adv5-compact56',
    label: 'Math 5/6 Compacted',
    description:
      'The Eanes 5th-grade acceleration course: all of the 5th AND 6th grade math TEKS in one school year. Entry via the Student Data Matrix.',
    grades: [5, 6],
    offeredInGrades: [5],
  },
  // ── Middle school pathway ──
  {
    id: 'eanes-m6-accel',
    label: 'Math 6 Accelerated',
    description:
      'The Eanes 6th-grade acceleration course: more than a year of standards (Math 6 plus the start of Math 7), preparing for Math 8 Accelerated next year.',
    grades: [6, 7],
    offeredInGrades: [6],
  },
  {
    id: 'eanes-m8-accel-g6',
    label: 'Math 8 Accelerated',
    description:
      'The Eanes accelerated course covering the second half of Math 7 (proportionality onward) plus all of Math 8 — leading to Algebra 1 Honors next year. Entered from Math 6 Accelerated, or directly via the 80% placement exam.',
    grades: [7, 8],
    floor: { grade: 7, fromOrder: 17 },
    offeredInGrades: [6, 7],
  },
  {
    id: 'eanes-m78-compacted',
    label: 'Math 7/8 Compacted',
    description:
      'The Eanes 7th-grade acceleration entry point: all of Math 7 and Math 8 in one year, leading to Algebra 1 Honors in 8th grade.',
    grades: [7, 8],
    offeredInGrades: [7],
  },
];

export function getCourse(courseId: string | null | undefined): CoursePreset | undefined {
  if (!courseId) return undefined;
  return COURSES.find((c) => c.id === courseId);
}

/** Courses a child in a given school grade can take (standard first). */
export function getCoursesForGrade(schoolGrade: number): CoursePreset[] {
  return COURSES.filter((c) => c.offeredInGrades.includes(schoolGrade));
}

/**
 * Legacy engine fields kept consistent with a course, so every code path that
 * still reads (grade, track) — diagnostics, old routes — agrees with it.
 */
export function engineFieldsForCourse(course: CoursePreset): { grade: number; track: string } {
  return {
    grade: course.grades[0],
    track: course.grades.length > 1 ? 'accelerated' : 'standard',
  };
}

export interface ChildCurriculumRef {
  id: string;
  name: string;
  grade: number;
  track: string;
  state: string;
  district: string;
  courseId?: string | null;
}

export interface ResolvedCurriculum {
  topics: CurriculumTopic[];   // unordered pool
  seq: CurriculumTopic[];      // ordered teaching sequence
  floorIndex: number;          // where teaching starts within seq
  course?: CoursePreset;
}

/**
 * Single source of truth for "which topics does this child work through, and
 * where do they start". Course preset when set; legacy (grade, track) + name
 * floor otherwise.
 */
export function resolveCurriculumForChild(child: ChildCurriculumRef): ResolvedCurriculum {
  const course = getCourse(child.courseId);
  if (course) {
    const topics = course.grades.flatMap(
      (g) => getCurriculum(g, child.state, child.district)?.topics ?? []
    );
    const seq = orderedSequence(topics);
    const floorIndex = course.floor ? floorIndexFor(seq, course.floor) : 0;
    return { topics, seq, floorIndex, course };
  }
  const topics = getTopicsForChild(child.grade, child.track, child.state, child.district);
  const seq = orderedSequence(topics);
  const floor = getStartFloor(child.name, child.grade);
  return { topics, seq, floorIndex: floorIndexFor(seq, floor) };
}
