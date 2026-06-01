// Verifies probe sizes, the email guard, and renders sample email HTML.
// Run: npx tsx scripts/daily-email-smoke-test.ts
import { writeFileSync } from 'fs';
import { getDiagnosticProbe } from '../src/lib/curriculum/diagnostics';
import { sendEmail } from '../src/lib/email';
import { buildDailyEmailHtml, ChildReport } from '../src/lib/daily-email-template';

(async () => {
  // 1. Probe sizes + resolution
  for (const kid of [
    { name: 'Eliana', grade: 7, track: 'accelerated' },
    { name: 'Mylo', grade: 4, track: 'standard' },
  ]) {
    const p = getDiagnosticProbe(kid);
    const allResolved = p.topics.length === p.totalQuestions / p.questionsPerTopic;
    console.log(
      `${kid.name}: ${p.topics.length} skills x ${p.questionsPerTopic} = ${p.totalQuestions} questions  ${allResolved ? 'OK' : 'FAIL (unresolved IDs)'}`
    );
    if (!allResolved) process.exit(1);
  }

  // 2. Email guard: no API key -> clean error, no throw
  const guard = await sendEmail({ subject: 'x', html: '<p>x</p>', to: 'a@b.com' });
  console.log('sendEmail without key ->', JSON.stringify(guard));
  if (guard.ok || !guard.error) {
    console.error('FAIL: sendEmail should error without RESEND_API_KEY');
    process.exit(1);
  }

  // 3. Render sample email HTML (adaptive recap + standard-day fallback)
  const reports: ChildReport[] = [
    { name: 'Eliana', ok: true, topicCount: 8, yesterdayScore: 72, missedCount: 2 },
    { name: 'Mylo', ok: true, topicCount: 6, yesterdayScore: null },
  ];
  const topicsByChild: Record<string, string[]> = {
    Eliana: ['Adding and Subtracting Rational Numbers', 'Slope and Rate of Change', 'Percent Increase and Decrease'],
    Mylo: ['Multiplication Facts (0-10)', 'Comparing Fractions', 'Addition with Regrouping'],
  };
  const html = buildDailyEmailHtml('Monday, June 1, 2026', reports, topicsByChild);
  const out = '/sessions/busy-compassionate-goodall/mnt/outputs/daily-email-sample.html';
  writeFileSync(out, html);
  console.log('Wrote sample email HTML ->', out);
  // sanity checks on content
  const checks: Array<[string, boolean]> = [
    ['recap shows score', html.includes("Yesterday's score: <strong>72%")],
    ['extra-practice note', html.includes('added extra practice on 2 missed topics')],
    ['standard-day fallback', html.includes('No graded worksheet from yesterday')],
    ['khan links', html.includes('khanacademy.org/search')],
  ];
  let ok = true;
  for (const [label, pass] of checks) {
    console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label}`);
    if (!pass) ok = false;
  }
  process.exit(ok ? 0 : 1);
})();
