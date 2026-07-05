import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { verifyChildOwnership } from '@/lib/ownership';
import {
  resolveCurriculumForChild,
  getCourse,
  getCoursesForGrade,
  engineFieldsForCourse,
  COURSES,
} from '@/lib/curriculum/courses';
import { loadAdaptiveStates } from '@/lib/adaptive';
import { computePlanStatus } from '@/lib/plan';

// GET: the child's study-plan status — topics remaining, weekdays left,
// required pace vs achievable pace, projected finish, current frontier.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const child = await verifyChildOwnership(params.id, user.id);
    if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 });

    const { topics, seq, floorIndex, course } = resolveCurriculumForChild(child);
    const states = await loadAdaptiveStates(child.id, new Set(topics.map((t) => t.id)));
    const planEnd = child.planEndDate ?? child.targetTestDate ?? null;
    const status = computePlanStatus(seq.slice(floorIndex), states, planEnd);

    return NextResponse.json({
      plan: {
        planEnd: status.planEnd?.toISOString() ?? null,
        weekdaysLeft: status.weekdaysLeft,
        calendarDaysLeft: status.calendarDaysLeft,
        totalTopics: status.totalTopics,
        advancedTopics: status.advancedTopics,
        remaining: status.remaining,
        paceNeeded: status.paceNeeded,
        topicsPerWeek: status.topicsPerWeek,
        achievablePace: status.achievablePace,
        onTrack: status.onTrack,
        projectedFinishWeekdays: status.projectedFinishWeekdays,
        frontierTopicName: status.frontierTopicName,
      },
      course: course ? { id: course.id, label: course.label, description: course.description } : null,
      displayGrade: child.displayGrade,
      courses: COURSES.map((c) => ({ id: c.id, label: c.label, description: c.description })),
      // Courses appropriate for the child's SCHOOL grade (drives pickers).
      coursesForGrade: getCoursesForGrade(child.displayGrade ?? child.grade).map((c) => ({
        id: c.id,
        label: c.label,
        description: c.description,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Plan status error:', error);
    return NextResponse.json({ error: 'Failed to load plan' }, { status: 500 });
  }
}

// PATCH: update the plan — finish-by date and/or course preset.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const child = await verifyChildOwnership(params.id, user.id);
    if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 });

    const body = (await request.json()) as {
      planEndDate?: string | null;
      courseId?: string | null;
    };

    const data: { planEndDate?: Date | null; courseId?: string | null; grade?: number; track?: string } = {};
    if (body.planEndDate !== undefined) {
      data.planEndDate = body.planEndDate ? new Date(body.planEndDate) : null;
    }
    if (body.courseId !== undefined) {
      if (body.courseId) {
        const course = getCourse(body.courseId);
        if (!course) return NextResponse.json({ error: 'Unknown course' }, { status: 400 });
        data.courseId = course.id;
        // Keep the legacy engine fields consistent with the course so every
        // (grade, track) code path agrees with the course resolution. The
        // child's SCHOOL grade (displayGrade) is independent and untouched.
        const engine = engineFieldsForCourse(course);
        data.grade = engine.grade;
        data.track = engine.track;
      } else {
        data.courseId = null;
      }
    }

    const updated = await prisma.child.update({ where: { id: params.id }, data });
    return NextResponse.json({
      ok: true,
      child: {
        id: updated.id,
        courseId: updated.courseId,
        planEndDate: updated.planEndDate?.toISOString() ?? null,
        grade: updated.grade,
        track: updated.track,
        displayGrade: updated.displayGrade,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Plan update error:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}
