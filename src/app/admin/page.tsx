'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, Plus, ShieldAlert } from 'lucide-react';

interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  stripeCustomerId: string | null;
  createdAt: string;
}

interface ChildInfo {
  id: string;
  name: string;
  grade: number;
  track: string;
}

interface UsageRecord {
  id: string;
  type: string;
  creditsCost: number;
  worksheetId: string | null;
  createdAt: string;
}

interface UserData {
  user: UserInfo;
  children: ChildInfo[];
  usage: {
    generates: number;
    grades: number;
  };
  usageRecords: UsageRecord[];
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Check admin status on mount
  useEffect(() => {
    fetch('/api/billing/usage')
      .then((r) => r.json())
      .then((data) => setIsAdmin(data.isAdmin === true))
      .catch(() => setIsAdmin(false));
  }, []);

  async function handleSearch() {
    if (!searchEmail.trim()) return;
    setLoading(true);
    setError(null);
    setUserData(null);

    try {
      const res = await fetch(`/api/admin/users?email=${encodeURIComponent(searchEmail.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch user');
      setUserData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteRecord(recordId: string) {
    if (!userData) return;
    try {
      const res = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete-record',
          userId: userData.user.id,
          recordId,
        }),
      });
      if (!res.ok) throw new Error('Delete failed');
      // Re-fetch user data
      await handleSearch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  async function handleAddCredits(type: 'generate' | 'grade', count: number) {
    if (!userData) return;
    try {
      const res = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-credits',
          userId: userData.user.id,
          type,
          count,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Credit adjustment failed');
      // Re-fetch user data
      await handleSearch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Credit adjustment failed');
    }
  }

  // Loading auth check
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    );
  }

  // Access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6 text-center">
            <ShieldAlert className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Access Denied</h2>
            <p className="text-sm text-slate-500">
              This page is only accessible to administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Admin Panel</h1>

        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">User Lookup</CardTitle>
            <CardDescription>Search for a user by email to view and manage their account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex gap-2"
            >
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="user@example.com"
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <Button type="submit" disabled={loading || !searchEmail.trim()}>
                <Search className="h-4 w-4 mr-1.5" />
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
            {error}
          </div>
        )}

        {userData && (
          <div className="space-y-6">
            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">User Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium">{userData.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Name</span>
                  <span className="font-medium">{userData.user.name ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Stripe Customer</span>
                  <span className="font-medium">{userData.user.stripeCustomerId ?? 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Created</span>
                  <span className="font-medium">
                    {new Date(userData.user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {userData.children.length > 0 && (
                  <div className="pt-2 border-t">
                    <span className="text-slate-500 block mb-1">Children</span>
                    <div className="flex flex-wrap gap-1.5">
                      {userData.children.map((c) => (
                        <Badge key={c.id} variant="secondary" className="text-xs">
                          {c.name} — Grade {c.grade} ({c.track})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Stats + Credit Adjustment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Usage & Credits</CardTitle>
                <CardDescription>
                  Deleting usage records restores free uses (billing counts records).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Generates</p>
                    <p className="text-2xl font-bold">{userData.usage.generates}</p>
                    <div className="flex gap-1.5 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddCredits('generate', 1)}
                      >
                        <Plus className="h-3 w-3 mr-1" />1
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddCredits('generate', 5)}
                      >
                        <Plus className="h-3 w-3 mr-1" />5
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Grades</p>
                    <p className="text-2xl font-bold">{userData.usage.grades}</p>
                    <div className="flex gap-1.5 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddCredits('grade', 1)}
                      >
                        <Plus className="h-3 w-3 mr-1" />1
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddCredits('grade', 5)}
                      >
                        <Plus className="h-3 w-3 mr-1" />5
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Records */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Usage Records</CardTitle>
                <CardDescription>Last 50 records. Delete individual records to refund.</CardDescription>
              </CardHeader>
              <CardContent>
                {userData.usageRecords.length === 0 ? (
                  <p className="text-sm text-slate-500">No usage records.</p>
                ) : (
                  <div className="space-y-1.5">
                    {userData.usageRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={record.type === 'generate' ? 'default' : 'secondary'}
                            className="text-[10px] w-16 justify-center"
                          >
                            {record.type}
                          </Badge>
                          <span className="text-slate-500 text-xs">
                            {new Date(record.createdAt).toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-400">
                            ${(record.creditsCost / 100).toFixed(2)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteRecord(record.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
