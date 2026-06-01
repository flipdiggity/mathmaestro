'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GradingQuestionResult } from '@/types';

interface GradingResultsProps {
  gradingResultId?: string;
  results: GradingQuestionResult[];
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
}

function getScoreColor(percent: number): string {
  if (percent >= 80) return 'text-green-600';
  if (percent >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreBg(percent: number): string {
  if (percent >= 80) return 'bg-green-50 border-green-200';
  if (percent >= 60) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
}

function getScoreBadgeVariant(
  percent: number
): 'default' | 'secondary' | 'destructive' {
  if (percent >= 80) return 'default';
  if (percent >= 60) return 'secondary';
  return 'destructive';
}

export function GradingResults({
  gradingResultId,
  results,
  totalQuestions,
}: GradingResultsProps) {
  // Editable working copy + the AI's original grading (to compute overrides).
  const [items, setItems] = useState<GradingQuestionResult[]>(results);
  const [original] = useState<GradingQuestionResult[]>(results);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const liveCorrect = items.filter((r) => r.isCorrect).length;
  const livePercent = totalQuestions === 0 ? 0 : Math.round((liveCorrect / totalQuestions) * 100);

  const dirtyNumbers = useMemo(() => {
    const origMap = new Map(original.map((r) => [r.number, r.isCorrect]));
    return items.filter((r) => origMap.get(r.number) !== r.isCorrect).map((r) => r.number);
  }, [items, original]);
  const isDirty = dirtyNumbers.length > 0;

  function toggle(number: number) {
    setSavedAt(null);
    setItems((prev) =>
      prev.map((r) => (r.number === number ? { ...r, isCorrect: !r.isCorrect } : r))
    );
  }

  async function save() {
    if (!gradingResultId || !isDirty) return;
    setSaving(true);
    setSaveError(null);
    try {
      const overrides = items
        .filter((r) => dirtyNumbers.includes(r.number))
        .map((r) => ({ number: r.number, isCorrect: r.isCorrect }));
      const res = await fetch('/api/grade/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gradingResultId, overrides }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save corrections');
      if (data.gradingResult?.results) setItems(data.gradingResult.results);
      setSavedAt(Date.now());
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save corrections');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Score summary */}
      <Card className={`${getScoreBg(livePercent)} border`}>
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center gap-2">
            <div className={`text-5xl font-bold ${getScoreColor(livePercent)}`}>
              {liveCorrect}/{totalQuestions}
            </div>
            <Badge variant={getScoreBadgeVariant(livePercent)} className="text-base px-4 py-1">
              {livePercent}%
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              {livePercent >= 80
                ? 'Great work!'
                : livePercent >= 60
                  ? 'Good effort, keep practicing!'
                  : 'Needs more practice on these topics.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {gradingResultId && (
        <p className="text-xs text-muted-foreground -mt-2">
          Disagree with a mark? Tap <span className="font-medium">Mark right</span> / <span className="font-medium">Mark wrong</span> on any
          question, then save — your corrections (not the AI&apos;s) drive what gets practiced next.
        </p>
      )}

      {/* Individual results */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Question Details
        </h3>
        {items.map((result) => {
          const overridden = dirtyNumbers.includes(result.number);
          return (
            <Card key={result.number} className={`overflow-hidden ${overridden ? 'ring-1 ring-indigo-300' : ''}`}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-sm font-medium leading-normal">
                    <span className="text-muted-foreground mr-2">Q{result.number}.</span>
                    {result.question}
                  </CardTitle>
                  <div className="shrink-0 mt-0.5">
                    {result.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Student answer: </span>
                    <span className={result.isCorrect ? 'font-medium text-green-700' : 'font-medium text-red-600'}>
                      {result.studentAnswer || '(no answer)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Correct answer: </span>
                    <span className="font-medium text-green-700">{result.correctAnswer}</span>
                  </div>
                </div>
                {!result.isCorrect && result.feedback && (
                  <p className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                    {result.feedback}
                  </p>
                )}
                {gradingResultId && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => toggle(result.number)}
                    >
                      {result.isCorrect ? 'Mark wrong' : 'Mark right'}
                    </Button>
                    {overridden && (
                      <span className="ml-2 text-xs text-indigo-600">overridden — unsaved</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Save bar */}
      {gradingResultId && (isDirty || savedAt) && (
        <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-lg border bg-background/95 backdrop-blur px-4 py-3 shadow">
          <div className="text-sm">
            {saveError ? (
              <span className="text-destructive">{saveError}</span>
            ) : isDirty ? (
              <span className="text-muted-foreground">
                {dirtyNumbers.length} correction{dirtyNumbers.length === 1 ? '' : 's'} not yet saved
              </span>
            ) : (
              <span className="text-green-600">Corrections saved — practice plan updated.</span>
            )}
          </div>
          {isDirty && (
            <Button onClick={save} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save corrections'
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
