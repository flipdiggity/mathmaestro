import type { Metadata } from 'next';
import Link from 'next/link';

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@mathmaestro.app';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The plain-English terms for using MathMaestro — accounts, pay-per-use billing, refunds, and what our AI can and cannot promise.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: July 4, 2026</p>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
            These are the rules for using MathMaestro. We have kept them short and in plain
            English. If anything is unclear, email{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              {SUPPORT_EMAIL}
            </a>{' '}
            and we will explain.
          </p>
        </header>

        <div className="mt-10 space-y-10">
          <Section title="1. What MathMaestro is">
            <p>
              MathMaestro generates personalized, printable math worksheets for your child,
              aligned to Texas TEKS standards and Eanes ISD pacing, and uses AI to grade photos
              of the completed work so the next worksheet can adapt. You print the sheets; your
              child works on paper; you photograph the results.
            </p>
          </Section>

          <Section title="2. Your account">
            <p>
              Accounts are for parents and guardians — you must be 18 or older to create one.
              Keep your sign-in credentials to yourself, use a real email address (that is where
              worksheets and receipts go), and let us know right away if you think someone else
              is using your account.
            </p>
          </Section>

          <Section title="3. Your child's information">
            <p>
              You provide your child&rsquo;s first name, grade, and math track. That, plus their
              worksheet results, is all the child data the service needs. How we handle it is
              covered in the{' '}
              <Link href="/privacy" className="font-medium text-indigo-600 hover:text-indigo-700">
                Privacy Policy
              </Link>
              .
            </p>
          </Section>

          <Section title="4. Free tier, payments, and billing">
            <p>
              New accounts get 5 free worksheet generations and 5 free photo gradings. After
              that, MathMaestro is pay-per-use: you keep one card on file and are charged only
              for the worksheets you generate and the photos you grade, at the prices shown in
              the app. There is no subscription, no monthly minimum, and nothing to cancel.
            </p>
            <p>
              Payments are processed by Stripe. We never see or store your full card number.
            </p>
          </Section>

          <Section title="5. Refunds">
            <p>
              Unused charges are refunded on request — email support and we reverse them, no
              questions asked. If an AI grading goes wrong, we refund that grading on request
              too. See the{' '}
              <Link href="/support" className="font-medium text-indigo-600 hover:text-indigo-700">
                support page
              </Link>{' '}
              for the fastest way to reach us.
            </p>
          </Section>

          <Section title="6. What the AI can and can't do">
            <p>
              Worksheet generation and photo grading are automated. They are good, but not
              perfect: the AI can occasionally misread handwriting or grade an answer
              incorrectly. Review results with your child, and tell us when something looks
              wrong. MathMaestro is a practice supplement — it does not replace classroom
              instruction, and we make no guarantees about grades, placement results, or test
              outcomes.
            </p>
          </Section>

          <Section title="7. Fair use">
            <p>
              MathMaestro is for your own family&rsquo;s use. Please don&rsquo;t resell or
              redistribute worksheets, share your account beyond your household, upload photos
              that aren&rsquo;t your child&rsquo;s worksheet, or attempt to abuse, overload, or
              reverse-engineer the service.
            </p>
          </Section>

          <Section title="8. Worksheets and content">
            <p>
              Worksheets generated for your child are yours to print and use within your family,
              forever. The software, curriculum sequencing, and everything else that makes the
              service run remain ours.
            </p>
          </Section>

          <Section title="9. Affiliations">
            <p>
              MathMaestro is an independent product built by an Eanes ISD parent. It is not
              affiliated with or endorsed by Eanes ISD, the Texas Education Agency, Khan
              Academy, or YouTube. TEKS standards are published by the State of Texas.
            </p>
          </Section>

          <Section title="10. Ending things">
            <p>
              You can stop using MathMaestro at any time — since there is no subscription, there
              is nothing to cancel, and you can ask us to delete your account and data. We may
              suspend or close accounts that violate these terms or abuse the service.
            </p>
          </Section>

          <Section title="11. If something goes wrong">
            <p>
              The service is provided &ldquo;as is.&rdquo; We work hard to keep it accurate and
              available, but to the maximum extent the law allows, our total liability for any
              claim related to the service is limited to the amount you paid us in the twelve
              months before the claim.
            </p>
          </Section>

          <Section title="12. Changes to these terms">
            <p>
              If we change these terms, we will update this page and the date at the top. For
              significant changes, we will also email account holders.
            </p>
          </Section>

          <Section title="13. Governing law">
            <p>
              These terms are governed by the laws of the State of Texas, USA. Any disputes will
              be handled in the courts of Travis County, Texas.
            </p>
          </Section>

          <Section title="14. Contact">
            <p>
              Questions about these terms? Email{' '}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                {SUPPORT_EMAIL}
              </a>{' '}
              or visit the{' '}
              <Link href="/support" className="font-medium text-indigo-600 hover:text-indigo-700">
                support page
              </Link>
              .
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}
