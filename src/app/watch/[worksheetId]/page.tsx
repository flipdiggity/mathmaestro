import { notFound } from 'next/navigation';
import { ExternalLink, Play, Sparkles } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getTopicById, type CurriculumTopic } from '@/lib/curriculum';
import { getExactVideo, getVideosForTopic } from '@/lib/curriculum/videos';
import type { Question } from '@/types';

// Always read fresh — this is a public share page reached from a printed QR code.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Video help for this worksheet — MathMaestro',
};

interface VideoRef {
  videoId: string | null;
  title: string;
  url: string;
  channel: string;
  minutes?: number;
}

function videoForTopic(topic: CurriculumTopic): VideoRef {
  const exact = getExactVideo(topic.id);
  if (exact) {
    return {
      videoId: exact.videoId,
      title: exact.title,
      url: exact.url,
      channel: exact.source === 'Khan Academy' ? 'Khan Academy' : 'YouTube',
      minutes: exact.minutes,
    };
  }
  const fallback = getVideosForTopic(topic)[0];
  return {
    videoId: null,
    title: fallback?.title ?? topic.name,
    url: fallback?.url ?? '#',
    channel: fallback?.source ?? 'YouTube',
  };
}

function VideoCard({ video, compact }: { video: VideoRef; compact?: boolean }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 transition-shadow hover:shadow-md"
    >
      <div className="relative shrink-0">
        {video.videoId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
            alt=""
            className={`${compact ? 'h-14 w-24' : 'h-20 w-36'} rounded-md object-cover`}
          />
        ) : (
          <div className={`${compact ? 'h-14 w-24' : 'h-20 w-36'} rounded-md bg-slate-100`} />
        )}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600/95 shadow">
            <Play className="h-3.5 w-3.5 translate-x-px fill-white text-white" />
          </span>
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{video.title}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {video.channel}
          {video.minutes != null ? ` · ${video.minutes} min` : ''} · opens on YouTube
        </p>
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-slate-300" />
    </a>
  );
}

export default async function WatchPage({
  params,
}: {
  params: { worksheetId: string };
}) {
  const worksheet = await prisma.worksheet.findUnique({
    where: { id: params.worksheetId },
    include: { child: true },
  });

  if (!worksheet) {
    notFound();
  }

  let questions: Question[] = [];
  try {
    const parsed = JSON.parse(worksheet.questionsJson);
    if (Array.isArray(parsed)) questions = parsed as Question[];
  } catch {
    // Malformed — fall through to the topic-only view below.
  }

  // Older sheets can carry model-mangled question topicIds ("7.7A-linear-rep");
  // the worksheet's topicIdsJson holds the REAL selection ids. Resolve each
  // question by id first, then by topic-name match against the sheet's topics.
  let sheetTopicIds: string[] = [];
  try {
    const parsed = JSON.parse(worksheet.topicIdsJson);
    if (Array.isArray(parsed)) sheetTopicIds = parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    // ignore
  }
  const sheetTopicsByName = new Map<string, CurriculumTopic>();
  for (const id of sheetTopicIds) {
    const t = getTopicById(id);
    if (t) sheetTopicsByName.set(t.name.trim().toLowerCase(), t);
  }
  const resolveTopic = (q: Question): CurriculumTopic | undefined =>
    getTopicById(q.topicId) ?? sheetTopicsByName.get((q.topicName ?? '').trim().toLowerCase());

  // ── Group questions by topic, in sheet order ──
  interface Group {
    topic: CurriculumTopic;
    numbers: number[];
    isNew: boolean;
    hardest: number;
  }
  const groups: Group[] = [];
  const byTopic = new Map<string, Group>();
  for (const q of questions) {
    const topic = resolveTopic(q);
    if (!topic) continue;
    let g = byTopic.get(topic.id);
    if (!g) {
      g = { topic, numbers: [], isNew: false, hardest: 1 };
      byTopic.set(topic.id, g);
      groups.push(g);
    }
    g.numbers.push(q.number);
    if (q.section !== 'review') g.isNew = true;
    g.hardest = Math.max(g.hardest, q.difficulty || 1);
  }

  // "Watch before you start" = only the NEW topics (kept short on purpose).
  const newTopicVideos = groups
    .filter((g) => g.isNew)
    .slice(0, 3)
    .map((g) => ({ g, video: videoForTopic(g.topic) }));

  // Per-question help: each group gets ITS video; hard multi-skill questions
  // (difficulty >= 3) also surface the topic's prerequisite videos, since
  // those are the questions that lean on more than one skill.
  const helpGroups = groups.map((g) => {
    const primary = videoForTopic(g.topic);
    const also: Array<{ name: string; video: VideoRef }> = [];
    if (g.hardest >= 3) {
      for (const prereqId of (g.topic.prerequisites ?? []).slice(0, 2)) {
        const prereq = getTopicById(prereqId);
        const v = prereq ? getExactVideo(prereq.id) : null;
        if (prereq && v && v.videoId !== primary.videoId) {
          also.push({
            name: prereq.name,
            video: {
              videoId: v.videoId,
              title: v.title,
              url: v.url,
              channel: v.source === 'Khan Academy' ? 'Khan Academy' : 'YouTube',
              minutes: v.minutes,
            },
          });
        }
      }
    }
    return { ...g, primary, also };
  });

  const firstName = worksheet.child.name.split(' ')[0];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-xl space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            MathMaestro · Video help
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {firstName}&rsquo;s videos for this sheet
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">{worksheet.title}</p>
        </header>

        {newTopicVideos.length > 0 && (
          <section>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              New today — worth watching before you start
            </h2>
            <div className="mt-2 space-y-2">
              {newTopicVideos.map(({ g, video }) => (
                <VideoCard key={g.topic.id} video={video} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold text-slate-900">
            Stuck on a question? Find its number here.
          </h2>
          <div className="mt-2 space-y-3">
            {helpGroups.map((g) => (
              <div
                key={g.topic.id}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="mb-2 flex flex-wrap items-center gap-1">
                  {g.numbers.map((n) => (
                    <span
                      key={n}
                      className="flex h-6 min-w-6 items-center justify-center rounded-md bg-indigo-50 px-1 text-xs font-bold text-indigo-700"
                    >
                      Q{n}
                    </span>
                  ))}
                  <span className="ml-1 text-xs text-slate-500">{g.topic.name}</span>
                </div>
                <VideoCard video={g.primary} compact />
                {g.also.length > 0 && (
                  <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      These questions also use…
                    </p>
                    {g.also.map((a) => (
                      <VideoCard key={a.video.url} video={a.video} compact />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {helpGroups.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                No question data found for this worksheet.
              </div>
            )}
          </div>
        </section>

        <p className="pt-1 text-center text-xs text-slate-400">
          Watch just what you need, then back to the pencil. You&rsquo;ve got this, {firstName}! ✏️
        </p>
      </div>
    </main>
  );
}
