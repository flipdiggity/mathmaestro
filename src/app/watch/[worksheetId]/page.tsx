import { notFound } from 'next/navigation';
import { Clock, ExternalLink, Play } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getTopicById, type CurriculumTopic } from '@/lib/curriculum';
import { getExactVideo, getVideosForTopic } from '@/lib/curriculum/videos';

// Always read fresh — this is a public share page reached from a printed QR code.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Watch first, then work — MathMaestro',
};

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
    .filter((t): t is CurriculumTopic => Boolean(t));

  // ONE exact video per topic, in worksheet order — this is the playlist.
  // Topics without a curated exact video fall back to their best link.
  const playlist = topics.map((topic) => {
    const exact = getExactVideo(topic.id);
    const fallback = getVideosForTopic(topic)[0];
    return {
      topic,
      videoId: exact?.videoId ?? null,
      title: exact?.title ?? fallback?.title ?? topic.name,
      url: exact ? exact.url : fallback?.url ?? '#',
      channel: exact ? (exact.source === 'Khan Academy' ? 'Khan Academy' : 'YouTube') : fallback?.source ?? 'YouTube',
      minutes: exact?.minutes,
      more: getVideosForTopic(topic).find((v) => v.url !== (exact?.url ?? fallback?.url)),
    };
  });
  const totalMinutes = playlist.reduce((s, p) => s + (p.minutes ?? 0), 0);
  const firstName = worksheet.child.name.split(' ')[0];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-xl space-y-5">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            MathMaestro · Watch first
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {firstName}, watch these {playlist.length} videos — then start
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            {totalMinutes > 0 ? `About ${totalMinutes} minutes total. ` : ''}
            They match today&rsquo;s worksheet exactly:{' '}
            <span className="font-medium text-slate-800">{worksheet.title}</span>
          </p>
        </header>

        {playlist.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No videos found for this worksheet&rsquo;s topics.
          </div>
        ) : (
          <ol className="space-y-3">
            {playlist.map((item, i) => (
              <li key={item.topic.id}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {item.videoId && (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`}
                        alt=""
                        className="h-44 w-full object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600/95 shadow-lg">
                          <Play className="h-6 w-6 translate-x-0.5 fill-white text-white" />
                        </span>
                      </span>
                      {item.minutes != null && (
                        <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                          {item.minutes} min
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-4">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {item.topic.name}
                      </p>
                      <p className="mt-0.5 font-medium text-slate-900">{item.title}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        <span>{item.channel} · opens on YouTube</span>
                        {!item.videoId && item.minutes != null && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {item.minutes} min
                          </span>
                        )}
                      </p>
                    </div>
                    <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
                  </div>
                </a>
                {item.more && (
                  <p className="mt-1 pl-4 text-xs text-slate-400">
                    Still stuck after the video?{' '}
                    <a
                      href={item.more.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-500 underline-offset-2 hover:underline"
                    >
                      More on {item.more.source}
                    </a>
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}

        <p className="pt-2 text-center text-xs text-slate-400">
          Watch in order, then grab a pencil. Good luck, {firstName}! ✏️
        </p>
      </div>
    </main>
  );
}
