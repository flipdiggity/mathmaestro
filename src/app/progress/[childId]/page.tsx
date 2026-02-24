'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MasteryChart } from '@/components/progress/mastery-chart';

interface Child {
  id: string;
  name: string;
  grade: number;
  track: string;
  targetTestDate: string | null;
}

interface MasteryRecord {
  id: string;
  topicId: string;
  topicName: string;
  gradeLevel: number;
  mastery: number;
  timesPracticed: number;
  lastPracticedAt: string | null;
  lastScore: number | null;
}

interface Worksheet {
  id: string;
  title: string;
  dayOfWeek: string | null;
  status: string;
  createdAt: string;
  gradingResult: {
    totalQuestions: number;
    correctCount: number;
    scorePercent: number;
  } | null;
}

export default function ProgressPage() {
  const params = useParams();
  const childId = params.childId as string;

  const [child, setChild] = useState<Child | null>(null);
  const [mastery, setMastery] = useState<MasteryRecord[]>([]);
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [childrenRes, masteryRes, worksheetsRes] = await Promise.all([
          fetch('/api/children'),
          fetch(`/api/children/${childId}/mastery`),
          fetch(`/api/children/${childId}/worksheets`),
        ]);

        const childrenData = await childrenRes.json();
        const masteryData = await masteryRes.json();
        const worksheetsData = await worksheetsRes.json();

        const foundChild = childrenData.children?.find((c: Child) => c.id === childId);
        setChild(foundChild || null);
        setMastery(masteryData.mastery || []);
        setWorksheets(worksheetsData.worksheets || []);
      } catch (error) {
        console.error('Failed to fetch progress data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [childId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-500">Child not found</p>
        <Link href="/">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const daysUntilTest = child.targetTestDate
    ? Math.max(0, Math.ceil((new Date(child.targetTestDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const gradedWorksheets = worksheets.filter((w) => w.gradingResult);
  const avgScore = gradedWorksheets.length > 0
    ? Math.round(gradedWorksheets.reduce((sum, w) => sum + (w.gradingResult?.scorePercent || 0), 0) / gradedWorksheets.length)
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{child.name}&apos;s Progress</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">Grade {child.grade}</Badge>
            <Badge variant="outline" className="capitalize">{child.track}</Badge>
            {daysUntilTest !== null && (
              <Badge variant={daysUntilTest < 30 ? 'destructive' : 'secondary'}>
                {daysUntilTest} days until test
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/generate?child=${childId}`}>
            <Button>Generate Worksheet</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Dashboard</Button>
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{worksheets.length}</div>
            <div className="text-sm text-slate-500">Worksheets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{gradedWorksheets.length}</div>
            <div className="text-sm text-slate-500">Graded</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{avgScore}%</div>
            <div className="text-sm text-slate-500">Avg Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">
              {mastery.filter((m) => m.mastery >= 70).length}/{mastery.length}
            </div>
            <div className="text-sm text-slate-500">Proficient</div>
          </CardContent>
        </Card>
      </div>

      {/* Mastery chart */}
      <Card>
        <CardHeader>
          <CardTitle>Topic Mastery</CardTitle>
        </CardHeader>
        <CardContent>
          <MasteryChart mastery={mastery} childName={child.name} />
        </CardContent>
      </Card>

      {/* Recent worksheets */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Worksheets</CardTitle>
        </CardHeader>
        <CardContent>
          {worksheets.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No worksheets yet</p>
          ) : (
            <div className="space-y-2">
              {worksheets.slice(0, 10).map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-sm">{w.title}</div>
                    <div className="text-xs text-slate-400">
                      {w.dayOfWeek} &middot; {new Date(w.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {w.gradingResult ? (
                      <Badge
                        variant={w.gradingResult.scorePercent >= 80 ? 'default' : w.gradingResult.scorePercent >= 60 ? 'secondary' : 'destructive'}
                      >
                        {w.gradingResult.correctCount}/{w.gradingResult.totalQuestions} ({Math.round(w.gradingResult.scorePercent)}%)
                      </Badge>
                    ) : (
                      <Badge variant="outline">{w.status}</Badge>
                    )}
                    {w.status !== 'graded' && (
                      <Link href={`/grade?child=${childId}&worksheet=${w.id}`}>
                        <Button size="sm" variant="outline">Grade</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
