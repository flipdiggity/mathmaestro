import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
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
  title: "MathMaestro",
  description: "Math worksheet generator and grader for kids",
};

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
              MathMaestro
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/generate"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Generate
              </Link>
              <Link
                href="/grade"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Grade
              </Link>
              <Link
                href="/worksheets"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                History
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
