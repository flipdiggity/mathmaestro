import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { renderWorksheetPDF } from '@/lib/pdf/render';
import {
  generateAdaptiveWorksheet,
  getRecentlyMissedTopicIds,
  GenerationChild,
} from '@/lib/worksheet-generation';
import { sendEmail, EmailAttachment } from '@/lib/email';
import { buildDailyEmailHtml, ChildReport } from '@/lib/daily-email-template';
import { isSaas } from '@/lib/mode';

// Allow up to 5 min — generating + rendering two worksheets calls the LLM twice.
export const maxDuration = 300;

// The ACTIVE children live under the personal-mode local user. Stale SaaS-era
// duplicates (same names, months of old worksheets, NO current mastery/skips)
// also exist in the DB — for weeks the old name-based "most worksheets wins"
// dedupe selected THOSE, so every emailed sheet ignored the kids' real skip and
// mastery state while the website (scoped to the local user) looked fine.
const PERSONAL_USER_ID = 'local-felipe';

async function runDailyEmail(): Promise<{ status: number; body: Record<string, unknown> }> {
  const allChildren = await prisma.child.findMany({
    // personal mode: ONLY the local user's children. saas mode: everyone's.
    where: isSaas ? undefined : { userId: PERSONAL_USER_ID },
    orderBy: { grade: 'desc' },
    include: { _count: { select: { worksheets: true } }, user: true },
  });

  // Defensive dedupe WITHIN each user: if a kid was added twice, keep the row
  // with the most RECENT activity (updatedAt of newest worksheet not available
  // cheaply, so prefer current-curriculum signal: most worksheets, ties to the
  // newer row). Never dedupe across different users' children.
  const byKey = new Map<string, (typeof allChildren)[number]>();
  for (const c of allChildren) {
    // Skip children with the daily email turned off.
    if ((c as { emailEnabled?: boolean }).emailEnabled === false) continue;
    const key = `${c.userId}::${c.name.trim().toLowerCase()}`;
    const existing = byKey.get(key);
    if (
      !existing ||
      c._count.worksheets > existing._count.worksheets ||
      (c._count.worksheets === existing._count.worksheets && c.createdAt > existing.createdAt)
    ) {
      byKey.set(key, c);
    }
  }
  const children = Array.from(byKey.values());
  console.log(
    'daily-email children:',
    children.map((c) => `${c.name}=${c.id} (user ${c.userId})`).join(', ')
  );

  if (children.length === 0) {
    return { status: 200, body: { ok: true, message: 'No children to generate for' } };
  }

  // Group children by owning user. Each family gets ONE email with only their
  // own kids' worksheets — in personal mode there's a single local user and
  // the recipient falls back to DAILY_EMAIL_TO, exactly as before.
  const byUser = new Map<string, { email: string | null; children: typeof children }>();
  for (const c of children) {
    const entry = byUser.get(c.userId) ?? { email: c.user?.email ?? null, children: [] };
    entry.children.push(c);
    byUser.set(c.userId, entry);
  }

  const today = new Date();
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const allReports: ChildReport[] = [];
  const sendResults: Array<{ user: string; ok: boolean; error?: string }> = [];

  for (const group of Array.from(byUser.values())) {
  const topicsByChild: Record<string, string[]> = {};

  // Generate all of a family's sheets in PARALLEL — Sonnet 5 thinks before it
  // writes, so sequential generation for 2+ kids would flirt with maxDuration.
  const perChild = await Promise.all(
    group.children.map(async (child): Promise<{ report: ChildReport; attachment?: EmailAttachment; topics?: string[] }> => {
    try {
      // Yesterday's recap: most recent graded worksheet (score + missed topics).
      const lastGraded = await prisma.worksheet.findFirst({
        where: { childId: child.id, gradingResult: { isNot: null } },
        include: { gradingResult: true },
        orderBy: { createdAt: 'desc' },
      });
      const missedTopicIds = await getRecentlyMissedTopicIds(child.id);
      const ungradedCount = await prisma.worksheet.count({
        where: { childId: child.id, status: 'generated' },
      });

      const gen: GenerationChild = {
        id: child.id,
        name: child.name,
        grade: child.grade,
        track: child.track,
        state: child.state,
        district: child.district,
        targetTestDate: child.targetTestDate,
        courseId: child.courseId,
        displayGrade: child.displayGrade,
        planEndDate: child.planEndDate,
      };

      const result = await generateAdaptiveWorksheet(gen, {
        questionCount: 25,
        biasTopicIds: missedTopicIds,
        dayOfWeek,
      });

      const pdf = await renderWorksheetPDF(
        result.title,
        child.name,
        result.questions,
        dateStr,
        result.topicReviews,
        result.watch
      );

      const datePart = today.toISOString().slice(0, 10);
      const attachment: EmailAttachment = {
        filename: `${child.name.replace(/[^a-zA-Z0-9]/g, '_')}_${datePart}_${dayOfWeek}.pdf`,
        content: Buffer.from(pdf).toString('base64'),
      };

      const plan = result.plan;
      const planLine =
        plan && plan.planEnd && plan.paceNeeded != null
          ? `Plan: ${plan.remaining} topics · ${plan.calendarDaysLeft} days left · ${
              plan.onTrack === false ? 'BEHIND pace' : 'on pace'
            } for ${plan.planEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          : null;

      return {
        report: {
          name: child.name,
          ok: true,
          worksheetId: result.worksheetId,
          topicCount: result.topicIds.length,
          yesterdayScore: lastGraded?.gradingResult?.scorePercent ?? null,
          missedCount: missedTopicIds.length,
          planLine,
          planOnTrack: plan?.onTrack ?? null,
          watchUrl: result.watch.url,
          ungradedCount,
        },
        attachment,
        topics: Array.from(new Set(result.questions.map((q) => q.topicName))),
      };
    } catch (e) {
      // Surface the failure in the function logs — these errors were
      // previously swallowed into the email body only.
      console.error(`daily-email: generation failed for ${child.name}:`, e);
      return {
        report: {
          name: child.name,
          ok: false,
          error: e instanceof Error ? e.message : 'generation failed',
        },
      };
    }
    })
  );

  const reports: ChildReport[] = perChild.map((r) => r.report);
  const attachments: EmailAttachment[] = perChild.flatMap((r) => (r.attachment ? [r.attachment] : []));
  for (const r of perChild) {
    if (r.topics) topicsByChild[r.report.name] = r.topics;
  }

  const html = buildDailyEmailHtml(dateStr, reports, topicsByChild);
  // In saas mode each family's email goes to the account owner. A 'felipe@local'
  // personal-mode address isn't routable; fall back to DAILY_EMAIL_TO (default
  // recipient inside sendEmail) for the local user.
  const recipient =
    isSaas && group.email && !group.email.endsWith('@local') ? group.email : undefined;
  const send = await sendEmail({
    to: recipient,
    subject: `Math Maestro — ${dateStr}`,
    html,
    attachments,
  });
  allReports.push(...reports);
  sendResults.push({
    user: group.email ?? 'unknown',
    ok: send.ok,
    error: send.error,
  });
  }

  const allOk = sendResults.every((r) => r.ok);
  // Log the outcome so the Vercel function log shows what happened without
  // needing to open the email.
  console.log('daily-email result:', JSON.stringify({ ok: allOk, sends: sendResults, reports: allReports }));
  return {
    status: allOk ? 200 : 502,
    body: { ok: allOk, sends: sendResults, reports: allReports },
  };
}

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // No secret configured (e.g. local dev) — allow.
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  // Allow ?secret=... as a manual-trigger fallback.
  return request.nextUrl.searchParams.get('secret') === secret;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    // ?dryRun=1 → report what WOULD happen (children, env readiness) without
    // generating worksheets or sending email. Safe to hit for diagnostics.
    if (request.nextUrl.searchParams.get('dryRun')) {
      const allChildren = await prisma.child.findMany({
        where: isSaas ? undefined : { userId: PERSONAL_USER_ID },
        select: { id: true, name: true, grade: true, emailEnabled: true, userId: true },
        orderBy: { grade: 'desc' },
      });
      return NextResponse.json({
        dryRun: true,
        wouldGenerateFor: allChildren.filter((c) => c.emailEnabled !== false),
        skipped: allChildren.filter((c) => c.emailEnabled === false),
        env: {
          resendKey: Boolean(process.env.RESEND_API_KEY),
          dailyEmailTo: Boolean(process.env.DAILY_EMAIL_TO),
          cronSecret: Boolean(process.env.CRON_SECRET),
          anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
        },
        serverTimeUtc: new Date().toISOString(),
      });
    }
    const { status, body } = await runDailyEmail();
    return NextResponse.json(body, { status });
  } catch (error) {
    console.error('Daily email cron error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Daily email failed' },
      { status: 500 }
    );
  }
}

// Manual trigger.
export const POST = GET;
