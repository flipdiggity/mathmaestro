/**
 * Eanes ISD nine-weeks pacing calendar, by school year.
 * 2025–26 dates from the district academic calendar; 2026–27 dates are the
 * board-approved pattern (first day mid-August, similar period boundaries) —
 * refine when the district publishes the final calendar.
 */

type NineWeeks = 1 | 2 | 3 | 4;

interface DateRange {
  start: Date;
  end: Date;
}

type YearCalendar = Record<NineWeeks, DateRange>;

const SCHOOL_YEARS: YearCalendar[] = [
  {
    1: { start: new Date('2025-08-18'), end: new Date('2025-10-17') },
    2: { start: new Date('2025-10-20'), end: new Date('2025-12-19') },
    3: { start: new Date('2026-01-06'), end: new Date('2026-03-13') },
    4: { start: new Date('2026-03-16'), end: new Date('2026-05-28') },
  },
  {
    1: { start: new Date('2026-08-12'), end: new Date('2026-10-09') },
    2: { start: new Date('2026-10-13'), end: new Date('2026-12-18') },
    3: { start: new Date('2027-01-05'), end: new Date('2027-03-12') },
    4: { start: new Date('2027-03-22'), end: new Date('2027-05-27') },
  },
];

/** First day of the next school year at/after the given date (null if past all known calendars). */
export function nextSchoolYearStart(date?: Date): Date | null {
  const d = date ?? new Date();
  for (const year of SCHOOL_YEARS) {
    if (d < year[1].start) return year[1].start;
  }
  return null;
}

/** The school-year calendar containing (or nearest to) the given date. */
function calendarFor(d: Date): YearCalendar {
  for (const year of SCHOOL_YEARS) {
    if (d <= year[4].end) return year;
  }
  return SCHOOL_YEARS[SCHOOL_YEARS.length - 1];
}

/** True between the end of one school year and the start of the next. */
export function isSummerBreak(date?: Date): boolean {
  const d = date ?? new Date();
  for (let i = 0; i < SCHOOL_YEARS.length; i++) {
    const year = SCHOOL_YEARS[i];
    if (d < year[1].start) return true; // before this year starts (after previous ended)
    if (d <= year[4].end) return false; // inside this school year
  }
  return true; // past every known calendar
}

/**
 * Determine which nine-weeks grading period a given date falls in.
 * Dates outside the school year default to the nearest period.
 */
export function getCurrentNineWeeks(date?: Date): NineWeeks {
  const d = date ?? new Date();
  const NINE_WEEKS_RANGES = calendarFor(d);

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
 * Get the start and end dates for a nine-weeks period (in the school year
 * containing/nearest the reference date).
 */
export function getNineWeeksDateRange(nineWeeks: NineWeeks, date?: Date): DateRange {
  return calendarFor(date ?? new Date())[nineWeeks];
}

/**
 * Get progress (0.0 to 1.0) within the current nine-weeks period.
 */
export function getNineWeeksProgress(date?: Date): number {
  const d = date ?? new Date();
  const period = getCurrentNineWeeks(d);
  const { start, end } = calendarFor(d)[period];

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
