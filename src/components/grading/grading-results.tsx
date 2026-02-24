'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GradingQuestionResult } from '@/types';

interface GradingResultsProps {
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
  results,
  totalQuestions,
  correctCount,
  scorePercent,
}: GradingResultsProps) {
  const roundedPercent = Math.round(scorePercent);

  return (
    <div className="space-y-6">
      {/* Score summary */}
      <Card className={`${getScoreBg(roundedPercent)} border`}>
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center gap-2">
            <div className={`text-5xl font-bold ${getScoreColor(roundedPercent)}`}>
              {correctCount}/{totalQuestions}
            </div>
            <Badge
              variant={getScoreBadgeVariant(roundedPercent)}
              className="text-base px-4 py-1"
            >
              {roundedPercent}%
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              {roundedPercent >= 80
                ? 'Great work!'
                : roundedPercent >= 60
                  ? 'Good effort, keep practicing!'
                  : 'Needs more practice on these topics.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Individual results */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Question Details
        </h3>
        {results.map((result) => (
          <Card key={result.number} className="overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-sm font-medium leading-normal">
                  <span className="text-muted-foreground mr-2">
                    Q{result.number}.
                  </span>
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
                  <span
                    className={
                      result.isCorrect
                        ? 'font-medium text-green-700'
                        : 'font-medium text-red-600'
                    }
                  >
                    {result.studentAnswer || '(no answer)'}
                  </span>
                </div>
                {!result.isCorrect && (
                  <div>
                    <span className="text-muted-foreground">Correct answer: </span>
                    <span className="font-medium text-green-700">
                      {result.correctAnswer}
                    </span>
                  </div>
                )}
              </div>
              {!result.isCorrect && result.feedback && (
                <p className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  {result.feedback}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
