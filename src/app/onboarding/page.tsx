'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Camera, TrendingUp, ClipboardCheck } from 'lucide-react';

const GRADES = [3, 4, 5, 6, 7, 8];
const TRACKS = [
  { id: 'standard', label: 'Standard', blurb: 'On-grade-level pace' },
  { id: 'accelerated', label: 'Accelerated', blurb: 'Pulls in next-grade material' },
  { id: 'test-prep', label: 'Test Prep', blurb: 'Working toward a placement exam' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [childName, setChildName] = useState('');

  // Form
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(4);
  const [track, setTrack] = useState('standard');

  async function handleAddChild(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, grade, track, state: 'TX', district: 'eanes-isd' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not add child');
      setChildId(data.child.id);
      setChildName(data.child.name);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {step === 1 && (
        <>
          <header className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900">Welcome to MathMaestro</h1>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
              Tell us about your child and we&apos;ll build worksheets matched to the Eanes ISD
              curriculum, at their level, that adapt as they practice.
            </p>
          </header>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add your child</CardTitle>
              <CardDescription>You can add more children later.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddChild} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. Avery"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Grade (fall 2026)
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {GRADES.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGrade(g)}
                        className={`rounded-md border px-2 py-2 text-sm font-medium transition-colors ${
                          grade === g
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Track</label>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {TRACKS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTrack(t.id)}
                        className={`rounded-md border px-3 py-2 text-left transition-colors ${
                          track === t.id
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <span className="block text-sm font-medium text-slate-900">{t.label}</span>
                        <span className="block text-xs text-slate-500">{t.blurb}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button type="submit" disabled={saving || !name.trim()} className="w-full">
                  {saving ? 'Adding…' : 'Continue'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { icon: FileText, label: 'Print a worksheet' },
              { icon: Camera, label: 'Photograph the work' },
              { icon: TrendingUp, label: 'AI grades & adapts' },
            ].map((s) => (
              <div key={s.label}>
                <s.icon className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 2 && childId && (
        <>
          <header className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900">{childName} is set up</h1>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
              Two good ways to start. The placement check takes ~20 minutes and tells us what{' '}
              {childName} already knows, so worksheets start at the right spot instead of at the
              beginning of the year.
            </p>
          </header>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-indigo-200">
              <CardHeader>
                <ClipboardCheck className="h-6 w-6 text-indigo-600 mb-2" />
                <CardTitle className="text-base">Start with a placement check</CardTitle>
                <CardDescription>
                  Recommended. A short diagnostic worksheet — print it, have {childName} do it,
                  photograph it, and the plan calibrates automatically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => router.push(`/generate?childId=${childId}&diagnostic=1`)}
                >
                  Generate placement check
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-6 w-6 text-slate-500 mb-2" />
                <CardTitle className="text-base">Jump straight to a worksheet</CardTitle>
                <CardDescription>
                  Start from the beginning of grade {grade} and let mastery build from there. You
                  can mark topics {childName} already knows on the Plan page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/generate?childId=${childId}`)}
                >
                  Generate first worksheet
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            <Link href="/" className="underline hover:text-slate-600">
              Skip for now — go to the dashboard
            </Link>
          </p>
        </>
      )}
    </main>
  );
}
