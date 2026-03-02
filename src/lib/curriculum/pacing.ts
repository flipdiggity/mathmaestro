/**
 * Eanes ISD 2025–2026 nine-weeks pacing calendar.
 * Dates sourced from the district academic calendar.
 */

type NineWeeks = 1 | 2 | 3 | 4;

interface DateRange {
  start: Date;
  end: Date;
}

const NINE_WEEKS_RANGES: Record<NineWeeks, DateRange> = {
  1: { start: new Date('2025-08-18'), end: new Date('2025-10-17') },
  2: { start: new Date('2025-10-20'), end: new Date('2025-12-19') },
  3: { start: new Date('2026-01-06'), end: new Date('2026-03-13') },
  4: { start: new Date('2026-03-16'), end: new Date('2026-05-28') },
};

/**
 * Determine which nine-weeks grading period a given date falls in.
 * Dates outside the school year default to the nearest period.
 */
export function getCurrentNineWeeks(date?: Date): NineWeeks {
  const d = date ?? new Date();

  // Before school year starts → 1st nine weeks
  if (d < NINE_WEEKS_RANGES[1].start) return 1;

  // After school year ends → 4th nine weeks
  if (d > NINE_WEEKS_RANGES[4].end) return 4;

  // Check each period (including gaps like winter break)
  for (const period of [1, 2, 3, 4] as NineWeeks[]) {
    if (d <= NINE_WEEKS_RANGES[period].end) return period;
  }

  return 4;
}

/**
 * Get the start and end dates for a nine-weeks period.
 */
export function getNineWeeksDateRange(nineWeeks: NineWeeks): DateRange {
  return NINE_WEEKS_RANGES[nineWeeks];
}

/**
 * Get progress (0.0 to 1.0) within the current nine-weeks period.
 */
export function getNineWeeksProgress(date?: Date): number {
  const d = date ?? new Date();
  const period = getCurrentNineWeeks(d);
  const { start, end } = NINE_WEEKS_RANGES[period];

  const total = end.getTime() - start.getTime();
  const elapsed = d.getTime() - start.getTime();

  return Math.max(0, Math.min(1, elapsed / total));
}

/**
 * Get a human-readable label for the nine-weeks period.
 */
export function getNineWeeksLabel(nineWeeks: NineWeeks): string {
  const labels: Record<NineWeeks, string> = {
    1: '1st Nine Weeks',
    2: '2nd Nine Weeks',
    3: '3rd Nine Weeks',
    4: '4th Nine Weeks',
  };
  return labels[nineWeeks];
}
