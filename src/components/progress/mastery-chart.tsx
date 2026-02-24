'use client';

import { Badge } from '@/components/ui/badge';

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

interface MasteryChartProps {
  mastery: MasteryRecord[];
  childName: string;
}

function getMasteryColor(mastery: number): string {
  if (mastery >= 80) return 'bg-green-500';
  if (mastery >= 60) return 'bg-yellow-500';
  if (mastery >= 30) return 'bg-orange-500';
  return 'bg-red-500';
}

function getMasteryLabel(mastery: number): string {
  if (mastery >= 90) return 'Mastered';
  if (mastery >= 70) return 'Proficient';
  if (mastery >= 50) return 'Developing';
  if (mastery >= 20) return 'Emerging';
  return 'Not Started';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function MasteryChart({ mastery }: MasteryChartProps) {
  // Group by grade level
  const byGrade = mastery.reduce<Record<number, MasteryRecord[]>>((acc, m) => {
    if (!acc[m.gradeLevel]) acc[m.gradeLevel] = [];
    acc[m.gradeLevel].push(m);
    return acc;
  }, {});

  const avgMastery = mastery.length > 0
    ? Math.round(mastery.reduce((sum, m) => sum + m.mastery, 0) / mastery.length)
    : 0;

  const masteredCount = mastery.filter((m) => m.mastery >= 70).length;

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-slate-50 rounded-lg">
          <div className="text-3xl font-bold text-slate-900">{avgMastery}%</div>
          <div className="text-sm text-slate-500">Avg Mastery</div>
        </div>
        <div className="text-center p-4 bg-slate-50 rounded-lg">
          <div className="text-3xl font-bold text-slate-900">{masteredCount}/{mastery.length}</div>
          <div className="text-sm text-slate-500">Topics Proficient</div>
        </div>
        <div className="text-center p-4 bg-slate-50 rounded-lg">
          <div className="text-3xl font-bold text-slate-900">
            {mastery.reduce((sum, m) => sum + m.timesPracticed, 0)}
          </div>
          <div className="text-sm text-slate-500">Total Practices</div>
        </div>
      </div>

      {/* By grade level */}
      {Object.entries(byGrade)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([grade, topics]) => (
          <div key={grade} className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-800">
              Grade {grade} Topics
            </h3>
            <div className="space-y-2">
              {topics
                .sort((a, b) => b.mastery - a.mastery)
                .map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-800 truncate">
                          {topic.topicName}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${
                            topic.mastery >= 70 ? 'border-green-300 text-green-700' :
                            topic.mastery >= 40 ? 'border-yellow-300 text-yellow-700' :
                            'border-red-300 text-red-700'
                          }`}
                        >
                          {getMasteryLabel(topic.mastery)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex-1">
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getMasteryColor(topic.mastery)}`}
                              style={{ width: `${Math.max(2, topic.mastery)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-slate-600 w-12 text-right">
                          {Math.round(topic.mastery)}%
                        </span>
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-slate-400">
                        <span>Practiced {topic.timesPracticed}x</span>
                        <span>Last: {formatDate(topic.lastPracticedAt)}</span>
                        {topic.lastScore !== null && (
                          <span>Last score: {Math.round(topic.lastScore)}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

      {mastery.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p className="text-lg">No mastery data yet</p>
          <p className="text-sm mt-1">Generate and grade some worksheets to start tracking progress!</p>
        </div>
      )}
    </div>
  );
}
