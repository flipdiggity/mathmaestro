// ─────────────────────────────────────────────────────────────────────────────
// Study-plan pacing.
//
// A child can have a finish-by date (Child.planEndDate, falling back to
// targetTestDate) — e.g. "cover all of Math 8 Accelerated by the first day of
// school". Pacing turns (topics remaining, weekdays left) into generation
// parameters:
//
//   paceNeeded      topics/weekday required to finish on time
//   servesToAdvance how many worksheet appearances a topic needs before the
//                   frontier moves past it (ungraded exposure — grading can
//                   advance it sooner via mastery, or hold it back via a low score)
//   numCurrent      how many frontier topics each sheet teaches
//
// Advance rate ≈ numCurrent / servesToAdvance topics per sheet-day; parameters
// are chosen so that rate ≥ paceNeeded whenever feasible (≤3/day), and the plan
// status reports on-track / behind either way.
// ─────────────────────────────────────────────────────────────────────────────

import { CurriculumTopic } from './curriculum/types';
import { AdaptiveTopicState } from './adaptive';

/** Weekdays (Mon-Fri) strictly after `from` through `to`, inclusive of `to`. */
export function countWeekdays(from: Date, to: Date): number {
  let count = 0;
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  const end = new Date(to);
  end.setHours(12, 0, 0, 0);
  while (d < end) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

/**
 * Mirrors sequencing's advance rule: a topic counts as "covered" ONLY when
 * mastered (graded >= 80, or a parent skip-mark which sets mastery = 100).
 * Exposure alone never counts — so "topics covered" reflects what the child has
 * actually learned, and the deadline can't push the frontier past unlearned
 * material.
 */
export function topicAdvanced(
  state: AdaptiveTopicState | undefined,
  _servesToAdvance?: number,
  masteredThreshold = 80
): boolean {
  return !!state && state.mastery >= masteredThreshold;
}

export interface PaceParams {
  planEnd: Date | null;
  /** Practice days (Mon-Fri, when sheets generate) until the end date — the ENGINE's unit. */
  weekdaysLeft: number | null;
  /** Calendar days until the end date — the DISPLAY unit ("days left" that matches a wall calendar). */
  calendarDaysLeft: number | null;
  remaining: number;
  paceNeeded: number | null;     // topics per practice day, null when no plan
  /** paceNeeded expressed per week — friendlier for display, season-agnostic. */
  topicsPerWeek: number | null;
  servesToAdvance: number;
  numCurrent: number | null;     // null → caller uses its default sizing
  achievablePace: number;        // numCurrent / servesToAdvance (or default)
  onTrack: boolean | null;       // null when no plan
}

// Default when no plan is set: still advance after 4 exposures so the
// curriculum can never freeze in place (the failure mode that kept the kids on
// the same four topics for two weeks).
export const DEFAULT_SERVES_TO_ADVANCE = 4;

export function computePaceParams(
  remaining: number,
  planEnd: Date | null | undefined,
  now: Date = new Date()
): PaceParams {
  if (!planEnd || planEnd.getTime() <= now.getTime()) {
    return {
      planEnd: null,
      weekdaysLeft: null,
      calendarDaysLeft: null,
      remaining,
      paceNeeded: null,
      topicsPerWeek: null,
      servesToAdvance: DEFAULT_SERVES_TO_ADVANCE,
      numCurrent: null,
      achievablePace: 1,
      onTrack: null,
    };
  }
  const weekdaysLeft = Math.max(1, countWeekdays(now, planEnd));
  const calendarDaysLeft = Math.max(
    1,
    Math.ceil((planEnd.getTime() - now.getTime()) / 86_400_000)
  );
  const paceNeeded = remaining / weekdaysLeft;
  // The deadline is ADVISORY ONLY — it informs the "on pace / behind" badge and
  // the topics-per-week hint, but it must NEVER change how the engine picks
  // topics. (The old code widened the per-sheet window and lowered the
  // exposure-to-advance count when "behind", which raced kids through unlearned
  // material — and got worse the more days you skipped.) numCurrent stays null
  // so selection uses its fixed default window; onTrack just compares the
  // required pace to a sane learn-and-master rate (~1 topic/school day).
  const SUSTAINABLE_PACE = 1; // topics mastered per school day, comfortably
  return {
    planEnd,
    weekdaysLeft,
    calendarDaysLeft,
    remaining,
    paceNeeded,
    topicsPerWeek: Math.round(paceNeeded * 5 * 10) / 10,
    servesToAdvance: DEFAULT_SERVES_TO_ADVANCE,
    numCurrent: null,
    achievablePace: SUSTAINABLE_PACE,
    onTrack: paceNeeded <= SUSTAINABLE_PACE,
  };
}

export interface PlanStatus extends PaceParams {
  totalTopics: number;      // topics in the child's sequence at/after their floor
  advancedTopics: number;   // mastered / exposed-past
  projectedFinishWeekdays: number | null; // weekdays needed at achievable pace
  frontierTopicName: string | null;
}

/** Full plan status for dashboards/emails. `seq` must already be floor-sliced. */
export function computePlanStatus(
  seq: CurriculumTopic[],
  states: Map<string, AdaptiveTopicState>,
  planEnd: Date | null | undefined,
  now: Date = new Date()
): PlanStatus {
  // "Covered" = mastered (graded >= 80 or parent-skipped). Remaining is what's
  // left to learn — independent of the deadline.
  const remaining = seq.filter((t) => !topicAdvanced(states.get(t.id))).length;
  const params = computePaceParams(remaining, planEnd, now);
  const frontier = seq.find((t) => !topicAdvanced(states.get(t.id)));
  return {
    ...params,
    totalTopics: seq.length,
    advancedTopics: seq.length - remaining,
    projectedFinishWeekdays:
      remaining > 0 ? Math.ceil(remaining / params.achievablePace) : 0,
    frontierTopicName: frontier?.name ?? null,
  };
}
