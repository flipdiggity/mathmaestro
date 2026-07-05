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

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

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

/** Mirrors sequencing's advance rule: mastered, or exposed enough without evidence of weakness. */
export function topicAdvanced(
  state: AdaptiveTopicState | undefined,
  servesToAdvance: number,
  masteredThreshold = 80
): boolean {
  if (!state) return false;
  if (state.mastery >= masteredThreshold) return true;
  if (
    state.timesServed >= servesToAdvance &&
    (state.timesPracticed === 0 || state.mastery >= 60)
  ) {
    return true;
  }
  return false;
}

export interface PaceParams {
  planEnd: Date | null;
  weekdaysLeft: number | null;
  remaining: number;
  paceNeeded: number | null;     // topics per weekday, null when no plan
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
      remaining,
      paceNeeded: null,
      servesToAdvance: DEFAULT_SERVES_TO_ADVANCE,
      numCurrent: null,
      achievablePace: 1,
      onTrack: null,
    };
  }
  const weekdaysLeft = Math.max(1, countWeekdays(now, planEnd));
  const paceNeeded = remaining / weekdaysLeft;
  // Slower plans get 3 exposures per topic; faster plans trade repetition for
  // coverage (2 exposures) and widen the per-sheet topic window.
  const servesToAdvance = paceNeeded < 1 ? 3 : 2;
  const numCurrent = clamp(Math.ceil(paceNeeded * servesToAdvance), 3, 6);
  const achievablePace = numCurrent / servesToAdvance;
  return {
    planEnd,
    weekdaysLeft,
    remaining,
    paceNeeded,
    servesToAdvance,
    numCurrent,
    achievablePace,
    onTrack: achievablePace >= paceNeeded,
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
  // Two-pass: remaining depends on servesToAdvance, which depends on pace,
  // which depends on remaining. Resolve with the default first, then refine.
  const remainingWith = (s: number) =>
    seq.filter((t) => !topicAdvanced(states.get(t.id), s)).length;
  let params = computePaceParams(remainingWith(DEFAULT_SERVES_TO_ADVANCE), planEnd, now);
  params = computePaceParams(remainingWith(params.servesToAdvance), planEnd, now);

  const frontier = seq.find((t) => !topicAdvanced(states.get(t.id), params.servesToAdvance));
  return {
    ...params,
    totalTopics: seq.length,
    advancedTopics: seq.length - params.remaining,
    projectedFinishWeekdays:
      params.remaining > 0 ? Math.ceil(params.remaining / params.achievablePace) : 0,
    frontierTopicName: frontier?.name ?? null,
  };
}
