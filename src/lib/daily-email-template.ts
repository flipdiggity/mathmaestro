// HTML builder for the daily worksheet email. Pure/presentational so it can be
// unit-rendered without touching the DB or network.

export interface ChildReport {
  name: string;
  ok: boolean;
  worksheetId?: string;
  topicCount?: number;
  yesterdayScore?: number | null;
  missedCount?: number;
  error?: string;
  /** Study-plan status line, e.g. "31 topics left · 27 school days · on pace". */
  planLine?: string | null;
  planOnTrack?: boolean | null;
  /** URL of the sheet's watch-first video page. */
  watchUrl?: string;
  /** How many sheets are still waiting to be photo-graded. */
  ungradedCount?: number;
}

export function khanLink(topicName: string): string {
  return `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(topicName)}`;
}

export function buildDailyEmailHtml(
  date: string,
  reports: ChildReport[],
  topicsByChild: Record<string, string[]>
): string {
  const sections = reports
    .map((r) => {
      if (!r.ok) {
        return `<h2 style="margin:18px 0 6px">${r.name}</h2>
          <p style="color:#b91c1c">Could not generate today's worksheet: ${r.error ?? 'unknown error'}.</p>`;
      }
      const recap =
        r.yesterdayScore != null
          ? `<p style="margin:4px 0;color:#374151">Last graded score: <strong>${Math.round(
              r.yesterdayScore
            )}%</strong>${r.missedCount ? ` — extra practice added on ${r.missedCount} missed topic${r.missedCount === 1 ? '' : 's'}.` : '.'}</p>`
          : `<p style="margin:4px 0;color:#6b7280">No graded worksheet yet — difficulty is escalating on schedule; photo-grade a sheet to fine-tune it.</p>`;
      const planBadge = r.planLine
        ? `<p style="margin:4px 0"><span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:12px;background:${
            r.planOnTrack === false ? '#fef2f2;color:#b91c1c' : '#f0fdf4;color:#15803d'
          }">${r.planLine}</span></p>`
        : '';
      const watchLine = r.watchUrl
        ? `<p style="margin:6px 0;color:#374151">🎬 <a href="${r.watchUrl}" style="color:#4f46e5">Watch-first videos for today's sheet</a> (also on the printed QR code).</p>`
        : '';
      const gradeNudge =
        r.ungradedCount && r.ungradedCount >= 3
          ? `<p style="margin:6px 0;color:#92400e;background:#fffbeb;padding:6px 10px;border-radius:8px;font-size:13px">📸 ${r.ungradedCount} completed sheets haven't been photo-graded — grading even one tunes difficulty and catches gaps.</p>`
          : '';
      const topics = topicsByChild[r.name] ?? [];
      const topicList = topics
        .map(
          (t) =>
            `<li style="margin:2px 0"><a href="${khanLink(t)}" style="color:#4f46e5;text-decoration:none">${t}</a></li>`
        )
        .join('');
      return `<h2 style="margin:18px 0 6px">${r.name}</h2>
        ${planBadge}
        ${recap}
        ${watchLine}
        ${gradeNudge}
        <p style="margin:8px 0 4px;color:#374151">Today's topics:</p>
        <ul style="margin:4px 0 0;padding-left:18px;color:#374151">${topicList}</ul>`;
    })
    .join('');

  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto">
    <h1 style="font-size:20px;margin:0 0 4px">Math Maestro — ${date}</h1>
    <p style="color:#6b7280;margin:0 0 8px">Today's worksheets are attached. Have them scan the QR code and watch first, work in pencil, then photograph and grade to shape tomorrow's set.</p>
    ${sections}
    <p style="color:#9ca3af;font-size:12px;margin-top:24px">Generated automatically by Math Maestro.</p>
  </div>`;
}
