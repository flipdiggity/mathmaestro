// ─────────────────────────────────────────────────────────────────────────────
// Course presets — named, district-real course sequences.
//
// Eanes ISD math isn't just "grade N": kids place into compacted/accelerated
// sequences (e.g. a 6th grader taking Math 8 Accelerated = 2nd half of Math 7
// + all of Math 8). A course preset pins down:
//   • which topic pool the child works in (via engineGrade + track),
//   • where the sequence STARTS (floor),
//   • the child's real school grade for display.
//
// Child.courseId selects a preset; children without one fall back to the
// legacy (grade, track) resolution + name-keyed start floors.
// ─────────────────────────────────────────────────────────────────────────────

import { CurriculumTopic } from './types';
import { getTopicsForChild } from './index';
import { StartFloor, getStartFloor, orderedSequence, floorIndexFor } from './sequencing';

export interface CoursePreset {
  id: string;
  label: string;
  description: string;
  /** Grade whose curriculum pool drives the engine (may differ from school grade). */
  engineGrade: number;
  track: 'standard' | 'accelerated' | 'test-prep';
  /** Where in the ordered sequence teaching starts (earlier topics = review only). */
  floor?: StartFloor;
  /** The school grade a child taking this course is typically in. */
  defaultDisplayGrade?: number;
}

export const COURSES: CoursePreset[] = [
  // Standard grade-level courses
  ...[3, 4, 5, 6, 7, 8].map((g) => ({
    id: `eanes-g${g}`,
    label: `Grade ${g} Math`,
    description: `Full Eanes ISD grade ${g} TEKS sequence in teaching order.`,
    engineGrade: g,
    track: 'standard' as const,
    defaultDisplayGrade: g,
  })),
  {
    id: 'eanes-m8-accel-g6',
    label: 'Math 8 Accelerated (6th grade)',
    description:
      'The Eanes compacted sequence for 6th graders who placed into Math 8 Accelerated: second half of Math 7 (proportionality onward), then all of Math 8. Finishes 8th-grade math two years early.',
    engineGrade: 7,          // pool = grade 7 + grade 8 via accelerated mapping
    track: 'accelerated',
    floor: { grade: 7, fromOrder: 17 },
    defaultDisplayGrade: 6,
  },
  {
    id: 'eanes-adv5-compact56',
    label: 'Advanced Math 5 (compacted 5/6)',
    description:
      'Eanes advanced sequence for 5th graders who qualified via the end-of-4th acceleration assessment: all of grade 5 plus grade 6 in one year.',
    engineGrade: 5,
    track: 'accelerated',
    defaultDisplayGrade: 5,
  },
  {
    id: 'eanes-g4-accel-ready',
    label: 'Grade 4 + Acceleration Test Readiness',
    description:
      'All of grade 4 at increasing depth (through Challenge-level problems), then grade 5 preview — building toward the end-of-4th-grade assessment that places students into Advanced Math 5 (compacted 5/6).',
    engineGrade: 4,
    track: 'accelerated',    // pool = grade 4 + grade 5 (preview material)
    defaultDisplayGrade: 4,
  },
  {
    id: 'eanes-m8-placement-prep',
    label: 'Math 8 Accelerated Placement Prep',
    description:
      'Focused prep for the Math 8 Accelerated placement exam (Math 7 scope, first two nine-weeks emphasized).',
    engineGrade: 6,
    track: 'test-prep',
    defaultDisplayGrade: 5,
  },
];

export function getCourse(courseId: string | null | undefined): CoursePreset | undefined {
  if (!courseId) return undefined;
  return COURSES.find((c) => c.id === courseId);
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
  const grade = course?.engineGrade ?? child.grade;
  const track = course?.track ?? child.track;
  const topics = getTopicsForChild(grade, track, child.state, child.district);
  const seq = orderedSequence(topics);
  const floor = course?.floor ?? getStartFloor(child.name, grade);
  return { topics, seq, floorIndex: floorIndexFor(seq, floor), course };
}
