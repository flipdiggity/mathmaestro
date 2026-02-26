export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { MobileNav } from "@/components/nav/mobile-nav";
import { UsageBanner } from "@/components/billing/usage-banner";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "SharpSheet — AI-Powered Math Practice",
    template: "%s | SharpSheet",
  },
  description:
    "AI-powered practice worksheets that adapt to your child. Generate TEKS-aligned math worksheets, grade with AI vision, and track progress with spaced repetition.",
  openGraph: {
    title: "SharpSheet — AI-Powered Math Practice",
    description:
      "Generate personalized math worksheets, grade with AI, and track mastery. Built for Eanes ISD parents.",
    siteName: "SharpSheet",
    type: "website",
  },
};

const navLinks = [
  { href: "/generate", label: "Generate" },
  { href: "/grade", label: "Grade" },
  { href: "/worksheets", label: "History" },
  { href: "/children", label: "Children" },
  { href: "/billing", label: "Billing" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
        >
          <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
              <Link
                href="/"
                className="text-lg font-bold text-slate-900 hover:text-slate-700 transition-colors"
              >
                Sharp<span className="text-indigo-600">Sheet</span>
              </Link>

              <SignedIn>
                <div className="hidden sm:flex items-center gap-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <MobileNav links={navLinks} />
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>

              <SignedOut>
                <div className="flex items-center gap-3">
                  <Link
                    href="/sign-in"
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="text-sm font-medium bg-indigo-600 text-white px-4 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              </SignedOut>
            </div>
          </nav>
          <SignedIn>
            <UsageBanner />
          </SignedIn>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
