import { notFound } from 'next/navigation';
import { Clock, ExternalLink, Play } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getTopicById, type CurriculumTopic } from '@/lib/curriculum';
import { getVideosForTopic, type TopicVideo } from '@/lib/curriculum/videos';

// Always read fresh — this is a public share page reached from a printed QR code.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Watch first, then work — MathMaestro',
};

function sourceBadgeClasses(source: TopicVideo['source']): string {
  switch (source) {
    case 'Khan Academy':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Math Antics':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'YouTube':
      return 'bg-red-50 text-red-700 border-red-200';
  }
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

  // topicIdsJson is a JSON string array of topic ids.
  let topicIds: string[] = [];
  try {
    const parsed = JSON.parse(worksheet.topicIdsJson);
    if (Array.isArray(parsed)) {
      topicIds = parsed.filter((id): id is string => typeof id === 'string');
    }
  } catch {
    // Malformed JSON — fall through to the empty state below.
  }

  const topics: CurriculumTopic[] = Array.from(new Set(topicIds))
    .map((id) => getTopicById(id))
    .filter((t): t is CurriculumTopic => t !== undefined);

  const firstName = worksheet.child.name.trim().split(/\s+/)[0] || 'Mathematician';

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-lg mx-auto px-4 py-8 sm:py-10">
        {/* Header */}
        <header className="text-center mb-5">
          <div className="text-4xl mb-2" aria-hidden="true">
            🎬
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Watch first, then work
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            {firstName} &middot; {worksheet.title}
          </p>
        </header>

        {/* Coach note */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 mb-6 text-sm leading-relaxed text-indigo-900">
          5-10 minutes of watching makes the worksheet way easier. Pick the
          videos for topics that feel new.
        </div>

        {/* Topic cards */}
        {topics.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No video topics found for this worksheet. Grab a pencil and dive in!
          </div>
        ) : (
          <div className="space-y-4">
            {topics.map((topic) => {
              const videos = getVideosForTopic(topic);
              return (
                <section
                  key={topic.id}
                  className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <div className="px-4 pt-4 pb-3">
                    <h2 className="text-base font-semibold text-slate-900 leading-snug">
                      {topic.name}
                    </h2>
                    {topic.description ? (
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        {topic.description}
                      </p>
                    ) : null}
                  </div>

                  <ul className="border-t border-slate-100 divide-y divide-slate-100">
                    {videos.map((video) => (
                      <li key={video.url + video.title}>
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener"
                          className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 active:bg-indigo-50"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                            <Play className="h-4 w-4 fill-current" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-slate-800 leading-snug">
                              {video.title}
                            </span>
                            <span className="mt-1 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${sourceBadgeClasses(video.source)}`}
                              >
                                {video.source}
                              </span>
                              {typeof video.minutes === 'number' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                  <Clock className="h-3 w-3" />
                                  {video.minutes} min
                                </span>
                              ) : null}
                            </span>
                          </span>
                          <ExternalLink className="h-4 w-4 shrink-0 text-slate-300" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          MathMaestro &middot; Done watching? Grab a pencil ✏️
        </p>
      </main>
    </div>
  );
}
