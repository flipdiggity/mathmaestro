'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface GradingResult {
  id: string;
  worksheetId: string;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  createdAt: string;
}

interface Worksheet {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  gradingResult: GradingResult | null;
}

interface TopicMastery {
  id: string;
  topicId: string;
  topicName: string;
  gradeLevel: number;
  mastery: number;
  timesPracticed: number;
  lastPracticedAt: string | null;
  lastScore: number | null;
}

export interface ChildData {
  id: string;
  name: string;
  grade: number;
  track: string;
  targetTestDate: string | null;
  worksheets: Worksheet[];
  topicMastery: TopicMastery[];
}

function getDaysUntilTest(targetTestDate: string): number {
  const now = new Date();
  const target = new Date(targetTestDate);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getUrgencyBadgeVariant(days: number): 'destructive' | 'default' | 'secondary' | 'outline' {
  if (days <= 7) return 'destructive';
  if (days <= 14) return 'default';
  return 'secondary';
}

function getScoreBadgeClass(score: number): string {
  if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 75) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

function formatTrack(track: string): string {
  return track.charAt(0).toUpperCase() + track.slice(1);
}

export function ChildCard({ child }: { child: ChildData }) {
  const gradedWorksheets = child.worksheets.filter((w) => w.gradingResult);
  const recentScores = gradedWorksheets
    .slice(0, 5)
    .map((w) => w.gradingResult!.scorePercent);

  const topicCount = child.topicMastery.length;
  const practicedCount = child.topicMastery.filter((t) => t.timesPracticed > 0).length;
  const averageMastery =
    topicCount > 0
      ? Math.round(child.topicMastery.reduce((sum, t) => sum + t.mastery, 0) / topicCount)
      : 0;

  const daysUntilTest = child.targetTestDate
    ? getDaysUntilTest(child.targetTestDate)
    : null;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{child.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Grade {child.grade}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {formatTrack(child.track)}
              </Badge>
            </CardDescription>
          </div>
          {daysUntilTest !== null && (
            <Badge variant={getUrgencyBadgeVariant(daysUntilTest)} className="shrink-0">
              <span className={daysUntilTest < 0 ? 'text-slate-500' : ''}>
                {daysUntilTest < 0
                  ? 'Test passed'
                  : daysUntilTest === 0
                    ? 'Test today!'
                    : `${daysUntilTest}d to test`}
              </span>
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Recent Scores */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Recent Scores</p>
          {recentScores.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {recentScores.map((score, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className={`text-xs font-mono ${getScoreBadgeClass(score)}`}
                >
                  {Math.round(score)}%
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No graded worksheets yet</p>
          )}
        </div>

        {/* Average Mastery */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-medium text-slate-700">Average Mastery</p>
            <span className="text-sm font-mono text-slate-600">{averageMastery}%</span>
          </div>
          <Progress value={averageMastery} className="h-2" />
        </div>

        {/* Topics Practiced */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Topics Practiced</p>
          <span className="text-sm text-slate-600">
            {practicedCount} / {topicCount}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-2">
        <Button asChild size="sm" className="flex-1">
          <Link href={`/generate?child=${child.id}`}>Generate</Link>
        </Button>
        <Button asChild size="sm" variant="secondary" className="flex-1">
          <Link href={`/grade?child=${child.id}`}>Grade</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="flex-1">
          <Link href={`/progress/${child.id}`}>Progress</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
