/**
 * Personal-use middleware shim.
 *
 * The SaaS version protected most routes via Clerk middleware. For personal
 * use there's nothing to gate, so we let everything through. The matcher is
 * still here so Next.js doesn't run middleware on static assets.
 */
import { NextResponse } from 'next/server';

export default function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
