'use client';

import { useEffect, useState } from 'react';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ChildRow {
  id: string;
  name: string;
  emailEnabled: boolean;
  displayGrade: number | null;
  grade: number;
}

interface SettingsData {
  dailyEmail: string;
  fallbackMasked: string | null;
  emailManagedByAccount: boolean;
  schedule: string;
  children: ChildRow[];
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings');
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? 'Failed to load settings');
        setData(d);
        setEmail(d.dailyEmail ?? '');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load settings');
      }
    })();
  }, []);

  async function saveEmail() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyEmail: email }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Could not save');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  async function toggleChild(child: ChildRow) {
    setTogglingId(child.id);
    setError(null);
    try {
      const res = await fetch(`/api/children/${child.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailEnabled: !child.emailEnabled }),
      });
      if (!res.ok) throw new Error('Could not update');
      setData((prev) =>
        prev
          ? {
              ...prev,
              children: prev.children.map((c) =>
                c.id === child.id ? { ...c, emailEnabled: !c.emailEnabled } : c
              ),
            }
          : prev
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daily worksheet email and per-child preferences.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
            {error}
          </div>
        )}

        {!data ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-600" />
                  Daily worksheet email
                </CardTitle>
                <CardDescription>
                  {data.schedule}. Each email includes the day&rsquo;s printable PDF for every
                  child that&rsquo;s turned on below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.emailManagedByAccount ? (
                  <p className="text-sm text-muted-foreground">
                    The daily email goes to your account&rsquo;s email address.
                  </p>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder={
                          data.fallbackMasked
                            ? `Default: ${data.fallbackMasked}`
                            : 'you@example.com'
                        }
                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <Button onClick={saveEmail} disabled={saving}>
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : saved ? (
                          <>
                            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Saved
                          </>
                        ) : (
                          'Save'
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {email
                        ? `Worksheets will be emailed to ${email}.`
                        : data.fallbackMasked
                          ? `No address set — using the built-in default (${data.fallbackMasked}). Leave blank to keep it.`
                          : 'No address set and no default configured — set one to receive the daily email.'}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Who gets a daily worksheet</CardTitle>
                <CardDescription>
                  Turn a child off to pause their sheet (vacation, sick day) — their plan and
                  progress are untouched.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.children.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Grade {c.displayGrade ?? c.grade}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={c.emailEnabled}
                      disabled={togglingId === c.id}
                      onClick={() => toggleChild(c)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        c.emailEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                      } ${togglingId === c.id ? 'opacity-60' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          c.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
