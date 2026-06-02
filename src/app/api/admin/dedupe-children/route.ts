import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// One-off maintenance: remove duplicate child rows (same name added more than
// once). Within each name group it keeps the child with the most worksheet
// history and deletes the empty duplicates. A child with ANY worksheets is
// never deleted. Guarded by CRON_SECRET (or ?secret= / open if unset).
function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  if (request.headers.get('authorization') === `Bearer ${secret}`) return true;
  return request.nextUrl.searchParams.get('secret') === secret;
}

async function run() {
  const children = await prisma.child.findMany({
    include: { worksheets: { select: { id: true, gradingResult: { select: { id: true } } } } },
    orderBy: { createdAt: 'asc' },
  });

  // Rank each child by GRADED history first — that's the record worth keeping.
  const meta = new Map<string, { gradedCount: number; total: number }>();
  for (const c of children) {
    meta.set(c.id, {
      gradedCount: c.worksheets.filter((w) => w.gradingResult).length,
      total: c.worksheets.length,
    });
  }

  const groups = new Map<string, typeof children>();
  for (const c of children) {
    const key = `${c.userId}::${c.name.trim().toLowerCase()}`;
    const arr = groups.get(key) ?? [];
    arr.push(c);
    groups.set(key, arr);
  }

  const kept: string[] = [];
  const deleted: string[] = [];

  for (const arr of Array.from(groups.values())) {
    if (arr.length <= 1) {
      if (arr[0]) kept.push(`${arr[0].name} (${arr[0].id})`);
      continue;
    }
    // Keep the one with the most GRADED worksheets, then most worksheets, then oldest.
    const keep = arr.slice().sort((a, b) => {
      const ma = meta.get(a.id)!, mb = meta.get(b.id)!;
      return mb.gradedCount - ma.gradedCount || mb.total - ma.total || +a.createdAt - +b.createdAt;
    })[0];
    kept.push(`${keep.name} (${keep.id}) [graded: ${meta.get(keep.id)!.gradedCount}]`);

    for (const c of arr) {
      if (c.id === keep.id) continue;
      const m = meta.get(c.id)!;
      if (m.gradedCount > 0) {
        // Has graded history — never auto-delete; surface for manual review.
        kept.push(`${c.name} (${c.id}) [kept: has ${m.gradedCount} graded worksheet(s) — review manually]`);
        continue;
      }
      // Stray with no graded history — safe to remove. Drop its (ungraded)
      // worksheets and mastery rows first to satisfy FK constraints.
      await prisma.worksheet.deleteMany({ where: { childId: c.id } });
      await prisma.topicMastery.deleteMany({ where: { childId: c.id } });
      await prisma.child.delete({ where: { id: c.id } });
      deleted.push(`${c.name} (${c.id}) [removed ${m.total} ungraded worksheet(s)]`);
    }
  }

  return { ok: true, kept, deleted };
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    return NextResponse.json(await run());
  } catch (error) {
    console.error('dedupe-children error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Dedupe failed' },
      { status: 500 }
    );
  }
}

export const POST = GET;
