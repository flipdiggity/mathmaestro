export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { MobileNav } from "@/components/nav/mobile-nav";
import { SmartLink } from "@/components/nav/smart-link";
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
    default: "Math Maestro — Summer Edition",
    template: "%s | Math Maestro",
  },
  description:
    "Personal math worksheet generator for Eliana & Mylo's summer 2026 math practice.",
};

const navLinks = [
  { href: "/", label: "Today" },
  { href: "/generate", label: "Generate" },
  { href: "/grade", label: "Grade" },
  { href: "/plan", label: "Plan" },
  { href: "/worksheets", label: "History" },
  { href: "/children", label: "Children" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
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
              Math<span className="text-indigo-600">Maestro</span>
            </Link>

            <div className="hidden sm:flex items-center gap-6">
              {navLinks.map((link) => (
                <SmartLink
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {link.label}
                </SmartLink>
              ))}
            </div>
            <div className="flex items-center gap-3 sm:hidden">
              <MobileNav links={navLinks} />
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
