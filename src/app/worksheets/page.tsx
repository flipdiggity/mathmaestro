'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Question } from '@/types';

interface Child {
  id: string;
  name: string;
  grade: number;
}

interface GradingResult {
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
}

interface Worksheet {
  id: string;
  title: string;
  dayOfWeek: string | null;
  status: string;
  questionsJson: string;
  createdAt: string;
  gradingResult: GradingResult | null;
}

interface WeekGroup {
  label: string;
  worksheets: Worksheet[];
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = weekStart.toLocaleDateString(undefined, opts);
  const endStr = weekEnd.toLocaleDateString(undefined, {
    ...opts,
    year: 'numeric',
  });
  return `${startStr} – ${endStr}`;
}

function groupByWeek(worksheets: Worksheet[]): WeekGroup[] {
  const groups = new Map<string, { weekStart: Date; worksheets: Worksheet[] }>();

  for (const ws of worksheets) {
    const weekStart = getWeekStart(new Date(ws.createdAt));
    const key = weekStart.toISOString();
    if (!groups.has(key)) {
      groups.set(key, { weekStart, worksheets: [] });
    }
    groups.get(key)!.worksheets.push(ws);
  }

  return Array.from(groups.values())
    .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime())
    .map((g) => ({
      label: formatWeekLabel(g.weekStart),
      worksheets: g.worksheets,
    }));
}

function getQuestions(ws: Worksheet): Question[] {
  try {
    return JSON.parse(ws.questionsJson);
  } catch {
    return [];
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function WorksheetHistoryContent() {
  const searchParams = useSearchParams();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [isLoadingWorksheets, setIsLoadingWorksheets] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChildren() {
      try {
        const res = await fetch('/api/children');
        const data = await res.json();
        setChildren(data.children ?? []);

        const childParam = searchParams.get('child');
        if (childParam) {
          const match = (data.children ?? []).find(
            (c: Child) => c.id === childParam
          );
          if (match) setSelectedChildId(match.id);
        }
      } catch {
        // silently fail
      } finally {
        setIsLoadingChildren(false);
      }
    }
    fetchChildren();
  }, [searchParams]);

  useEffect(() => {
    if (!selectedChildId) {
      setWorksheets([]);
      return;
    }

    async function fetchWorksheets() {
      setIsLoadingWorksheets(true);
      try {
        const res = await fetch(
          `/api/children/${selectedChildId}/worksheets`
        );
        const data = await res.json();
        setWorksheets(data.worksheets ?? []);
      } catch {
        // silently fail
      } finally {
        setIsLoadingWorksheets(false);
      }
    }
    fetchWorksheets();
  }, [selectedChildId]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleDownloadPdf = useCallback(async (ws: Worksheet) => {
    setDownloadingId(ws.id);
    try {
      const res = await fetch(`/api/worksheets/${ws.id}/pdf`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ws.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const handleDownloadAll = useCallback(
    async (group: WeekGroup) => {
      for (const ws of group.worksheets) {
        await handleDownloadPdf(ws);
      }
    },
    [handleDownloadPdf]
  );

  const weekGroups = groupByWeek(worksheets);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Worksheet History</h1>

        {/* Child selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Select Child</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingChildren ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : children.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No children found. Add a child first.
              </p>
            ) : (
              <Select
                value={selectedChildId}
                onValueChange={setSelectedChildId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a child..." />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name} (Grade {child.grade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Worksheets */}
        {selectedChildId && (
          <>
            {isLoadingWorksheets ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading worksheets...
              </div>
            ) : worksheets.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-lg">No worksheets yet</p>
                <p className="text-sm mt-1">
                  Generate some worksheets to see them here.
                </p>
                <Link href={`/generate?child=${selectedChildId}`}>
                  <Button className="mt-4">Generate Worksheet</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {weekGroups.map((group) => (
                  <div key={group.label}>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                        {group.label}
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadAll(group)}
                        className="text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download All
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {group.worksheets.map((ws) => {
                        const isExpanded = expandedId === ws.id;
                        const questions = getQuestions(ws);
                        const isDownloading = downloadingId === ws.id;

                        return (
                          <Card key={ws.id}>
                            <button
                              type="button"
                              onClick={() => toggleExpanded(ws.id)}
                              className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors rounded-xl"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {ws.title}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  {ws.dayOfWeek && `${ws.dayOfWeek} · `}
                                  {formatDate(ws.createdAt)} ·{' '}
                                  {questions.length} questions
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {ws.gradingResult ? (
                                  <Badge
                                    variant={
                                      ws.gradingResult.scorePercent >= 80
                                        ? 'default'
                                        : ws.gradingResult.scorePercent >= 60
                                          ? 'secondary'
                                          : 'destructive'
                                    }
                                  >
                                    {ws.gradingResult.correctCount}/
                                    {ws.gradingResult.totalQuestions} (
                                    {Math.round(ws.gradingResult.scorePercent)}
                                    %)
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">{ws.status}</Badge>
                                )}
                              </div>
                            </button>

                            {isExpanded && (
                              <CardContent className="pt-0 pb-4 px-4">
                                <div className="border-t pt-3 space-y-4">
                                  {/* Actions */}
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDownloadPdf(ws)}
                                      disabled={isDownloading}
                                    >
                                      {isDownloading ? (
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                      ) : (
                                        <Download className="h-3 w-3 mr-1" />
                                      )}
                                      Download PDF
                                    </Button>
                                    {ws.status !== 'graded' && (
                                      <Link
                                        href={`/grade?child=${selectedChildId}&worksheet=${ws.id}`}
                                      >
                                        <Button variant="outline" size="sm">
                                          Grade
                                        </Button>
                                      </Link>
                                    )}
                                  </div>

                                  {/* Questions list */}
                                  {questions.length > 0 && (
                                    <div className="space-y-2">
                                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Questions & Answers
                                      </h3>
                                      <div className="space-y-1.5">
                                        {questions.map((q) => (
                                          <div
                                            key={q.number}
                                            className="flex items-start gap-3 p-2 bg-slate-50 rounded-md text-sm"
                                          >
                                            <span className="text-xs font-mono text-slate-400 mt-0.5 w-6 shrink-0 text-right">
                                              {q.number}.
                                            </span>
                                            <div className="flex-1 min-w-0">
                                              <div className="text-slate-700">
                                                {q.question}
                                              </div>
                                              <div className="text-xs text-slate-400 mt-0.5">
                                                Answer: {q.answer}
                                                {q.topicName && (
                                                  <span className="ml-2">
                                                    · {q.topicName}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function WorksheetHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-400">
          Loading...
        </div>
      }
    >
      <WorksheetHistoryContent />
    </Suspense>
  );
}
