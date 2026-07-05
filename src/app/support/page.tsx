import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeDollarSign, Mail } from 'lucide-react';
import { SupportForm } from './support-form';

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@mathmaestro.app';

export const metadata: Metadata = {
  title: 'Support',
  description:
    'Get help with MathMaestro — worksheets, photo grading, billing, and refunds. Send us a message or email support directly.',
};

const QUICK_ANSWERS = [
  {
    q: 'A grading looks wrong',
    a: 'AI grading occasionally misreads handwriting, especially light pencil or a skewed photo. Retake the photo flat, in good light, with the whole page in frame, and grade again. Still wrong? Tell us below — we will refund the grading on request.',
  },
  {
    q: 'My daily email did not arrive',
    a: 'Worksheets go out early on school-day mornings. Check your spam or promotions folder first, and add our sending address to your contacts. You can always generate a fresh worksheet on demand from the app, and if emails keep missing you, send us a note.',
  },
  {
    q: 'Do I need a printer?',
    a: 'Yes — MathMaestro is built around working on paper by hand. Any home printer works and black-and-white is fine; a worksheet is a page or two per day.',
  },
  {
    q: 'How do I change my child’s grade or track?',
    a: 'Open the Children page in the app to update grade and track (on-level, Math 8 Accelerated, compacted, or test prep). New worksheets pick up the change immediately; past results are kept.',
  },
];

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Support</h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Questions about worksheets, grading, or billing? Check the quick answers below, then
          send a message — a real person (the parent who built MathMaestro) reads every one.
        </p>
      </header>

      {/* Quick answers */}
      <section className="mt-10" aria-labelledby="quick-answers-heading">
        <h2 id="quick-answers-heading" className="text-lg font-semibold text-slate-900">
          Quick answers
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {QUICK_ANSWERS.map((item) => (
            <div key={item.q} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">{item.q}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{item.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500">
          More questions are answered in the{' '}
          <Link href="/#faq" className="font-medium text-indigo-600 hover:text-indigo-700">
            FAQ on the home page
          </Link>
          .
        </p>
      </section>

      {/* Refund policy */}
      <section className="mt-10" aria-labelledby="refunds-heading">
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6">
          <div className="flex items-center gap-2.5">
            <BadgeDollarSign className="h-5 w-5 text-indigo-600" />
            <h2 id="refunds-heading" className="text-lg font-semibold text-slate-900">
              Refunds, plainly
            </h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
            <li>
              <span className="font-semibold">Unused credits or charges:</span> refundable, always.
              Ask and we reverse them — no questions asked.
            </li>
            <li>
              <span className="font-semibold">A grading that went wrong:</span> refunded on
              request. Tell us which worksheet and we will sort it out.
            </li>
          </ul>
          <p className="mt-3 text-sm text-slate-600">
            Email{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-medium text-indigo-700 underline underline-offset-2"
            >
              {SUPPORT_EMAIL}
            </a>{' '}
            or use the form below.
          </p>
        </div>
      </section>

      {/* Contact form */}
      <section className="mt-10" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="text-lg font-semibold text-slate-900">
          Send us a message
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">
          We reply by email. For refund requests, mention the charge or worksheet in question.
        </p>
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <SupportForm />
        </div>
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Mail className="h-4 w-4 text-slate-400" />
          Prefer plain email? Write to{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>
    </main>
  );
}
