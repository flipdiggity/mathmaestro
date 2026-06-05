'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
