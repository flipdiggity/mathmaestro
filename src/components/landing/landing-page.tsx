import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Camera,
  ChevronDown,
  CircleCheckBig,
  CirclePlay,
  GraduationCap,
  Mail,
  MapPin,
  PenLine,
  Repeat2,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  Sun,
  type LucideIcon,
} from 'lucide-react';

/**
 * Marketing landing page (saas mode, signed-out visitors — see src/app/page.tsx).
 *
 * Server component on purpose: zero client JS. The FAQ uses native
 * <details>/<summary>; everything else is static markup.
 *
 * Nav note: the root layout renders a slim global nav (h-14, z-50) on every
 * page. This page ships its own marketing nav, so the root is pulled up under
 * the global bar (-mt-14 matches the layout's h-14) and the landing nav paints
 * over it (solid background, z-[60]). If the layout ever stops rendering its
 * nav for signed-out visitors, remove the -mt-14 below.
 */

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@mathmaestro.app';

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#tracks', label: 'Tracks' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

const TRUST_ITEMS = ['TEKS-aligned', 'Eanes ISD pacing', 'Built by an Eanes parent'];

type Step = { icon: LucideIcon; title: string; text: string };

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'Generate',
    text: "A worksheet built for your child — the topics their class is on, at the difficulty they're ready for — lands in your inbox each school morning. Print it.",
  },
  {
    icon: CirclePlay,
    title: 'Watch',
    text: "Every sheet opens with a QR code linking to a short, curated set of Khan Academy and YouTube videos on that day's topics. Watch first, then work.",
  },
  {
    icon: PenLine,
    title: 'Work on paper',
    text: 'Real handwriting, real diagrams, no screens. Plot the points, draw the models, show the work.',
  },
  {
    icon: Camera,
    title: 'Snap a photo — it adapts',
    text: "Photograph the finished sheet. AI grades every answer — even plotted points — updates mastery, and the next sheet adjusts.",
  },
];

type Feature = { icon: LucideIcon; title: string; text: string };

const FEATURES: Feature[] = [
  {
    icon: SlidersHorizontal,
    title: 'Four difficulty levels',
    text: 'Every topic runs Foundation → On-level → Rigorous → Challenge. Problems get harder as your child shows mastery and scaffold down where they struggle.',
  },
  {
    icon: Repeat2,
    title: 'Missed problems come back',
    text: 'Anything your child gets wrong returns on later sheets in new forms, until it is genuinely solid — not just seen once.',
  },
  {
    icon: Shapes,
    title: 'Real diagrams on paper',
    text: 'Coordinate planes, number lines, angles, tape diagrams, area models, data displays — drawn for each problem, not pasted clip-art.',
  },
  {
    icon: CirclePlay,
    title: 'Watch-first videos',
    text: 'A QR code on every worksheet links to hand-picked Khan Academy and YouTube videos for that day, so new topics never start cold.',
  },
  {
    icon: GraduationCap,
    title: 'Eanes pacing, real tracks',
    text: 'Topics follow the district nine-weeks scope and sequence — including Math 8 Accelerated and compacted tracks — so home practice matches class.',
  },
  {
    icon: Camera,
    title: 'Photo grading',
    text: 'Snap one photo of the finished page. AI reads the handwriting — including drawn answers like plotted points — and grades every question.',
  },
  {
    icon: Mail,
    title: 'Daily email',
    text: "Each school-day morning, that day's personalized PDF is in your inbox. Print it with the coffee; done before breakfast ends.",
  },
  {
    icon: Sun,
    title: 'Summer plans',
    text: 'Set a finish-by date — say, the first day of school — and topics are paced to get there, with an on-track indicator along the way.',
  },
];

type Track = { name: string; who: string; text: string };

const TRACKS: Track[] = [
  {
    name: 'Grades 3–8, on-level',
    who: 'Most students',
    text: "Grade-level TEKS topics in the same order and pace as the Eanes nine-weeks periods, so home practice lines up with this week's classwork.",
  },
  {
    name: 'Math 8 Accelerated',
    who: '6th graders',
    text: 'The compacted path: the second half of 7th-grade math plus all of 8th-grade math in one year. Daily reinforcement keeps a fast course from turning into gaps.',
  },
  {
    name: 'Compacted Math 5/6',
    who: '5th graders',
    text: 'Fifth- and sixth-grade math compacted into a single accelerated year — the on-ramp to the advanced middle-school sequence.',
  },
  {
    name: 'Acceleration test prep',
    who: 'Testing up a level',
    text: 'Preparing for a placement or acceleration exam? A focused plan covers exactly the tested scope, paced to be ready by test day.',
  },
];

const PRICING_FREE = ['5 worksheet generations', '5 photo gradings', 'No card required to start'];

const PRICING_PAYG = [
  { label: 'Generate a worksheet', price: '$0.50' },
  { label: 'Grade a photo', price: '$0.75' },
];

type Faq = { q: string; a: string };

const FAQS: Faq[] = [
  {
    q: 'Is this TEKS or Common Core?',
    a: "TEKS — the Texas Essential Knowledge and Skills, which is what Eanes classrooms teach. Topics are also sequenced to the district's nine-weeks pacing, so your child practices what their class is actually on, not a generic national curriculum. It is not Common Core.",
  },
  {
    q: 'What if my kid is between levels?',
    a: "That's the normal case, and it's handled per topic, not per child. Every topic has four difficulty levels (Foundation, On-level, Rigorous, Challenge). Your child can be at Challenge in fractions and Foundation in geometry at the same time — each sheet mixes levels based on what they've actually shown, and moves each topic up or down independently.",
  },
  {
    q: 'How does photo grading work?',
    a: "Your child works the printed sheet by hand. When they're done, you photograph the page with your phone and upload it. AI reads the handwriting — including drawn answers like plotted points and number-line marks — grades each question, and updates your child's mastery. The next worksheet adapts to what they missed.",
  },
  {
    q: 'Do I need a printer?',
    a: 'Yes — working on paper is the whole point. Any home printer works, black-and-white is fine, and a worksheet is just a page or two a day.',
  },
  {
    q: 'Can I pick topics manually?',
    a: "The engine picks topics automatically to follow the Eanes sequence and your child's mastery — that's what keeps practice aligned and adaptive. You can steer it, though: mark topics your child has already mastered so they're skipped, and generate a fresh sheet on demand any time instead of waiting for the morning email.",
  },
  {
    q: 'What about summer?',
    a: "Summer is where it shines. Set a finish-by date — usually the first day of school — and the system paces the remaining topics to cover what's needed by then, with an on-track indicator so you always know whether a missed day matters.",
  },
  {
    q: 'How do refunds work?',
    a: "Email support (or use the form on the support page) and we reverse unused charges — no questions asked. If a grading goes wrong, we refund it on request too.",
  },
  {
    q: 'Is MathMaestro affiliated with Eanes ISD?',
    a: 'No. MathMaestro is an independent tool built by a district parent, aligned to the publicly available TEKS standards and the district scope and sequence. It is not affiliated with or endorsed by Eanes ISD.',
  },
];

/* ------------------------------------------------------------------ */
/* Small SVG mocks for the hero worksheet card                         */
/* ------------------------------------------------------------------ */

function GridMock({ className }: { className?: string }) {
  const ticks = [0, 1, 2, 3, 4, 5];
  return (
    <svg
      viewBox="0 0 116 116"
      className={className}
      role="img"
      aria-label="Coordinate grid with the point (1, 3) plotted on the line y equals 3x"
    >
      {ticks.map((t) => (
        <g key={t} className="stroke-slate-200" strokeWidth="1">
          <line x1={8 + t * 20} y1="8" x2={8 + t * 20} y2="108" />
          <line x1="8" y1={8 + t * 20} x2="108" y2={8 + t * 20} />
        </g>
      ))}
      <line x1="8" y1="8" x2="8" y2="108" className="stroke-slate-400" strokeWidth="1.5" />
      <line x1="8" y1="108" x2="108" y2="108" className="stroke-slate-400" strokeWidth="1.5" />
      <line
        x1="8"
        y1="108"
        x2="41.3"
        y2="8"
        className="stroke-indigo-300"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
      <circle cx="28" cy="48" r="3.5" className="fill-indigo-600" />
      <text x="34" y="46" className="fill-slate-500" fontSize="9">
        A (1, 3)
      </text>
    </svg>
  );
}

const QR_FINDERS: Array<[number, number]> = [
  [0, 0],
  [14, 0],
  [0, 14],
];

const QR_DOTS: Array<[number, number]> = [
  [9, 0], [11, 1], [9, 2], [10, 3], [12, 3], [9, 4], [11, 5], [13, 5], [9, 6], [12, 6],
  [0, 9], [2, 9], [4, 9], [7, 9], [10, 9], [12, 9], [15, 9], [18, 9], [20, 9],
  [1, 10], [5, 10], [8, 10], [11, 10], [14, 10], [17, 10],
  [3, 11], [6, 11], [9, 11], [13, 11], [16, 11], [19, 11],
  [0, 12], [4, 12], [8, 12], [12, 12], [15, 12], [20, 12],
  [2, 13], [7, 13], [10, 13], [14, 13], [18, 13],
  [9, 14], [12, 14], [16, 14], [19, 14],
  [10, 15], [13, 15], [17, 15], [20, 15],
  [9, 16], [11, 16], [15, 16], [18, 16],
  [10, 17], [14, 17], [16, 17], [20, 17],
  [9, 18], [12, 18], [17, 18], [19, 18],
  [11, 19], [13, 19], [15, 19], [18, 19],
  [9, 20], [12, 20], [16, 20], [20, 20],
];

function QrMock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 21 21" className={className} aria-hidden="true">
      {QR_FINDERS.map(([x, y]) => (
        <g key={`f-${x}-${y}`} fill="currentColor">
          <rect x={x} y={y} width="7" height="7" />
          <rect x={x + 1} y={y + 1} width="5" height="5" fill="white" />
          <rect x={x + 2} y={y + 2} width="3" height="3" />
        </g>
      ))}
      {QR_DOTS.map(([x, y]) => (
        <rect key={`d-${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />
      ))}
    </svg>
  );
}

function WorksheetMock() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-3 rotate-2 rounded-2xl bg-indigo-100" aria-hidden="true" />
      <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
        {/* Sheet header */}
        <div className="flex items-start justify-between gap-4 border-b border-dashed border-slate-200 pb-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              MathMaestro · Daily sheet
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">Proportional Relationships</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Grade 6 · Math 8 Accelerated · Level 3 of 4
            </p>
            <p className="mt-2 text-[10px] text-slate-400">
              Name ______________&nbsp;&nbsp;Date ________
            </p>
          </div>
          <div className="shrink-0 text-center">
            <div className="rounded-lg border border-slate-200 bg-white p-1.5">
              <QrMock className="h-12 w-12 text-slate-900" />
            </div>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-indigo-600">
              Watch first
            </p>
          </div>
        </div>

        {/* Question 1 */}
        <div className="flex gap-3 border-b border-dashed border-slate-200 py-4">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-700">
            1
          </span>
          <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
            <p className="text-xs leading-relaxed text-slate-700">
              The graph shows <span className="font-semibold">y&nbsp;=&nbsp;3x</span>. Plot the
              point that shows the unit rate and label it{' '}
              <span className="font-semibold">A</span>.
            </p>
            <GridMock className="h-24 w-24 shrink-0" />
          </div>
        </div>

        {/* Question 2 */}
        <div className="flex gap-3 py-4">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-700">
            2
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs leading-relaxed text-slate-700">
              Mylo reads 42 pages in 3 nights. At that rate, how many pages will he read in 5
              nights?
            </p>
            <div className="mt-3 space-y-2.5" aria-hidden="true">
              <div className="h-px bg-slate-200" />
              <div className="h-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">pages =</span>
                <div className="h-px w-16 bg-slate-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Sheet footer chips */}
        <div className="flex flex-wrap gap-1.5 border-t border-dashed border-slate-200 pt-3">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-500">
            Mixed: today + spaced review
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-500">
            Answer key for parents
          </span>
        </div>
      </div>

      {/* Floating graded badge */}
      <div className="absolute -bottom-5 left-3 flex -rotate-2 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-lg">
        <Camera className="h-3.5 w-3.5 text-indigo-600" />
        <p className="text-[11px] font-medium text-slate-700">
          Photo graded: <span className="font-bold text-slate-900">9/10</span> — the next sheet
          adapts
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 text-balance">
        {title}
      </h2>
      {sub ? <p className="mt-3 text-base text-slate-600 text-balance">{sub}</p> : null}
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="-mt-14 bg-white text-slate-900">
      {/* ---------------------------------------------------------- */}
      {/* Sticky nav                                                  */}
      {/* ---------------------------------------------------------- */}
      <header className="sticky top-0 z-[60] border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
            Math<span className="text-indigo-600">Maestro</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Landing page sections">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild variant="ghost" className="text-slate-600 hover:text-slate-900">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------- */}
      {/* Hero                                                        */}
      {/* ---------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-2 lg:gap-10 lg:px-8">
          <div className="text-center lg:text-left">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              <MapPin className="h-3.5 w-3.5" />
              For Eanes ISD families · Grades 3–8
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 text-balance sm:text-5xl">
              Eanes math, <span className="text-indigo-600">mastered at your kitchen table.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600 text-balance lg:mx-0">
              A personalized, printable worksheet for every school day — the same TEKS topics your
              child&rsquo;s class is on this nine-weeks, at the difficulty they&rsquo;re ready for.
              They watch two short videos, work it on paper, you snap a photo. AI grades it, and
              the next sheet adapts.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Button asChild size="lg" className="bg-indigo-600 px-8 text-base hover:bg-indigo-700">
                <Link href="/sign-up">
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <a href="#how-it-works">See how it works</a>
              </Button>
            </div>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start">
              {TRUST_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-sm text-slate-500">
                  <CircleCheckBig className="h-3.5 w-3.5 text-indigo-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <WorksheetMock />
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* How it works                                                */}
      {/* ---------------------------------------------------------- */}
      <section id="how-it-works" className="scroll-mt-24 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="How it works"
            title="A daily loop that runs itself"
            sub="Four steps, one printed page — and no screens while the math is happening."
          />
          <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Features                                                    */}
      {/* ---------------------------------------------------------- */}
      <section id="features" className="scroll-mt-24 bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What's inside"
            title="Built like a tutor, delivered like a worksheet"
            sub="Everything a good tutor would track — mastery, pacing, weak spots, review — folded into a page or two of print a day."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                  <feature.icon className="h-5 w-5 text-indigo-600" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Tracks                                                      */}
      {/* ---------------------------------------------------------- */}
      <section id="tracks" className="scroll-mt-24 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Tracks"
            title="Wherever your child is on the Eanes math path"
            sub="On-level, accelerated, compacted, or aiming to test up — the sequencing matches the track, not just the grade."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {TRACKS.map((track) => (
              <div
                key={track.name}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{track.name}</h3>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    {track.who}
                  </span>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{track.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Built by a local parent                                     */}
      {/* ---------------------------------------------------------- */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            <MapPin className="h-3.5 w-3.5" />
            Made in Westlake
          </p>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Built by an Eanes dad, not an edtech giant
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            MathMaestro started because the builder&rsquo;s own two kids needed steady practice that
            matched what their Eanes classrooms were actually teaching — not a generic app&rsquo;s
            idea of &ldquo;grade 6 math.&rdquo; His kids still do these sheets every school
            morning. The product you&rsquo;re looking at is the one his family uses daily.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Pricing                                                     */}
      {/* ---------------------------------------------------------- */}
      <section id="pricing" className="scroll-mt-24 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Pricing"
            title="Try it free. Then pay per sheet."
            sub="No subscription, no monthly minimum, nothing to cancel. One card on file, charged only when you use it."
          />
          <div className="mx-auto mt-12 max-w-md">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-indigo-600 px-6 py-5 text-white">
                <p className="text-sm font-semibold uppercase tracking-widest text-indigo-200">
                  Start free
                </p>
                <ul className="mt-3 space-y-2">
                  {PRICING_FREE.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CircleCheckBig className="h-4 w-4 shrink-0 text-indigo-200" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Then pay as you go
                </p>
                <dl className="mt-3 space-y-3">
                  {PRICING_PAYG.map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between">
                      <dt className="text-sm text-slate-600">{row.label}</dt>
                      <dd className="text-sm font-semibold text-slate-900">{row.price}</dd>
                    </div>
                  ))}
                </dl>
                <Button asChild className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700">
                  <Link href="/sign-up">Get started free</Link>
                </Button>
                <p className="mt-3 text-center text-xs text-slate-400">
                  Unused charges are refunded on request — no questions asked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* FAQ                                                         */}
      {/* ---------------------------------------------------------- */}
      <section id="faq" className="scroll-mt-24 bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="FAQ" title="Questions parents ask" />
          <div className="mt-12 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-6 shadow-sm">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">
            Something else?{' '}
            <Link href="/support" className="font-medium text-indigo-600 hover:text-indigo-700">
              Visit the support center
            </Link>{' '}
            or email{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Final CTA                                                   */}
      {/* ---------------------------------------------------------- */}
      <section className="bg-indigo-600 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white text-balance">
            See it adapt to your child — free
          </h2>
          <p className="mt-3 text-base text-indigo-100">
            5 worksheet generations and 5 photo gradings on the house. No card required.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-7 bg-white px-8 text-base text-indigo-700 hover:bg-indigo-50"
          >
            <Link href="/sign-up">
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Footer                                                      */}
      {/* ---------------------------------------------------------- */}
      <footer className="bg-slate-900 py-14 text-slate-300">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-lg font-bold text-white">
                Math<span className="text-indigo-400">Maestro</span>
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-400">
                Adaptive printed math practice for Eanes ISD families — TEKS-aligned, watched
                first, worked on paper, graded from a photo.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Product</p>
              <ul className="mt-3 space-y-2 text-sm">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-slate-400 transition-colors hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Support</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/support" className="text-slate-400 transition-colors hover:text-white">
                    Support center
                  </Link>
                </li>
                <li>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Legal</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/terms" className="text-slate-400 transition-colors hover:text-white">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-slate-400 transition-colors hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-slate-800 pt-6">
            <p className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} MathMaestro · Westlake, Texas. MathMaestro is an
              independent, family-built product and is not affiliated with or endorsed by Eanes
              ISD, Khan Academy, or YouTube.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
