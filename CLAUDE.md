# SharpSheet (MathMaestro) — Session Context

## What This App Is
AI-powered math worksheet generator for parents. Kids get personalized worksheets aligned to Texas TEKS standards, complete them by hand, parents photograph the completed work, and AI grades it. Spaced repetition tracks mastery across topics.

**Tech stack:** Next.js 14, Prisma (Neon Postgres), Clerk auth, Stripe billing, Anthropic Claude API (worksheet generation + grading), deployed on Vercel.

**Live URL:** https://mathmaestro-tan.vercel.app
**Repo:** https://github.com/flipdiggity/mathmaestro

## What Was Done (March 2, 2026)

### Feature 1: All Days of Week
- `src/app/generate/page.tsx:76` — `ALL_DAYS` expanded from Mon-Thu to all 7 days
- Backend already supported any day name

### Feature 2: Admin Billing Bypass
- `src/lib/admin.ts` — Created `isAdminEmail()` helper, reads `ADMIN_EMAILS` env var (comma-separated)
- `src/lib/billing.ts` — Admin bypass before free tier check in `checkUsageAllowance()`
- `src/app/api/billing/usage/route.ts` — Added `isAdmin` boolean to response
- `src/app/billing/page.tsx` — Shows "Admin — Unlimited Access" badge for admins
- `src/components/billing/usage-banner.tsx` — Hidden for admin users
- `src/app/layout.tsx` — Made async, conditionally shows "Admin" nav link
- Admin email: felipefernandes@hey.com

### Feature 3: Support Contact + Admin Panel
- `src/components/landing/landing-page.tsx` — "Contact support" mailto in footer
- `src/app/billing/page.tsx` — Support email link below pricing
- `src/app/api/admin/users/route.ts` — GET: search user by email, returns user info + usage
- `src/app/api/admin/credits/route.ts` — POST: `delete-record` (single refund) and `add-credits` (bulk restore)
- `src/app/admin/page.tsx` — Full admin UI with user lookup, usage stats, credit buttons, record list

### Fix: Duplicate Worksheets
- Problem: Topic selection is deterministic (same child + no grading = same topics). Temperature 0.3 produced near-identical output.
- `src/app/api/generate/route.ts` — Temperature bumped 0.3 → 0.7
- `src/app/api/generate-batch/route.ts` — Same temperature bump
- `src/lib/prompts/generate-worksheet.ts` — Added instruction to vary numbers, contexts, and phrasing

### Env Vars Added
- `ADMIN_EMAILS="felipefernandes@hey.com"` — set in .env and Vercel
- `NEXT_PUBLIC_SUPPORT_EMAIL="felipefernandes@hey.com"` — set in .env and Vercel

## Vercel Deployment
- Project: `felipefernandes-9260s-projects/mathmaestro`
- All env vars are configured including the two new ones
- Deploys via `npx vercel --prod` (not auto-deploy from GitHub)
- Two commits pushed and deployed:
  - `c64173c` — All-week + admin bypass + admin panel + support contact
  - `34862b2` — Fix duplicate worksheets

## Incomplete: B-Roll Video Generation
- Script at `scripts/generate-broll.sh` — uses Google Veo 3 API (`predictLongRunning` endpoint)
- Google API key: stored in the session (user has it), project "SharpSheet" on Google AI Studio, Tier 1
- 2 of 5 clips generated successfully in `broll-clips/`:
  - `01-kid-writing.mp4` (1.2 MB) — kid writing math at desk
  - `02-parent-helping.mp4` (2.4 MB) — parent and child at table
- 3 clips remaining (hit daily rate limit):
  - `03-phone-photo` — photographing worksheet
  - `04-kid-celebrating` — fist pump celebration
  - `05-morning-routine` — kitchen morning scene
- User saw the 2 generated clips and said "those are bad" — may want to skip or revise prompts
- To retry: `GEMINI_API_KEY="AIzaSyBrtc8lvHNIS96emvNz5op7-PaCtlYUP74" bash scripts/generate-broll.sh`

## Key Architecture Notes
- Clerk middleware protects all routes except `/`, `/sign-in`, `/sign-up`, `/api/webhooks`
- `getCurrentUser()` in `src/lib/auth.ts` auto-creates DB user on first API call after Clerk signup
- Billing works by counting `UsageRecord` rows — deleting records = restoring credits
- Spaced repetition in `src/lib/spaced-repetition.ts` selects topics by mastery + order field
- Worksheet generation uses Claude Sonnet via `src/lib/anthropic.ts`
