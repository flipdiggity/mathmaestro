/**
 * App mode switch.
 *
 * personal (default) — single-household tool: no auth, no billing, the
 *   seeded local user owns everything. Exactly the behavior of the summer
 *   rebuild that generates Eliana & Mylo's daily sheets.
 *
 * saas — multi-tenant product for Eanes ISD parents: Clerk sign-in, Stripe
 *   pay-per-use billing, public landing page, onboarding flow.
 *
 * Toggled by the NEXT_PUBLIC_APP_MODE env var ("saas" turns it on). It is
 * NEXT_PUBLIC_ so client components and middleware see the same value; it is
 * inlined at build time, so flipping it on Vercel requires a redeploy.
 */
export const APP_MODE: 'saas' | 'personal' =
  process.env.NEXT_PUBLIC_APP_MODE === 'saas' ? 'saas' : 'personal';

export const isSaas = APP_MODE === 'saas';
