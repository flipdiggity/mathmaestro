'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Loader2,
  FileDown,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Upload,
  TrendingUp,
  Minus,
  TrendingDown,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Child {
  id: string;
  name: string;
  grade: number;
  track: string;
}

interface CurriculumTopic {
  id: string;
  name: string;
  strand: string;
  difficulty: 1 | 2 | 3;
}

interface GeneratedQuestion {
  number: number;
  question: string;
  answer: string;
  topicId: string;
  topicName: string;
  difficulty: number;
  section?: 'new' | 'review';
  hasGrid?: boolean;
  gridType?: string;
}

interface GeneratedWorksheet {
  id: string;
  title: string;
  dayOfWeek: string;
  weekNumber: number;
  questions: GeneratedQuestion[];
  topicIds: string[];
}

type Pacing = 'accelerating' | 'steady' | 'reinforcing';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

// ---------------------------------------------------------------------------
// Inner component that uses useSearchParams (must be inside Suspense)
// ---------------------------------------------------------------------------

function GeneratePageInner() {
  // ---- State: data fetching ----
  const [children, setChildren] = useState<Child[]>([]);
  const [topics, setTopics] = useState<CurriculumTopic[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // ---- State: form controls ----
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [topicMode, setTopicMode] = useState<'auto' | 'manual' | 'pdf'>('auto');
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());
  const [questionCount, setQuestionCount] = useState(30);
  const [expandedStrands, setExpandedStrands] = useState<Set<string>>(new Set());

  // ---- State: multi-day ----
  const [selectedDays, setSelectedDays] = useState<Set<string>>(
    new Set(ALL_DAYS)
  );
  const [batchMode, setBatchMode] = useState(false);

  // ---- State: teacher PDF ----
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfAnalyzing, setPdfAnalyzing] = useState(false);
  const [pdfSummary, setPdfSummary] = useState<string | null>(null);

  // ---- State: generation ----
  const [generating, setGenerating] = useState(false);
  const [generatingDay, setGeneratingDay] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [worksheet, setWorksheet] = useState<GeneratedWorksheet | null>(null);
  const [batchWorksheets, setBatchWorksheets] = useState<GeneratedWorksheet[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [pacing, setPacing] = useState<Pacing | null>(null);

  const searchParams = useSearchParams();

  // ------------------------------------------------------------------
  // Fetch children on mount
  // ------------------------------------------------------------------
  useEffect(() => {
    async function fetchChildren() {
      try {
        const res = await fetch('/api/children');
        const data = await res.json();
        const list: Child[] = (data.children ?? []).map(
          (c: { id: string; name: string; grade: number; track?: string }) => ({
            id: c.id,
            name: c.name,
            grade: c.grade,
            track: c.track ?? 'standard',
          })
        );
        setChildren(list);

        const childParam = searchParams.get('child')?.toLowerCase();
        if (childParam) {
          const match = list.find((c) => c.name.toLowerCase() === childParam);
          if (match) setSelectedChildId(match.id);
        }
      } catch {
        setError('Failed to load children.');
      } finally {
        setLoadingChildren(false);
      }
    }
    fetchChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------------
  // Fetch topics when child or mode changes
  // ------------------------------------------------------------------
  const fetchTopics = useCallback(async (childId: string) => {
    setLoadingTopics(true);
    try {
      const res = await fetch(`/api/children/${childId}/topics`);
      const data = await res.json();
      setTopics(data.topics ?? []);
    } catch {
      setTopics([]);
    } finally {
      setLoadingTopics(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId && (topicMode === 'manual' || topicMode === 'pdf')) {
      fetchTopics(selectedChildId);
      setSelectedTopicIds(new Set());
      setPdfSummary(null);
      setPdfFile(null);
    }
  }, [selectedChildId, topicMode, fetchTopics]);

  // ------------------------------------------------------------------
  // Group topics by strand
  // ------------------------------------------------------------------
  const topicsByStrand = topics.reduce<Record<string, CurriculumTopic[]>>(
    (acc, t) => {
      if (!acc[t.strand]) acc[t.strand] = [];
      acc[t.strand].push(t);
      return acc;
    },
    {}
  );

  // ------------------------------------------------------------------
  // Toggle helpers
  // ------------------------------------------------------------------
  function toggleTopic(topicId: string) {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }

  function toggleStrand(strand: string) {
    setExpandedStrands((prev) => {
      const next = new Set(prev);
      if (next.has(strand)) next.delete(strand);
      else next.add(strand);
      return next;
    });
  }

  function toggleDay(day: string) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function selectedCountForStrand(strandTopics: CurriculumTopic[]): number {
    return strandTopics.filter((t) => selectedTopicIds.has(t.id)).length;
  }

  // ------------------------------------------------------------------
  // Teacher PDF upload handler
  // ------------------------------------------------------------------
  async function handlePdfUpload(file: File) {
    setPdfFile(file);
    setPdfAnalyzing(true);
    setPdfSummary(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('childId', selectedChildId);

      const res = await fetch('/api/analyze-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'PDF analysis failed');

      setPdfSummary(data.summary);
      if (data.matchedTopicIds?.length) {
        setSelectedTopicIds(new Set(data.matchedTopicIds));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to analyze PDF');
    } finally {
      setPdfAnalyzing(false);
    }
  }

  // ------------------------------------------------------------------
  // Generate worksheet (single day)
  // ------------------------------------------------------------------
  async function handleGenerate() {
    if (!selectedChildId) return;

    setGenerating(true);
    setError(null);
    setWorksheet(null);
    setBatchWorksheets([]);
    setShowAnswers(false);
    setPacing(null);

    try {
      const count = Math.max(1, Math.min(50, questionCount));

      if (batchMode && selectedDays.size > 1) {
        // Multi-day batch generation
        const days = ALL_DAYS.filter((d) => selectedDays.has(d));
        const res = await fetch('/api/generate-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            childId: selectedChildId,
            questionCount: count,
            selectedTopicIds: topicMode !== 'auto' && selectedTopicIds.size > 0
              ? Array.from(selectedTopicIds)
              : undefined,
            days,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Batch generation failed');
        setBatchWorksheets(data.worksheets);
        setPacing(data.pacing ?? null);
      } else {
        // Single worksheet generation
        const body: {
          childId: string;
          questionCount: number;
          selectedTopicIds?: string[];
        } = {
          childId: selectedChildId,
          questionCount: count,
        };

        if (topicMode !== 'auto' && selectedTopicIds.size > 0) {
          body.selectedTopicIds = Array.from(selectedTopicIds);
        }

        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Generation failed');
        setWorksheet(data.worksheet);
        setPacing(data.pacing ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setGenerating(false);
      setGeneratingDay(null);
    }
  }

  // ------------------------------------------------------------------
  // Reset to generate another
  // ------------------------------------------------------------------
  function handleReset() {
    setWorksheet(null);
    setBatchWorksheets([]);
    setShowAnswers(false);
    setError(null);
    setPacing(null);
  }

  // ------------------------------------------------------------------
  // Derive helpers
  // ------------------------------------------------------------------
  const selectedChild = children.find((c) => c.id === selectedChildId);
  const canGenerate =
    selectedChildId &&
    !generating &&
    (topicMode === 'auto' || selectedTopicIds.size > 0) &&
    (!batchMode || selectedDays.size > 0);

  // ------------------------------------------------------------------
  // Pacing banner component
  // ------------------------------------------------------------------
  function PacingBanner() {
    if (!pacing) return null;
    const config = {
      accelerating: {
        icon: TrendingUp,
        label: 'Accelerating',
        description: 'Recent scores are strong! Introducing more new topics.',
        color: 'bg-green-50 border-green-200 text-green-800',
      },
      steady: {
        icon: Minus,
        label: 'Steady Pace',
        description: 'Balanced mix of new topics and review.',
        color: 'bg-blue-50 border-blue-200 text-blue-800',
      },
      reinforcing: {
        icon: TrendingDown,
        label: 'Reinforcing',
        description: 'Focusing more on review to build confidence.',
        color: 'bg-amber-50 border-amber-200 text-amber-800',
      },
    }[pacing];

    const Icon = config.icon;
    return (
      <div className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${config.color}`}>
        <Icon className="h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-medium">{config.label}</p>
          <p className="text-xs opacity-80">{config.description}</p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Render a single question in the results view
  // ------------------------------------------------------------------
  function renderQuestionCard(q: GeneratedQuestion) {
    return (
      <div key={q.number} className="rounded-lg border p-3 text-sm">
        <div className="flex items-start gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {q.number}
          </span>
          <div className="flex-1 space-y-1">
            <p className="leading-relaxed">{q.question}</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[10px]">
                {q.topicName}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                Difficulty {q.difficulty}
              </Badge>
              {q.hasGrid && (
                <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-700">
                  {q.gridType === 'coordinate-plane' ? 'Grid' : 'Number Line'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Render worksheet result card
  // ------------------------------------------------------------------
  function renderWorksheetCard(ws: GeneratedWorksheet, isBatch?: boolean) {
    const hasNew = ws.questions.some((q) => q.section === 'new');
    const hasReview = ws.questions.some((q) => q.section === 'review');
    const hasSections = hasNew && hasReview;
    const newQs = hasSections ? ws.questions.filter((q) => q.section === 'new') : [];
    const reviewQs = hasSections ? ws.questions.filter((q) => q.section === 'review') : [];

    return (
      <Card key={ws.id}>
        <CardHeader>
          <CardTitle className="text-xl">
            {isBatch ? `${ws.dayOfWeek}: ` : ''}{ws.title}
          </CardTitle>
          <CardDescription>
            {ws.dayOfWeek} &middot; Week {ws.weekNumber} &middot;{' '}
            {ws.questions.length} questions
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {hasSections ? (
            <>
              {newQs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-green-700 border-b border-green-200 pb-1">
                    New Topics ({newQs.length})
                  </h3>
                  {newQs.map(renderQuestionCard)}
                </div>
              )}
              {reviewQs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-blue-700 border-b border-blue-200 pb-1">
                    Review ({reviewQs.length})
                  </h3>
                  {reviewQs.map(renderQuestionCard)}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              {ws.questions.map(renderQuestionCard)}
            </div>
          )}

          {/* Collapsible answer key */}
          <div className="rounded-lg border">
            <button
              type="button"
              onClick={() => setShowAnswers(!showAnswers)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              <span>Answer Key</span>
              {showAnswers ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {showAnswers && (
              <div className="border-t px-4 py-3 space-y-2">
                {ws.questions.map((q) => (
                  <div
                    key={q.number}
                    className="flex items-baseline gap-2 text-sm"
                  >
                    <span className="font-medium text-muted-foreground w-6 text-right">
                      {q.number}.
                    </span>
                    <span>{q.answer}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        {/* Only show per-card PDF button for single worksheets */}
        {!isBatch && (
          <CardFooter className="flex gap-3">
            <Button asChild>
              <a href={`/api/worksheets/${ws.id}/pdf`}>
                <FileDown className="mr-1.5 h-4 w-4" />
                Download PDF
              </a>
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  // ------------------------------------------------------------------
  // Download combined batch PDF
  // ------------------------------------------------------------------
  async function handleBatchPdfDownload() {
    const ids = batchWorksheets.map((ws) => ws.id);
    try {
      const res = await fetch('/api/worksheets/batch-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worksheetIds: ids }),
      });
      if (!res.ok) throw new Error('PDF download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `worksheets_week.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF download failed');
    }
  }

  // ------------------------------------------------------------------
  // Result display (single or batch)
  // ------------------------------------------------------------------
  if (worksheet || batchWorksheets.length > 0) {
    return (
      <div className="min-h-screen bg-background py-10 px-4">
        <div className="mx-auto max-w-2xl space-y-6">
          <PacingBanner />

          {/* Combined download button for batch */}
          {batchWorksheets.length > 1 && (
            <Button size="lg" className="w-full" onClick={handleBatchPdfDownload}>
              <FileDown className="mr-1.5 h-4 w-4" />
              Download All {batchWorksheets.length} Worksheets (1 PDF)
            </Button>
          )}

          {worksheet && renderWorksheetCard(worksheet)}

          {batchWorksheets.map((ws) => renderWorksheetCard(ws, true))}

          <Button variant="outline" onClick={handleReset} className="w-full">
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Generate Another
          </Button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Topic list renderer (collapsible by strand)
  // ------------------------------------------------------------------
  function renderTopicList() {
    if (loadingTopics) {
      return (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading topics...
        </div>
      );
    }
    if (Object.keys(topicsByStrand).length === 0) {
      return (
        <p className="py-4 text-sm text-muted-foreground">
          No topics available for this child.
        </p>
      );
    }
    return (
      <div className="space-y-1 py-3">
        {selectedTopicIds.size > 0 && (
          <p className="text-xs text-muted-foreground mb-2">
            {selectedTopicIds.size} topic
            {selectedTopicIds.size !== 1 ? 's' : ''} selected
          </p>
        )}
        {Object.entries(topicsByStrand).map(([strand, strandTopics]) => {
          const isExpanded = expandedStrands.has(strand);
          const selCount = selectedCountForStrand(strandTopics);
          return (
            <div key={strand} className="border rounded-md">
              <button
                type="button"
                onClick={() => toggleStrand(strand)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold hover:bg-muted/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
                <span className="flex-1 text-left">{strand}</span>
                {selCount > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {selCount} selected
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {strandTopics.length} topics
                </span>
              </button>
              {isExpanded && (
                <div className="border-t px-2 py-1.5 space-y-0.5">
                  {strandTopics.map((topic) => (
                    <label
                      key={topic.id}
                      className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTopicIds.has(topic.id)}
                        onChange={() => toggleTopic(topic.id)}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      <span className="flex-1">{topic.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        Lvl {topic.difficulty}
                      </Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Generation form
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Generate Worksheet
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a new math worksheet for practice.
          </p>
        </div>

        {/* Child selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Child</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingChildren ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : (
              <Select
                value={selectedChildId}
                onValueChange={setSelectedChildId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a child..." />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name} &mdash; Grade {child.grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Topic selection mode */}
        {selectedChildId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Topic Selection</CardTitle>
              <CardDescription>
                Choose how topics are selected for{' '}
                {selectedChild?.name ?? 'this child'}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={topicMode}
                onValueChange={(v) => setTopicMode(v as 'auto' | 'manual' | 'pdf')}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="auto" className="flex-1">
                    Auto
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="flex-1">
                    Manual
                  </TabsTrigger>
                  <TabsTrigger value="pdf" className="flex-1">
                    Teacher PDF
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="auto">
                  <p className="text-sm text-muted-foreground py-3">
                    The spaced repetition algorithm will automatically select
                    the best topics based on{' '}
                    {selectedChild?.name ?? "the child"}&apos;s mastery levels
                    and review schedule.
                  </p>
                </TabsContent>

                <TabsContent value="manual">
                  {renderTopicList()}
                </TabsContent>

                <TabsContent value="pdf">
                  <div className="space-y-4 py-3">
                    <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6">
                      <Upload className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground text-center">
                        Upload a teacher&apos;s PDF to auto-select matching topics.
                      </p>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handlePdfUpload(f);
                          }}
                        />
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                          <Upload className="h-3.5 w-3.5" />
                          {pdfFile ? 'Replace PDF' : 'Choose PDF'}
                        </span>
                      </label>
                      {pdfFile && (
                        <p className="text-xs text-muted-foreground">{pdfFile.name}</p>
                      )}
                    </div>

                    {pdfAnalyzing && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing PDF...
                      </div>
                    )}

                    {pdfSummary && (
                      <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                        <p className="font-medium mb-1">PDF Analysis</p>
                        <p className="text-muted-foreground">{pdfSummary}</p>
                      </div>
                    )}

                    {selectedTopicIds.size > 0 && !pdfAnalyzing && (
                      <>
                        <p className="text-xs text-muted-foreground">
                          {selectedTopicIds.size} topic{selectedTopicIds.size !== 1 ? 's' : ''} matched.
                          You can edit the selection below.
                        </p>
                        {renderTopicList()}
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Question count + Multi-day */}
        {selectedChildId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Question count */}
              <div>
                <label className="text-sm font-medium" htmlFor="qcount">
                  Questions per worksheet
                </label>
                <input
                  id="qcount"
                  type="number"
                  min={1}
                  max={50}
                  value={questionCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setQuestionCount(Math.max(1, Math.min(50, val)));
                  }}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Between 1 and 50. Default: 30.
                </p>
              </div>

              {/* Multi-day toggle */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batchMode}
                    onChange={() => setBatchMode(!batchMode)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span className="font-medium">Generate multiple days</span>
                </label>
                {batchMode && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {ALL_DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium border transition-colors ${
                          selectedDays.has(day)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground border-input hover:bg-muted/50'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error display */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Generate button */}
        {selectedChildId && (
          <Button
            size="lg"
            className="w-full"
            disabled={!canGenerate}
            onClick={handleGenerate}
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {generatingDay ? `Generating ${generatingDay}...` : 'Generating...'}
              </>
            ) : batchMode && selectedDays.size > 1 ? (
              `Generate ${selectedDays.size} Worksheets`
            ) : (
              'Generate Worksheet'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export with Suspense boundary (required for useSearchParams)
// ---------------------------------------------------------------------------

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <GeneratePageInner />
    </Suspense>
  );
}
