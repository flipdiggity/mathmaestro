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

async function runDailyEmail(): Promise<{ status: number; body: Record<string, unknown> }> {
  const allChildren = await prisma.child.findMany({
    orderBy: { grade: 'desc' },
    include: { _count: { select: { worksheets: true } }, user: true },
  });

  // Defensive dedupe: if duplicate child rows exist for the same name (e.g. a
  // kid was added twice), keep only the one with the most worksheet history so
  // we don't email two sets per kid.
  const byName = new Map<string, (typeof allChildren)[number]>();
  for (const c of allChildren) {
    // Skip children with the daily email turned off. (Cast tolerates a stale
    // local Prisma client; the field exists after `prisma generate` on deploy.)
    if ((c as { emailEnabled?: boolean }).emailEnabled === false) continue;
    const key = c.name.trim().toLowerCase();
    const existing = byName.get(key);
    if (!existing || c._count.worksheets > existing._count.worksheets) {
      byName.set(key, c);
    }
  }
  const children = Array.from(byName.values());

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
  const reports: ChildReport[] = [];
  const topicsByChild: Record<string, string[]> = {};
  const attachments: EmailAttachment[] = [];

  for (const child of group.children) {
    try {
      // Yesterday's recap: most recent graded worksheet (score + missed topics).
      const lastGraded = await prisma.worksheet.findFirst({
        where: { childId: child.id, gradingResult: { isNot: null } },
        include: { gradingResult: true },
        orderBy: { createdAt: 'desc' },
      });
      const missedTopicIds = await getRecentlyMissedTopicIds(child.id);

      const gen: GenerationChild = {
        id: child.id,
        name: child.name,
        grade: child.grade,
        track: child.track,
        state: child.state,
        district: child.district,
        targetTestDate: child.targetTestDate,
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
        result.topicReviews
      );

      const datePart = today.toISOString().slice(0, 10);
      attachments.push({
        filename: `${child.name.replace(/[^a-zA-Z0-9]/g, '_')}_${datePart}_${dayOfWeek}.pdf`,
        content: Buffer.from(pdf).toString('base64'),
      });

      topicsByChild[child.name] = Array.from(new Set(result.questions.map((q) => q.topicName)));
      reports.push({
        name: child.name,
        ok: true,
        worksheetId: result.worksheetId,
        topicCount: result.topicIds.length,
        yesterdayScore: lastGraded?.gradingResult?.scorePercent ?? null,
        missedCount: missedTopicIds.length,
      });
    } catch (e) {
      reports.push({
        name: child.name,
        ok: false,
        error: e instanceof Error ? e.message : 'generation failed',
      });
    }
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
        select: { id: true, name: true, grade: true, emailEnabled: true },
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
