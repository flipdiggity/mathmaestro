import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser, requireUser } from '@/lib/auth';
import { isSaas } from '@/lib/mode';
import { LandingPage } from '@/components/landing/landing-page';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let user;
  if (isSaas) {
    user = await getCurrentUser();
    // Signed-out visitor → marketing landing page.
    if (!user) return <LandingPage />;
  } else {
    user = await requireUser();
  }

  const children = await prisma.child.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' },
    include: {
      worksheets: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  // New saas user with no children yet → onboarding.
  if (isSaas && children.length === 0) {
    redirect('/onboarding');
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {isSaas ? 'Daily Math' : 'Summer 2026 — Daily Math'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Pick a kid to generate or review today&rsquo;s worksheet.
        </p>
      </header>

      {children.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-900">
            No children seeded yet. Run <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">npx prisma db seed</code> to add Eliana and Mylo.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {children.map((child) => {
            const latest = child.worksheets[0];
            return (
              <div
                key={child.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">{child.name}</h2>
                  <span className="text-xs text-slate-500">
                    Grade {child.grade}{child.track !== 'standard' ? ` · ${child.track}` : ''}
                  </span>
                </div>
                {latest ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Last worksheet: {latest.title} ({latest.status})
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">No worksheets yet.</p>
                )}
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/generate?childId=${child.id}`}
                    className="text-sm font-medium bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Generate today
                  </Link>
                  <Link
                    href={`/worksheets?childId=${child.id}`}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md border border-slate-200 transition-colors"
                  >
                    History
                  </Link>
                </div>
              </div>
            );
          })}
          {isSaas && (
            <Link
              href="/children"
              className="rounded-lg border border-dashed border-slate-300 bg-white p-5 flex items-center justify-center text-sm font-medium text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
            >
              + Add another child
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
