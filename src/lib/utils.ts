import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Canonical download filename for worksheet PDFs:
 *   eliana_worksheets_july_6_2026.pdf
 * ({name}_worksheet[s]_[weekday_]{month}_{day}_{year}.pdf — lowercase,
 * underscores). Dates format in Central Time so a late-evening download
 * doesn't roll over to UTC-tomorrow.
 */
export function worksheetFilename(
  childName: string,
  opts: { plural?: boolean; date?: Date; weekday?: string } = {}
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).formatToParts(opts.date ?? new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ""
  const name = childName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_") || "math"
  const word = opts.plural ? "worksheets" : "worksheet"
  const weekday = opts.weekday ? `${opts.weekday.toLowerCase()}_` : ""
  return `${name}_${word}_${weekday}${get("month").toLowerCase()}_${get("day")}_${get("year")}.pdf`
}
