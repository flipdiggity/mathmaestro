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
          ? `<p style="margin:4px 0;color:#374151">Yesterday's score: <strong>${Math.round(
              r.yesterdayScore
            )}%</strong>${r.missedCount ? ` — added extra practice on ${r.missedCount} missed topic${r.missedCount === 1 ? '' : 's'}.` : '.'}</p>`
          : `<p style="margin:4px 0;color:#6b7280">No graded worksheet from yesterday — sending the standard set.</p>`;
      const topics = topicsByChild[r.name] ?? [];
      const topicList = topics
        .map(
          (t) =>
            `<li style="margin:2px 0"><a href="${khanLink(t)}" style="color:#4f46e5;text-decoration:none">${t}</a></li>`
        )
        .join('');
      return `<h2 style="margin:18px 0 6px">${r.name}</h2>
        ${recap}
        <p style="margin:8px 0 4px;color:#374151">Today's topics (tap for a refresher video):</p>
        <ul style="margin:4px 0 0;padding-left:18px;color:#374151">${topicList}</ul>`;
    })
    .join('');

  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto">
    <h1 style="font-size:20px;margin:0 0 4px">Math Maestro — ${date}</h1>
    <p style="color:#6b7280;margin:0 0 8px">Today's worksheets are attached as PDFs. Print, have them work in pencil, then photograph and grade to shape tomorrow's set.</p>
    ${sections}
    <p style="color:#9ca3af;font-size:12px;margin-top:24px">Generated automatically by Math Maestro.</p>
  </div>`;
}
