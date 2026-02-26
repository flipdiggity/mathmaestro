'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Camera, TrendingUp, Brain, Sparkles, GraduationCap } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight text-balance">
            AI-powered practice that{' '}
            <span className="text-indigo-600">adapts to your child</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto text-balance">
            Generate personalized math worksheets aligned to your school&apos;s curriculum.
            Grade them instantly with AI vision. Track mastery with spaced repetition.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-base px-8">
              <Link href="/sign-up">Start Free — 5 Worksheets</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            No credit card required. 5 free worksheets + 5 free gradings.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                step: '1',
                title: 'Generate',
                description:
                  'AI creates personalized worksheets based on your child\'s grade, curriculum, and mastery level. Download the PDF and print.',
              },
              {
                icon: Camera,
                step: '2',
                title: 'Practice & Photo',
                description:
                  'Your child completes the worksheet by hand. When done, snap a photo of the completed work with your phone.',
              },
              {
                icon: TrendingUp,
                step: '3',
                title: 'Grade & Track',
                description:
                  'AI reads the handwriting, grades every question, and updates your child\'s mastery. The next worksheet adapts automatically.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1">
                  Step {item.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">
            Built for real learning
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Brain,
                title: 'Spaced Repetition',
                description: 'Topics return at optimal intervals based on mastery',
              },
              {
                icon: Camera,
                title: 'Vision Grading',
                description: 'AI reads handwriting and grades every question',
              },
              {
                icon: FileText,
                title: 'PDF Worksheets',
                description: 'Print-ready worksheets with answer keys',
              },
              {
                icon: GraduationCap,
                title: 'TEKS-Aligned',
                description: 'Curriculum matched to Texas state standards',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-slate-200 bg-white p-5"
              >
                <feature.icon className="h-5 w-5 text-indigo-600 mb-3" />
                <h3 className="font-semibold text-slate-900 text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-slate-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eanes ISD Callout */}
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
              Built by Eanes ISD parents
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            Aligned to Texas TEKS standards
          </h2>
          <p className="text-slate-600 mb-6">
            Every worksheet is generated from a carefully curated curriculum that matches what your
            child is learning in school. Support for grades 3-7 with standard and accelerated tracks.
          </p>
          <p className="text-sm text-slate-400">
            More districts and states coming soon.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
            Simple, pay-per-use pricing
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-8 max-w-sm mx-auto">
            <div className="text-sm text-slate-500 mb-4">Start free, pay as you go</div>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Free tier</span>
                <span className="font-semibold text-slate-900">5 generates + 5 grades</span>
              </div>
              <hr className="border-slate-100" />
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Generate worksheet</span>
                <span className="font-semibold text-slate-900">$0.50</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Grade worksheet</span>
                <span className="font-semibold text-slate-900">$0.75</span>
              </div>
            </div>
            <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
              <Link href="/sign-up">Get Started Free</Link>
            </Button>
            <p className="text-xs text-slate-400 mt-3">No subscription. No commitment.</p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Ready to sharpen your child&apos;s math skills?
          </h2>
          <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-base px-8">
            <Link href="/sign-up">Start Free Today</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} SharpSheet. All rights reserved.</p>
          {process.env.NEXT_PUBLIC_SUPPORT_EMAIL && (
            <p className="mt-2">
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
                className="underline hover:text-slate-600"
              >
                Contact support
              </a>
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
