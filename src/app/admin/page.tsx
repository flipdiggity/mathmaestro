'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Undo2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types (mirror the /api/admin/* payloads)
// ─────────────────────────────────────────────────────────────────────────────

interface Overview {
  users: number;
  children: number;
  worksheets7d: number;
  graded7d: number;
  openTickets: number;
  lastCronSheetAt: string | null;
}

interface ChildInfo {
  id: string;
  name: string;
  grade: number;
  track: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  stripeCustomerId: string | null;
  createdAt: string;
  children: ChildInfo[];
  usage: { generates: number; grades: number };
}

interface UsageRecordRow {
  id: string;
  type: string;
  creditsCost: number;
  worksheetId: string | null;
  createdAt: string;
}

interface UserDetail {
  user: {
    id: string;
    email: string;
    name: string | null;
    stripeCustomerId: string | null;
    createdAt: string;
  };
  children: ChildInfo[];
  usage: { generates: number; grades: number };
  usageRecords: UsageRecordRow[];
}

interface TicketRow {
  id: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  notes: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

interface AuditRow {
  id: string;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  detailJson: string | null;
  createdAt: string;
}

interface RefundResponse {
  ok: boolean;
  refunded: { userId: string; email: string; type: string; count: number; centsRestored: number };
  stripe: { attempted: boolean; ok?: boolean; refundId?: string; status?: string | null; error?: string };
  usage: { generates: number; grades: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const INPUT_CLS =
  'h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background ' +
  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-ring focus-visible:ring-offset-2';

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

function postJson<T>(url: string, body: unknown, method = 'POST'): Promise<T> {
  return api<T>(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}

function SuccessBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      setOverviewError(null);
      setOverview(await api<Overview>('/api/admin/overview'));
    } catch (e) {
      setOverviewError(e instanceof Error ? e.message : 'Failed to load overview');
    }
  }, []);

  // Admin check on mount (personal mode: always admin; saas: ADMIN_EMAILS).
  useEffect(() => {
    fetch('/api/billing/usage')
      .then((r) => r.json())
      .then((data) => setIsAdmin(data.isAdmin === true))
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    if (isAdmin) loadOverview();
  }, [isAdmin, loadOverview]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    );
  }

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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Users, support tickets, refunds and maintenance.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadOverview}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>

        {overviewError && (
          <div className="mb-4">
            <ErrorBox message={overviewError} />
          </div>
        )}

        <OverviewCards overview={overview} />

        <Tabs defaultValue="users" className="mt-8">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="tickets">
              Tickets
              {overview && overview.openTickets > 0 ? ` (${overview.openTickets})` : ''}
            </TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4">
            <UsersTab />
          </TabsContent>
          <TabsContent value="tickets" className="mt-4">
            <TicketsTab onChanged={loadOverview} />
          </TabsContent>
          <TabsContent value="audit" className="mt-4">
            <AuditTab />
          </TabsContent>
          <TabsContent value="maintenance" className="mt-4">
            <MaintenanceTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview cards
// ─────────────────────────────────────────────────────────────────────────────

function OverviewCards({ overview }: { overview: Overview | null }) {
  const stats: Array<{ label: string; value: number | undefined }> = [
    { label: 'Users', value: overview?.users },
    { label: 'Children', value: overview?.children },
    { label: 'Worksheets (7d)', value: overview?.worksheets7d },
    { label: 'Graded (7d)', value: overview?.graded7d },
    { label: 'Open tickets', value: overview?.openTickets },
  ];

  const last = overview?.lastCronSheetAt ?? null;
  const healthy = last !== null && Date.now() - new Date(last).getTime() < 26 * 60 * 60 * 1000;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{s.value ?? '—'}</p>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="p-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-wide">Daily generation</p>
          <div className="mt-1.5 flex flex-col items-start gap-1">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                overview
                  ? healthy
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  overview ? (healthy ? 'bg-emerald-500' : 'bg-red-500') : 'bg-slate-400'
                }`}
              />
              {overview ? (healthy ? 'Healthy' : 'Stale') : '—'}
            </span>
            <span className="text-[11px] text-slate-500">
              last sheet: {overview ? timeAgo(last) : '—'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Users tab
// ─────────────────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setListError(null);
      const data = await api<{ users: UserRow[] }>('/api/admin/users');
      setUsers(data.users);
    } catch (e) {
      setListError(e instanceof Error ? e.message : 'Failed to load users');
    }
  }, []);

  const loadDetail = useCallback(async (email: string) => {
    setDetailLoading(true);
    try {
      setDetail(await api<UserDetail>(`/api/admin/users?email=${encodeURIComponent(email)}`));
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Failed to load user');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function refreshAll() {
    await loadUsers();
    if (selectedEmail) await loadDetail(selectedEmail);
  }

  function selectUser(email: string) {
    setSelectedEmail(email);
    setActionMsg(null);
    setActionErr(null);
    loadDetail(email);
  }

  async function grantCredits(type: 'generate' | 'grade', count: number) {
    if (!detail) return;
    setActionMsg(null);
    setActionErr(null);
    try {
      const res = await postJson<{ success: boolean; deleted: number }>('/api/admin/credits', {
        action: 'add-credits',
        userId: detail.user.id,
        type,
        count,
      });
      setActionMsg(
        res.deleted > 0
          ? `Granted ${res.deleted} ${type} credit(s) (removed ${res.deleted} consumed record(s)).`
          : `No consumed ${type} records to remove — nothing to grant back.`
      );
      await refreshAll();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Credit adjustment failed');
    }
  }

  async function deleteRecord(recordId: string) {
    if (!detail) return;
    setActionMsg(null);
    setActionErr(null);
    try {
      await postJson('/api/admin/credits', {
        action: 'delete-record',
        userId: detail.user.id,
        recordId,
      });
      setActionMsg('Usage record deleted.');
      await refreshAll();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-6">
      {listError && <ErrorBox message={listError} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users</CardTitle>
          <CardDescription>All accounts, newest first. Select one to manage.</CardDescription>
        </CardHeader>
        <CardContent>
          {users === null ? (
            <p className="text-sm text-slate-500">{listError ? 'Could not load users.' : 'Loading users...'}</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-500">No users.</p>
          ) : (
            <div className="space-y-1.5">
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${
                    selectedEmail === u.email ? 'border-indigo-300 bg-indigo-50/50' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {u.email}
                      {u.name ? <span className="text-slate-400 font-normal"> · {u.name}</span> : null}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {u.children.length} child{u.children.length === 1 ? '' : 'ren'} ·{' '}
                      {u.usage.generates} generates · {u.usage.grades} grades · joined{' '}
                      {new Date(u.createdAt).toLocaleDateString()}
                      {u.stripeCustomerId ? ' · card on file' : ''}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => selectUser(u.email)}>
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEmail && (
        <div className="space-y-4">
          {actionErr && <ErrorBox message={actionErr} />}
          {actionMsg && <SuccessBox message={actionMsg} />}

          {detailLoading && !detail ? (
            <p className="text-sm text-slate-500">Loading user...</p>
          ) : detail ? (
            <>
              {/* User info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{detail.user.email}</CardTitle>
                  <CardDescription>User ID: {detail.user.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Name</span>
                    <span className="font-medium">{detail.user.name ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Stripe customer</span>
                    <span className="font-medium">{detail.user.stripeCustomerId ?? 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Created</span>
                    <span className="font-medium">
                      {new Date(detail.user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {detail.children.length > 0 && (
                    <div className="pt-2 border-t">
                      <span className="text-slate-500 block mb-1">Children</span>
                      <div className="flex flex-wrap gap-1.5">
                        {detail.children.map((c) => (
                          <Badge key={c.id} variant="secondary" className="text-xs">
                            {c.name} — Grade {c.grade} ({c.track})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Usage + credit grants */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Usage &amp; Credits</CardTitle>
                  <CardDescription>
                    Net consumption (uses minus refunds). Granting removes consumed records;
                    refunds below add offsetting records instead.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {(['generate', 'grade'] as const).map((type) => (
                      <div key={type} className="rounded-lg border p-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">
                          {type === 'generate' ? 'Generates' : 'Grades'}
                        </p>
                        <p className="text-2xl font-bold">
                          {type === 'generate' ? detail.usage.generates : detail.usage.grades}
                        </p>
                        <div className="flex gap-1.5 mt-2">
                          <Button size="sm" variant="outline" onClick={() => grantCredits(type, 1)}>
                            <Plus className="h-3 w-3 mr-1" />1
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => grantCredits(type, 5)}>
                            <Plus className="h-3 w-3 mr-1" />5
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Refund */}
              <RefundForm
                userId={detail.user.id}
                onDone={(msg) => {
                  setActionErr(null);
                  setActionMsg(msg);
                  refreshAll();
                }}
                onError={(msg) => {
                  setActionMsg(null);
                  setActionErr(msg);
                }}
              />

              {/* Usage records */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Usage Records</CardTitle>
                  <CardDescription>
                    Last 50 ledger rows. Negative amounts are refunds. Deleting a row removes it
                    from the count entirely.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {detail.usageRecords.length === 0 ? (
                    <p className="text-sm text-slate-500">No usage records.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {detail.usageRecords.map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={record.creditsCost < 0 ? 'outline' : record.type === 'generate' ? 'default' : 'secondary'}
                              className={`text-[10px] w-24 justify-center ${
                                record.creditsCost < 0
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : ''
                              }`}
                            >
                              {record.creditsCost < 0 ? `${record.type} refund` : record.type}
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
                            onClick={() => deleteRecord(record.id)}
                            title="Delete record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

function RefundForm({
  userId,
  onDone,
  onError,
}: {
  userId: string;
  onDone: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [type, setType] = useState<'generate' | 'grade'>('generate');
  const [count, setCount] = useState('1');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(count, 10);
    if (!Number.isInteger(n) || n < 1) {
      onError('Refund count must be a positive integer.');
      return;
    }
    if (!reason.trim()) {
      onError('A reason is required for refunds.');
      return;
    }
    setBusy(true);
    try {
      const res = await postJson<RefundResponse>('/api/admin/refund', {
        userId,
        type,
        count: n,
        reason: reason.trim(),
      });
      let msg = `Refunded ${res.refunded.count} ${res.refunded.type} use(s) — usage is now ${res.usage.generates} generates / ${res.usage.grades} grades.`;
      if (res.stripe.attempted) {
        msg += res.stripe.ok
          ? ` Stripe refund ${res.stripe.refundId} (${res.stripe.status}).`
          : ` Stripe refund FAILED: ${res.stripe.error}`;
      }
      onDone(msg);
      setCount('1');
      setReason('');
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Refund failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Refund</CardTitle>
        <CardDescription>
          Restores allowance by adding negative usage records (auditable — the ledger keeps both
          the use and the refund).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'generate' | 'grade')}
              className={INPUT_CLS}
            >
              <option value="generate">generate</option>
              <option value="grade">grade</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Count
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className={`${INPUT_CLS} w-24`}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-600 flex-1 min-w-[220px]">
            Reason
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. grading misread the photo"
              className={INPUT_CLS}
            />
          </label>
          <Button type="submit" disabled={busy || !reason.trim()}>
            <Undo2 className="h-4 w-4 mr-1.5" />
            {busy ? 'Refunding...' : 'Refund'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tickets tab
// ─────────────────────────────────────────────────────────────────────────────

function TicketsTab({ onChanged }: { onChanged: () => void }) {
  const [tickets, setTickets] = useState<TicketRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api<{ tickets: TicketRow[] }>('/api/admin/tickets');
      setTickets(data.tickets);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tickets');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(ticket: TicketRow) {
    if (expandedId === ticket.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(ticket.id);
    setNotesDraft(ticket.notes ?? '');
  }

  async function update(ticketId: string, patch: { status?: string; notes?: string }) {
    setBusyId(ticketId);
    setError(null);
    try {
      await postJson('/api/admin/tickets', { ticketId, ...patch }, 'PATCH');
      await load();
      onChanged(); // refresh the open-ticket count in the overview
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update ticket');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && <ErrorBox message={error} />}

      {tickets === null ? (
        !error && <p className="text-sm text-slate-500">Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">No support tickets yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => {
            const expanded = expandedId === t.id;
            const open = t.status === 'open';
            return (
              <Card key={t.id}>
                <button
                  type="button"
                  onClick={() => toggle(t)}
                  className="w-full text-left px-4 py-3 flex flex-wrap items-center gap-2"
                >
                  <Badge
                    variant="outline"
                    className={
                      open
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }
                  >
                    {t.status}
                  </Badge>
                  <span className="font-medium text-sm text-slate-900 flex-1 min-w-[160px] truncate">
                    {t.subject}
                  </span>
                  <span className="text-xs text-slate-500">{t.email}</span>
                  <span className="text-xs text-slate-400">{timeAgo(t.createdAt)}</span>
                  {expanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {expanded && (
                  <CardContent className="pt-0 space-y-3">
                    <div className="rounded-md bg-slate-50 border px-3 py-2">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{t.message}</p>
                    </div>
                    <p className="text-xs text-slate-400">
                      Ticket {t.id} · created {new Date(t.createdAt).toLocaleString()}
                      {t.resolvedAt ? ` · resolved ${new Date(t.resolvedAt).toLocaleString()}` : ''}
                    </p>
                    <div>
                      <label className="text-xs text-slate-600 block mb-1">Internal notes</label>
                      <textarea
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        rows={3}
                        placeholder="Notes for future you..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === t.id}
                        onClick={() => update(t.id, { notes: notesDraft })}
                      >
                        Save notes
                      </Button>
                      {open ? (
                        <Button
                          size="sm"
                          disabled={busyId === t.id}
                          onClick={() => update(t.id, { status: 'resolved', notes: notesDraft })}
                        >
                          {busyId === t.id ? 'Saving...' : 'Resolve'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === t.id}
                          onClick={() => update(t.id, { status: 'open' })}
                        >
                          Reopen
                        </Button>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit tab
// ─────────────────────────────────────────────────────────────────────────────

function prettyDetail(detailJson: string | null): string | null {
  if (!detailJson) return null;
  try {
    return JSON.stringify(JSON.parse(detailJson), null, 2);
  } catch {
    return detailJson;
  }
}

function AuditTab() {
  const [entries, setEntries] = useState<AuditRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ entries: AuditRow[] }>('/api/admin/audit')
      .then((data) => setEntries(data.entries))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load audit log'));
  }, []);

  return (
    <div className="space-y-4">
      {error && <ErrorBox message={error} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Log</CardTitle>
          <CardDescription>Last 100 admin actions (refunds, credits, tickets).</CardDescription>
        </CardHeader>
        <CardContent>
          {entries === null ? (
            <p className="text-sm text-slate-500">{error ? 'Could not load audit log.' : 'Loading audit log...'}</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-slate-500">No audit entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-slate-500 uppercase tracking-wide">
                    <th className="py-2 pr-4 font-medium">Time</th>
                    <th className="py-2 pr-4 font-medium">Actor</th>
                    <th className="py-2 pr-4 font-medium">Action</th>
                    <th className="py-2 pr-4 font-medium">Target</th>
                    <th className="py-2 font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => {
                    const detail = prettyDetail(e.detailJson);
                    return (
                      <tr key={e.id} className="border-b last:border-0 align-top">
                        <td className="py-2 pr-4 whitespace-nowrap text-xs text-slate-500">
                          {new Date(e.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4 text-xs">{e.actorEmail ?? '—'}</td>
                        <td className="py-2 pr-4">
                          <Badge variant="secondary" className="text-[10px]">
                            {e.action}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4 text-xs text-slate-600 whitespace-nowrap">
                          {e.targetType ? `${e.targetType}: ` : ''}
                          {e.targetId ?? '—'}
                        </td>
                        <td className="py-2 text-xs">
                          {detail ? (
                            <details>
                              <summary className="cursor-pointer text-indigo-600 select-none">
                                view
                              </summary>
                              <pre className="mt-1 max-w-md whitespace-pre-wrap break-all rounded bg-slate-50 border p-2 text-[11px] text-slate-700">
                                {detail}
                              </pre>
                            </details>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Maintenance tab
// ─────────────────────────────────────────────────────────────────────────────

function MaintenanceTab() {
  return (
    <div className="space-y-4">
      <MaintenanceAction
        title="Clean up orphaned mastery rows"
        description="Deletes TopicMastery rows whose topicId is no longer in the current curriculum pool (leftovers from older topic-ID schemes). Safe: these rows are already ignored by topic selection."
        url="/api/admin/cleanup-mastery"
      />
      <MaintenanceAction
        title="Dedupe children"
        description="Removes duplicate child rows (same name added more than once), keeping the one with the most graded history. Children with any graded worksheets are never auto-deleted."
        url="/api/admin/dedupe-children"
      />
    </div>
  );
}

function MaintenanceAction({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url: string;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await api(url, { method: 'POST' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
        <div className="space-y-1.5">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={run} disabled={busy}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${busy ? 'animate-spin' : ''}`} />
          {busy ? 'Running...' : 'Run'}
        </Button>
      </CardHeader>
      {(result !== null || error) && (
        <CardContent className="pt-0">
          {error && <ErrorBox message={error} />}
          {result !== null && (
            <pre className="rounded-md bg-slate-50 border p-3 text-xs text-slate-700 overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </CardContent>
      )}
    </Card>
  );
}
