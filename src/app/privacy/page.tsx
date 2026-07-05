import type { Metadata } from 'next';
import Link from 'next/link';

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@mathmaestro.app';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    "How MathMaestro handles your family's data: child first name and grade, worksheet results, photos used only for grading, payments via Stripe, and no ads.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: July 4, 2026</p>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
            MathMaestro is a small, family-built tool, and this policy is written the way we
            would want to read one: short, specific, and honest.
          </p>
        </header>

        <div className="mt-10 space-y-10">
          <Section title="The short version">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>We collect the minimum needed to make adaptive worksheets work.</li>
              <li>Photos of your child&rsquo;s worksheets are used only for grading.</li>
              <li>We never sell your data, and there are no ads or ad trackers.</li>
              <li>Payments are handled by Stripe; we never see your full card number.</li>
              <li>Email us any time to see or delete everything we have.</li>
            </ul>
          </Section>

          <Section title="What we collect">
            <p>
              <span className="font-semibold text-slate-800">About you:</span> your email address
            and, if you pay for the service, a payment method held by Stripe on our behalf.
            </p>
            <p>
              <span className="font-semibold text-slate-800">About your child:</span> first name,
              grade, and math track — that&rsquo;s all we ask for. No last name, no birthdate, no
              contact information.
            </p>
            <p>
              <span className="font-semibold text-slate-800">From using the service:</span> the
              worksheets generated, the photos of completed worksheets you upload, per-question
              results, and topic mastery over time.
            </p>
          </Section>

          <Section title="How we use it">
            <p>
              To generate worksheets matched to your child&rsquo;s level, grade uploaded photos,
              adapt future worksheets, send the daily worksheet email, handle billing, and answer
              your support requests. That&rsquo;s the full list.
            </p>
          </Section>

          <Section title="Photos of your child's work">
            <p>
              When you photograph a completed worksheet, the image is processed by our AI
              provider solely to grade the answers and update mastery. Photos are not shared
              beyond the service providers that run MathMaestro, are never used for advertising,
              and are kept only so you can review past work. Ask us and we will delete them.
            </p>
          </Section>

          <Section title="Children's privacy">
            <p>
              Accounts belong to parents and guardians. Children do not create accounts, and we
              never collect contact information from a child — the only child data in the system
              (first name, grade, track, results) is provided by you, the parent, to personalize
              worksheets.
            </p>
          </Section>

          <Section title="Service providers">
            <p>
              A few companies process data on our behalf to run the service: Stripe (payments),
              our AI provider (worksheet generation and photo grading), our email provider (the
              daily worksheet email), and our hosting and database providers. They are permitted
              to use the data only to provide their service to us.
            </p>
          </Section>

          <Section title="What we never do">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>No selling or renting personal data — yours or your child&rsquo;s.</li>
              <li>No ads and no third-party advertising trackers.</li>
              <li>No using your child&rsquo;s photos or results for anything except your account.</li>
            </ul>
          </Section>

          <Section title="Your choices">
            <p>
              Email{' '}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                {SUPPORT_EMAIL}
              </a>{' '}
              to access, correct, export, or delete your family&rsquo;s data. Deleting your
              account removes your children&rsquo;s profiles, results, and uploaded photos.
            </p>
          </Section>

          <Section title="Security and retention">
            <p>
              Data is encrypted in transit, access is limited to what is needed to run the
              service, and we keep your data only while your account is active or as required
              for billing records. Deletion requests are honored promptly.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              If we change this policy, we will update this page and the date at the top, and
              email account holders about significant changes.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Privacy questions? Email{' '}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                {SUPPORT_EMAIL}
              </a>{' '}
              or use the{' '}
              <Link href="/support" className="font-medium text-indigo-600 hover:text-indigo-700">
                support page
              </Link>
              . MathMaestro operates from Texas, USA, and this policy is governed by Texas law.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}
