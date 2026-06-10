/**
 * Mode-aware middleware.
 *
 * personal — everything passes through (single-household tool).
 * saas — Clerk protects everything except the landing page, auth pages,
 *   Stripe webhooks, the cron endpoint (guarded by CRON_SECRET), and the
 *   version probe.
 */
import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { isSaas } from './lib/mode';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/cron(.*)',
  '/api/version',
]);

const saasMiddleware = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

function personalMiddleware() {
  return NextResponse.next();
}

export default isSaas ? saasMiddleware : personalMiddleware;

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
