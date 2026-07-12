# MathMaestro — Session Context

## What This App Is
AI-powered math worksheet generator. Kids get personalized printed worksheets aligned to Texas TEKS (Eanes ISD pacing + courses), watch curated intro videos via a QR code on the sheet, complete the work by hand, parents photograph it, and AI grades it (including drawn answers). An adaptive engine drives topic selection, difficulty, and variety — and keeps progressing even when sheets go ungraded.

**Tech stack:** Next.js 14, Prisma (Neon Postgres), Anthropic Claude API (`claude-sonnet-5` for generation + vision grading; `ANTHROPIC_MODEL`/`ANTHROPIC_EFFORT` env overrides), @react-pdf/renderer (+ `qrcode`), Resend (daily email), deployed on Vercel. Clerk + Stripe exist but are dormant (see App modes).

**Live URL:** https://mathmaestro-tan.vercel.app
**Repo:** https://github.com/flipdiggity/mathmaestro (PUBLIC — assume anything committed here is world-readable)

## Secrets — never put a real key in this file
The repo is public. Live keys belong in `.env` (gitignored) locally and in Vercel env vars in prod. Placeholders only in `.env.example`. Never paste a real key into CLAUDE.md, README, a commit message, or a code comment — not even in an example command.

A Google Gemini key was hardcoded in this file's "To retry" b-roll line and pushed publicly; Google's scanner flagged it. Rotated and deleted July 12, 2026. Note that removing a key from HEAD does NOT unexpose it — it stays in git history forever. Rotation is the only real fix.

Scripts read keys from env (`scripts/generate-broll.sh` uses `${GEMINI_API_KEY:?}`; the script and `broll-clips/` are gitignored). To run it: `bash scripts/generate-broll.sh` with `GEMINI_API_KEY` exported, or `set -a; source .env; set +a` first.

## App modes
`NEXT_PUBLIC_APP_MODE` env var, build-time inlined (`src/lib/mode.ts`):
- **personal** (default, currently live) — no auth, no billing. One local user (`local-felipe`) owns the seeded kids (child ids literally `eliana`, `mylo`). The ENTIRE site and API are publicly reachable.
- **saas** — Clerk auth, Stripe pay-per-use (5 free generates + 5 free grades; `ADMIN_EMAILS` bypass), public landing page (rewritten July 2026: Eanes-specific marketing at `src/components/landing/landing-page.tsx`), `/onboarding`, per-family daily emails, support center (`/support` + `POST /api/support` → SupportTicket), `/terms`, `/privacy`. To flip: re-add CLERK_*/STRIPE_*/ADMIN_EMAILS/NEXT_PUBLIC_SUPPORT_EMAIL env vars on Vercel, set the flag, redeploy.

## Deployment
- `git push` on `main` → Vercel auto-deploys production (~1 min) — production branch switched from summer-rebuild to main on July 5, 2026. Other branches get preview deploys. The Vercel CLI is authenticated again (July 2026); `gh` is authenticated as flipdiggity.
- Verify with `GET /api/version` (commit SHA, branch, env-readiness booleans) or the Vercel Deployments page.
- `npm run db:push` only when prisma/schema.prisma changes — and it must land BEFORE deploying code that reads new columns (Prisma selects all scalar fields; missing columns = runtime 500s).

## Adaptive engine (July 2026 rebuild — the important part)
The old engine only adapted via photo-graded mastery; almost nothing was graded, so the frontier froze and sheets repeated the same 4 topics at difficulty 1-2 for weeks. The rebuilt engine adapts on TWO signals:

- **Serves** (`src/lib/adaptive.ts`): every generated sheet records per topic: `timesServed`, `servesSinceGrade`, recent question FORMATS, recent FIGURE kinds (TopicMastery columns). Repeat exposure escalates effective difficulty (+0.5/serve, capped) and rotates formats/figures even with zero grading.
- **Grades**: photo grading updates a per-topic difficulty LADDER 1..4 (`difficultyLevel`: ≥85% at served level → +1, <60% → −1) and stores wrong answers (`missesJson`) that the next sheet re-attacks with fresh numbers. Mastery EMA (`spaced-repetition.ts # updateMastery`) unchanged.

**Advance rule** (`sequencing.ts # selectSequential`): a topic is advanced past when mastery ≥80 OR served ≥ `servesToAdvance` times without graded weakness (graded <60 holds it). Ungraded-advanced topics cycle back later as "unverified review". Parent skip-marks (mastery=100, timesPracticed=0) never resurface.

**Plans** (`src/lib/plan.ts`): `Child.planEndDate` (falls back to targetTestDate) → weekdays left vs topics remaining → `paceNeeded`, `servesToAdvance` (2-3), `numCurrent` (3-6). Verified by simulation: Eliana's 66 topics finish in 26 weekdays at 2 practice days/topic. Plan status API: `GET/PATCH /api/children/[id]/plan`; UI on `/plan` + dashboard child cards.

**Courses** (`src/lib/curriculum/courses.ts`): the OFFICIAL Eanes pathway catalog (researched from eanesisd.net July 5): Math 3-8 standard; Math 5/6 Compacted (5th); Math 6 Accelerated (6th, grades [6,7]); Math 8 Accelerated (6th-via-placement-exam or 7th, grades [7,8], floor 7.17, id `eanes-m8-accel-g6`); Math 7/8 Compacted (7th); Math 4 + Compacted-Math Prep (id `eanes-g4-accel-ready`, grades [4,5]); Algebra 1 (Honors) and Geometry (Honors) as HS-credit courses in middle school — their TEKS curricula are registered as pseudo-grades 9 and 10 in the curriculum registry. School grade (Child.displayGrade) and course are INDEPENDENT choices — `getCoursesForGrade(schoolGrade)` drives pickers, `engineFieldsForCourse` keeps legacy (grade, track) in sync. `Child.courseId` supersedes (grade, track) via `resolveCurriculumForChild` (courses define explicit `grades[]` pools) — use that helper everywhere, never raw `getTopicsForChild`, so the mastery pool stays consistent.

**Difficulty scale is 1..4** (Foundation/On-level/Rigorous/Challenge — `DIFFICULTY_RUBRIC` in adaptive.ts). Question `format` field from `QUESTION_FORMATS` (10 formats, rotation memory per topic).

## Generation architecture (all paths share one core)
`src/lib/worksheet-generation.ts # generateAdaptiveWorksheet` is used by `POST /api/generate` (now a thin wrapper — the old inline copy is gone), `POST /api/generate-batch`, and `GET/POST /api/cron/daily-email` (Vercel cron `0 11 * * 1-5` UTC = 6am CT; `?dryRun=1`, `?secret=` manual trigger; per-child generation runs in PARALLEL — Sonnet 5 takes ~2-4 min/sheet with adaptive thinking).

- Batch progression: the serve-advance rule does the work now (windowOffset is deprecated — do NOT reintroduce per-day topic exclusion, which raced 3-6 topics/day into untaught material).
- Prompt v2 (`prompts/generate-worksheet.ts`): exact per-topic question counts (`allocateQuestions`, maintenance ≤10%), per-topic difficulty mixes, format rotation notes, figure quotas + rotation, MISSED-LAST-TIME retry blocks, summer plan context. Sonnet 5: no `temperature` (rejected), adaptive thinking budgets inside max_tokens (32K generation / 16K grading), streaming via `messages.stream().finalMessage()`.
- Figures: 14 kinds rendered by `pdf/worksheet-template.tsx` — the original 6 + `angle` (rotation + optional protractor), `table`, `tape-diagram`, `double-number-line`, `clock`, `area-model`, `polygon-grid`, `net`. Angle-pair now takes real measures + rotation. Smoke test: `npx tsx scripts/new-figures-test.tsx`.
- "Watch first": every sheet's PDF gets a QR box (→ `/watch/[worksheetId]`, public route) + top video titles. Curated topic→video map for all 172 topics in `curriculum/videos.ts` (KA course/unit URLs + search fallbacks that can't 404).
- E2E generation smoke test: `npx tsx --env-file=.env scripts/genv2-smoke-test.ts` (hits the live model, ~$0.15).

## Product layer
- `/admin` console: overview cards (incl. cron-health chip), Users (credits + refunds), Tickets, Audit log, Maintenance tabs. APIs under `/api/admin/*` (tickets, refund, audit, overview). Refunds write negative-cost UsageRecords of the refunded type (sign-counting in `billing.ts # getUsageCounts`); optional Stripe refund when env present. Everything audit-logged (`AuditLog` model).
- Support: `POST /api/support` (public) → `SupportTicket` + best-effort email to `SUPPORT_INBOX_EMAIL || DAILY_EMAIL_TO`.

## Known issues / state (July 5, 2026)
- The daily cron works (sheets exist through Jul 3; new engine live since Jul 5). The "cron never wrote a worksheet" note from June 10 is obsolete.
- July 5: schema migrated (Child.courseId/displayGrade/planEndDate, TopicMastery adaptive columns, AuditLog, SupportTicket), kids' courses + Aug-12 plans set via `scripts/setup-summer-plans.ts`, engine v2 deployed and verified with a live generation for Eliana.
- Old SaaS-era duplicate children (cmm… ids under felipefernandes@hey.com) still in DB; harmless (cron scoped to local-felipe), dedupe via admin Maintenance tab.
- Grading old worksheets (pre-curriculum-change) writes mastery rows under old topic IDs; harmless (filtered), cleanup endpoint exists.
