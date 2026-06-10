# MathMaestro — Session Context

## What This App Is
AI-powered math worksheet generator. Kids get personalized worksheets aligned to Texas TEKS (Eanes ISD pacing), complete them by hand, parents photograph the completed work, and AI grades it. Spaced repetition + a sequential curriculum frontier drive topic selection.

**Tech stack:** Next.js 14, Prisma (Neon Postgres), Anthropic Claude API (claude-sonnet-4-6 for generation + vision grading), @react-pdf/renderer, Resend (daily email), deployed on Vercel. Clerk + Stripe exist but are dormant (see App modes).

**Live URL:** https://mathmaestro-tan.vercel.app
**Repo:** https://github.com/flipdiggity/mathmaestro

## App modes (June 10, 2026)
`NEXT_PUBLIC_APP_MODE` env var, build-time inlined (`src/lib/mode.ts`):
- **personal** (default, currently live) — no auth, no billing. One local user (`local-felipe`) owns the seeded kids (child ids literally `eliana`, `mylo`). The ENTIRE site and API are publicly reachable. Name-keyed tweaks apply: Eliana's start floor (grade 7, order 17) and per-kid diagnostic probes.
- **saas** — Clerk auth (middleware + `src/lib/auth.ts`; admin emails adopt the local user's children on first sign-in), Stripe pay-per-use (5 free generates + 5 free grades, then card on file; `ADMIN_EMAILS` bypass), public landing page, `/onboarding` wizard, per-family daily emails. To flip: re-add CLERK_*/STRIPE_*/ADMIN_EMAILS/NEXT_PUBLIC_SUPPORT_EMAIL env vars on Vercel (they were removed), set the flag, redeploy.

## Deployment
- `git push` on `summer-rebuild` → Vercel auto-deploys production (~1 min). That is the ONLY deploy path; `npx vercel --prod` has an expired token.
- Verify with `GET /api/version` (commit SHA, branch, env-readiness booleans) or the Vercel Deployments page.
- `npm run db:push` only when prisma/schema.prisma changes.

## Generation architecture (all paths share one core)
`src/lib/worksheet-generation.ts # generateAdaptiveWorksheet` is used by:
- `POST /api/generate` (single sheet — note: route still has an older inline copy, behaviorally equivalent)
- `POST /api/generate-batch` (multi-day; `windowOffset` slides the current-topic window ONE topic per day — do NOT go back to excluding prior days' topics, that raced 3-6 topics/day into untaught material)
- `GET/POST /api/cron/daily-email` (Vercel cron `0 11 * * 1-5` UTC = 6am CT; supports `?dryRun=1` and `?secret=` manual trigger)

Topic selection: `src/lib/curriculum/sequencing.ts`. Frontier = first unmastered topic past the start floor. Mastered ≥80; skip-marked topics are mastery=100/timesPracticed=0 and NEVER resurface; spaced "maintenance" review of graded-mastered topics expands 1→2→4→…→30 days, ≤1 topic and ≤10% of questions per sheet, retired at ≥95% with 4+ practices. Selection ignores TopicMastery rows whose topicId isn't in the current curriculum pool (older ID schemes left orphans; `POST /api/admin/cleanup-mastery` deletes them).

## Known issues / state (June 10, 2026)
- The daily cron has NEVER successfully written a worksheet: per-child generation fails inside the cron's try/catch and the error used to be visible only in the emailed report. As of commit "Harden daily generation…" failures are console.error'd (check Vercel function logs), generation retries once, maxTokens 16384. Root cause not yet confirmed — diagnose via logs after next run.
- Grading old worksheets (pre-curriculum-change) writes mastery rows under old topic IDs; harmless (filtered), cleanup endpoint exists.
- June 10: bad June-8 batch sheets (Wed–Fri) for Mylo were deleted from the DB; fresh frontier-correct sheets were generated for both kids for Wednesday June 10.
