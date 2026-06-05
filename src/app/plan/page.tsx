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
}
interface Period {
  nineWeeks: number;
  topics: TopicRow[];
}
interface GradeBlock {
  grade: number;
  periods: Period[];
}

const NW_LABEL: Record<number, string> = {
  1: '1st Nine Weeks',
  2: '2nd Nine Weeks',
  3: '3rd Nine Weeks',
  4: '4th Nine Weeks',
};

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
                  <div key={p.nineWeeks}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      {NW_LABEL[p.nineWeeks] ?? `Period ${p.nineWeeks}`}
                    </p>
                    <div className="space-y-1">
                      {p.topics.map((t) => (
                        <label
                          key={t.id}
                          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 cursor-pointer transition-colors"
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
                          {t.known ? (
                            <Badge variant="secondary" className="text-[10px]">
                              skip
                            </Badge>
                          ) : t.mastery != null ? (
                            <Badge variant="outline" className="text-[10px]">
                              {Math.round(t.mastery)}%
                            </Badge>
                          ) : null}
                        </label>
                      ))}
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
