'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, FileText, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PhotoUpload } from '@/components/grading/photo-upload';
import { GradingResults } from '@/components/grading/grading-results';
import { GradingQuestionResult } from '@/types';

interface Child {
  id: string;
  name: string;
  grade: number;
}

interface Worksheet {
  id: string;
  title: string;
  status: string;
  questionsJson: string;
  createdAt: string;
}

interface GradingResultData {
  results: GradingQuestionResult[];
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
}

function GradePageContent() {
  const searchParams = useSearchParams();

  // State
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [selectedWorksheetId, setSelectedWorksheetId] = useState<string>('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [isLoadingWorksheets, setIsLoadingWorksheets] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<GradingResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch children on mount
  useEffect(() => {
    async function fetchChildren() {
      try {
        const res = await fetch('/api/children');
        const data = await res.json();
        setChildren(data.children ?? []);

        // Pre-select child from URL param
        const childParam = searchParams.get('child');
        if (childParam) {
          const match = (data.children ?? []).find(
            (c: Child) => c.id === childParam
          );
          if (match) {
            setSelectedChildId(match.id);
          }
        }
      } catch {
        setError('Failed to load children.');
      } finally {
        setIsLoadingChildren(false);
      }
    }
    fetchChildren();
  }, [searchParams]);

  // Fetch worksheets when child changes
  useEffect(() => {
    if (!selectedChildId) {
      setWorksheets([]);
      setSelectedWorksheetId('');
      return;
    }

    async function fetchWorksheets() {
      setIsLoadingWorksheets(true);
      setSelectedWorksheetId('');
      setError(null);
      try {
        const res = await fetch(
          `/api/children/${selectedChildId}/worksheets`
        );
        const data = await res.json();
        // Filter to ungraded worksheets only
        const ungraded = (data.worksheets ?? []).filter(
          (w: Worksheet) => w.status !== 'graded'
        );
        setWorksheets(ungraded);
      } catch {
        setError('Failed to load worksheets.');
      } finally {
        setIsLoadingWorksheets(false);
      }
    }
    fetchWorksheets();
  }, [selectedChildId]);

  const handlePhotosChanged = useCallback((files: File[]) => {
    setPhotos(files);
    setError(null);
  }, []);

  const handleGrade = useCallback(async () => {
    if (!selectedWorksheetId || photos.length === 0) return;

    setIsGrading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('worksheetId', selectedWorksheetId);
      for (const photo of photos) {
        formData.append('photos', photo);
      }

      const res = await fetch('/api/grade', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Grading failed');
      }

      setGradingResult(data.gradingResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      );
    } finally {
      setIsGrading(false);
    }
  }, [selectedWorksheetId, photos]);

  const handleReset = useCallback(() => {
    setSelectedWorksheetId('');
    setPhotos([]);
    setGradingResult(null);
    setError(null);
  }, []);

  function getQuestionCount(worksheet: Worksheet): number {
    try {
      return JSON.parse(worksheet.questionsJson).length;
    } catch {
      return 0;
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Show results
  if (gradingResult) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Grading Results</h1>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Grade Another
            </Button>
          </div>
          <GradingResults
            results={gradingResult.results}
            totalQuestions={gradingResult.totalQuestions}
            correctCount={gradingResult.correctCount}
            scorePercent={gradingResult.scorePercent}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Grade Worksheet</h1>

        <div className="space-y-6">
          {/* Step 1: Select child */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Select Child</CardTitle>
              <CardDescription>
                Choose which child&apos;s worksheet to grade.
              </CardDescription>
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

          {/* Step 2: Select worksheet */}
          {selectedChildId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  2. Select Worksheet
                </CardTitle>
                <CardDescription>
                  Choose an ungraded worksheet to grade.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingWorksheets ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading worksheets...
                  </div>
                ) : worksheets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No ungraded worksheets found for this child.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {worksheets.map((ws) => {
                      const isSelected = selectedWorksheetId === ws.id;
                      const questionCount = getQuestionCount(ws);
                      return (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => setSelectedWorksheetId(ws.id)}
                          className={`
                            w-full text-left rounded-lg border p-3 transition-colors
                            ${
                              isSelected
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-border hover:border-primary/30 hover:bg-muted/50'
                            }
                          `}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="text-sm font-medium truncate">
                                  {ws.title}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{formatDate(ws.createdAt)}</span>
                                <span>
                                  {questionCount} question
                                  {questionCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                            <Badge variant="secondary" className="shrink-0 text-xs">
                              {ws.status}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Upload photo */}
          {selectedWorksheetId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  3. Upload Completed Worksheet Photos
                </CardTitle>
                <CardDescription>
                  Take photos of the completed worksheet or upload images. You can upload multiple pages.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PhotoUpload
                  onPhotosChanged={handlePhotosChanged}
                  isLoading={isGrading}
                />
              </CardContent>
            </Card>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Grade button */}
          {selectedWorksheetId && photos.length > 0 && (
            <Button
              onClick={handleGrade}
              disabled={isGrading}
              className="w-full"
              size="lg"
            >
              {isGrading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Grading with AI...
                </>
              ) : (
                'Grade Worksheet'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GradePage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-8 text-center text-slate-400">Loading...</div>}>
      <GradePageContent />
    </Suspense>
  );
}
