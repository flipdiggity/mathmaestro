'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, CalendarClock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PlanInfo {
  planEnd: string | null;
  weekdaysLeft: number | null;
  totalTopics: number;
  advancedTopics: number;
  remaining: number;
  paceNeeded: number | null;
  achievablePace: number;
  onTrack: boolean | null;
  projectedFinishWeekdays: number | null;
  frontierTopicName: string | null;
}
interface CourseInfo {
  id: string;
  label: string;
  description: string;
}

function PlanStatusCard({ childId, childName }: { childId: string; childName: string }) {
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/children/${childId}/plan`);
      const data = await res.json();
      setPlan(data.plan ?? null);
      setCourse(data.course ?? null);
      setCourses(data.courses ?? []);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    load();
  }, [load]);

  async function update(body: { planEndDate?: string | null; courseId?: string }) {
    setSaving(true);
    try {
      await fetch(`/api/children/${childId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading plan…
        </CardContent>
      </Card>
    );
  }
  if (!plan) return null;

  const pct = plan.totalTopics > 0 ? Math.round((plan.advancedTopics / plan.totalTopics) * 100) : 0;
  const endDateInput = plan.planEnd ? plan.planEnd.slice(0, 10) : '';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-indigo-600" />
            {course ? course.label : `${childName}'s plan`}
          </CardTitle>
          {plan.onTrack != null && (
            <Badge className={plan.onTrack ? 'bg-green-600' : 'bg-red-600'}>
              {plan.onTrack ? 'On pace' : 'Behind pace'}
            </Badge>
          )}
        </div>
        {course && <p className="text-xs text-muted-foreground mt-1">{course.description}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5 text-sm">
            <span className="font-medium text-slate-700">
              {plan.advancedTopics} of {plan.totalTopics} topics covered
            </span>
            <span className="font-mono text-slate-600">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
          {plan.frontierTopicName && (
            <p className="text-xs text-muted-foreground mt-1.5">
              Up next: <span className="font-medium text-slate-700">{plan.frontierTopicName}</span>
            </p>
          )}
        </div>

        {plan.planEnd && plan.paceNeeded != null ? (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted/60 p-2">
              <p className="text-lg font-bold">{plan.remaining}</p>
              <p className="text-[11px] text-muted-foreground">topics left</p>
            </div>
            <div className="rounded-lg bg-muted/60 p-2">
              <p className="text-lg font-bold">{plan.weekdaysLeft}</p>
              <p className="text-[11px] text-muted-foreground">school days left</p>
            </div>
            <div className="rounded-lg bg-muted/60 p-2">
              <p className="text-lg font-bold">{Math.round((plan.paceNeeded ?? 0) * 10) / 10}</p>
              <p className="text-[11px] text-muted-foreground">topics/day needed</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No finish-by date set — sheets advance at the default pace. Set a date to pace the
            plan (e.g. the first day of school).
          </p>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-muted-foreground flex flex-col gap-1">
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" /> Finish by
            </span>
            <input
              type="date"
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              value={endDateInput}
              disabled={saving}
              onChange={(e) => update({ planEndDate: e.target.value || null })}
            />
          </label>
          <label className="text-xs text-muted-foreground flex flex-col gap-1 flex-1 min-w-[220px]">
            <span>Course</span>
            <Select
              value={course?.id ?? ''}
              onValueChange={(v) => update({ courseId: v })}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Standard grade sequence" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

interface Child {
  id: string;
  name: string;
  grade: number;
}
interface TopicRow {
  id: string;
  name: string;
  strand: string;
  order: number;
  mastery: number | null;
  known: boolean;
  correct: number;
  total: number;
  upNext: boolean;
}
interface Period {
  semester: number;
  label: string;
  topics: TopicRow[];
}
interface GradeBlock {
  grade: number;
  periods: Period[];
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function PlanPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [curriculum, setCurriculum] = useState<GradeBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/children');
      const data = await res.json();
      const list: Child[] = (data.children ?? []).map((c: Child) => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
      }));
      setChildren(list);
      if (list.length > 0) setSelectedChildId(list[0].id);
    })();
  }, []);

  const loadCurriculum = useCallback(async (childId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/children/${childId}/curriculum`);
      const data = await res.json();
      setCurriculum(data.curriculum ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId) loadCurriculum(selectedChildId);
  }, [selectedChildId, loadCurriculum]);

  async function toggle(topicId: string, known: boolean) {
    setSaving((s) => new Set(s).add(topicId));
    // optimistic
    setCurriculum((cur) =>
      cur.map((g) => ({
        ...g,
        periods: g.periods.map((p) => ({
          ...p,
          topics: p.topics.map((t) =>
            t.id === topicId ? { ...t, known, mastery: known ? 100 : null } : t
          ),
        })),
      }))
    );
    try {
      await fetch(`/api/children/${selectedChildId}/curriculum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, known }),
      });
    } finally {
      setSaving((s) => {
        const n = new Set(s);
        n.delete(topicId);
        return n;
      });
    }
  }

  const selectedChild = children.find((c) => c.id === selectedChildId);

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Learning Plan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Check off what {selectedChild?.name ?? 'your child'} already knows so worksheets skip
            ahead to new material. Graded worksheets keep this up to date automatically — this is for
            jumping past things they&apos;ve already got.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Child</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a child..." />
              </SelectTrigger>
              <SelectContent>
                {children.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} — Grade {c.grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedChildId && (
          <PlanStatusCard
            key={selectedChildId}
            childId={selectedChildId}
            childName={selectedChild?.name ?? 'your child'}
          />
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading curriculum…
          </div>
        ) : (
          curriculum.map((g) => (
            <Card key={g.grade}>
              <CardHeader>
                <CardTitle className="text-base">{ordinal(g.grade)} Grade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {g.periods.map((p) => (
                  <div key={p.semester}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      {p.label}
                    </p>
                    <div className="space-y-1">
                      {p.topics.map((t) => {
                        const pct = t.total > 0 ? Math.round((t.correct / t.total) * 100) : null;
                        const scoreColor =
                          pct == null ? '' : pct >= 80 ? 'text-green-600 border-green-300'
                            : pct >= 60 ? 'text-amber-600 border-amber-300' : 'text-red-600 border-red-300';
                        return (
                          <label
                            key={t.id}
                            className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 cursor-pointer transition-colors ${t.upNext ? 'bg-indigo-50 ring-1 ring-indigo-200' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={t.known}
                              disabled={saving.has(t.id)}
                              onChange={(e) => toggle(t.id, e.target.checked)}
                              className="h-4 w-4 rounded border-input accent-primary"
                            />
                            <span className={`flex-1 ${t.known ? 'text-muted-foreground line-through' : ''}`}>
                              {t.name}
                            </span>
                            {t.upNext && (
                              <Badge className="text-[10px] bg-indigo-600">Up next</Badge>
                            )}
                            {/* Real score from graded homework */}
                            {pct != null && (
                              <Badge variant="outline" className={`text-[10px] ${scoreColor}`}>
                                {t.correct}/{t.total} · {pct}%
                              </Badge>
                            )}
                            {t.known && (
                              <Badge variant="secondary" className="text-[10px]">
                                skip
                              </Badge>
                            )}
                            {pct == null && !t.known && (
                              <span className="text-[10px] text-muted-foreground">not yet</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}

        <p className="text-xs text-muted-foreground">
          Checking a topic marks it as already known, so it won&apos;t be taught as new — it may still
          reappear occasionally as a quick (harder) refresher. Uncheck to put it back in the queue.
        </p>
      </div>
    </div>
  );
}
