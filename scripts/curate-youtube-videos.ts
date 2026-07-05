/**
 * Curate ONE exact YouTube video per curriculum topic by scraping live
 * YouTube search results (no API key needed), preferring Khan Academy's
 * official channel (their full library is on YouTube — no login required)
 * and Math Antics for elementary topics. Every pick is then verified via
 * YouTube's oEmbed endpoint before being written.
 *
 * Output: src/lib/curriculum/youtube-videos.json  { [topicId]: {id,title,channel,seconds} }
 * Run:    npx tsx scripts/curate-youtube-videos.ts [--only 9,10] [--limit N]
 */
import fs from 'fs';
import { getAllCurricula } from '../src/lib/curriculum';

interface Pick {
  id: string;
  title: string;
  channel: string;
  seconds: number;
}

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseLength(s: string | undefined): number {
  if (!s) return 0;
  const parts = s.split(':').map((n) => parseInt(n, 10));
  if (parts.some(Number.isNaN)) return 0;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

interface SearchResult {
  videoId: string;
  title: string;
  owner: string;
  seconds: number;
}

async function searchYouTube(query: string): Promise<SearchResult[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=en`;
  // Retry transient fetch failures / throttling with escalating cooldowns.
  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      });
      if (res.ok) break;
    } catch {
      res = null;
    }
    await sleep(4000 * (attempt + 1));
  }
  if (!res || !res.ok) throw new Error(`search http ${res?.status ?? 'fetch failed'}`);
  const html = await res.text();
  const m = html.match(/var ytInitialData = (\{[\s\S]+?\});<\/script>/);
  if (!m) throw new Error('no ytInitialData');
  const data = JSON.parse(m[1]);
  const out: SearchResult[] = [];
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const obj = node as Record<string, unknown>;
    const vr = obj.videoRenderer as Record<string, unknown> | undefined;
    if (vr && typeof vr.videoId === 'string') {
      const title = (vr.title as { runs?: { text: string }[] })?.runs?.[0]?.text ?? '';
      const owner = (vr.ownerText as { runs?: { text: string }[] })?.runs?.[0]?.text ?? '';
      const seconds = parseLength((vr.lengthText as { simpleText?: string })?.simpleText);
      out.push({ videoId: vr.videoId, title, owner, seconds });
    }
    Object.values(obj).forEach(walk);
  };
  walk(data);
  return out.slice(0, 20);
}

function chooseFrom(
  results: SearchResult[],
  preferredChannels: string[]
): SearchResult | null {
  const goodLength = (r: SearchResult) => r.seconds >= 60 && r.seconds <= 1500;
  for (const pref of preferredChannels) {
    const hit = results.find(
      (r) => r.owner.toLowerCase().includes(pref) && goodLength(r)
    );
    if (hit) return hit;
  }
  return null;
}

/** Confirm the video actually exists/embeds via oEmbed (no key needed). */
async function verify(videoId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D${videoId}&format=json`,
      { headers: { 'User-Agent': UA } }
    );
    return res.ok;
  } catch {
    return false;
  }
}

function cleanTitle(t: string): string {
  // "Intro to slope | Algebra I | Khan Academy" → "Intro to slope"
  return t.split('|')[0].trim().slice(0, 80);
}

async function curateTopic(topic: {
  id: string;
  name: string;
  gradeLevel: number;
}): Promise<Pick | null> {
  const elementary = topic.gradeLevel <= 6;
  const attempts: Array<{ q: string; prefer: string[] }> = elementary
    ? [
        { q: `math antics ${topic.name}`, prefer: ['mathantics'] },
        { q: `khan academy ${topic.name}`, prefer: ['khan academy'] },
        { q: `${topic.name} grade ${topic.gradeLevel} math`, prefer: ['khan academy', 'mathantics'] },
      ]
    : [
        { q: `khan academy ${topic.name}`, prefer: ['khan academy'] },
        { q: `${topic.name} math`, prefer: ['khan academy', 'mathantics', 'mario'] },
      ];

  for (const attempt of attempts) {
    try {
      const results = await searchYouTube(attempt.q);
      const pick = chooseFrom(results, attempt.prefer);
      if (pick && (await verify(pick.videoId))) {
        return {
          id: pick.videoId,
          title: cleanTitle(pick.title),
          channel: pick.owner,
          seconds: pick.seconds,
        };
      }
    } catch (e) {
      console.error(`  search failed (${attempt.q}):`, e instanceof Error ? e.message : e);
    }
    await sleep(400);
  }
  return null;
}

async function main() {
  const onlyArg = process.argv.find((a) => a.startsWith('--only'));
  const limitArg = process.argv.find((a) => a.startsWith('--limit'));
  const only = onlyArg ? process.argv[process.argv.indexOf(onlyArg) + 1].split(',').map(Number) : null;
  const limit = limitArg ? Number(process.argv[process.argv.indexOf(limitArg) + 1]) : Infinity;

  const outPath = 'src/lib/curriculum/youtube-videos.json';
  const existing: Record<string, Pick> = fs.existsSync(outPath)
    ? JSON.parse(fs.readFileSync(outPath, 'utf8'))
    : {};

  const topics = getAllCurricula()
    .flatMap((c) => c.topics)
    .filter((t) => (only ? only.includes(t.gradeLevel) : true))
    .filter((t) => !existing[t.id]);

  console.log(`${topics.length} topics to curate (${Object.keys(existing).length} already done)`);
  let done = 0;
  let found = 0;
  for (const t of topics) {
    if (done >= limit) break;
    const pick = await curateTopic(t);
    if (pick) {
      existing[t.id] = pick;
      found++;
      console.log(`✓ [g${t.gradeLevel}] ${t.name} → ${pick.channel}: ${pick.title} (${Math.round(pick.seconds / 60)}m)`);
    } else {
      console.log(`✗ [g${t.gradeLevel}] ${t.name} — no confident match (fallback stays)`);
    }
    done++;
    // Write incrementally so an interruption keeps progress.
    fs.writeFileSync(outPath, JSON.stringify(existing, null, 1));
    await sleep(1500);
  }
  console.log(`\nDone: ${found}/${done} matched this run; total curated ${Object.keys(existing).length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
