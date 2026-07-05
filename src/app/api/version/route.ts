import { NextResponse } from 'next/server';

// Deploy sanity check: which code is production actually running?
// Returns the git SHA Vercel built from plus presence (not values) of the
// env vars the daily email depends on. No secrets are exposed.
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    deployedVia: process.env.VERCEL_GIT_COMMIT_SHA ? 'git' : 'cli-or-local',
    config: {
      resendKey: Boolean(process.env.RESEND_API_KEY),
      dailyEmailTo: Boolean(process.env.DAILY_EMAIL_TO),
      dailyEmailFrom: Boolean(process.env.DAILY_EMAIL_FROM),
      cronSecret: Boolean(process.env.CRON_SECRET),
      anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
      appMode: process.env.NEXT_PUBLIC_APP_MODE ?? 'personal',
    },
      serverTimeUtc: new Date().toISOString(),
    },
    // The UpdateWatcher polls this to detect new deploys — it must never be
    // served from any HTTP/CDN cache.
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
