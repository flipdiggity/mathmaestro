import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTopicsForChild } from '@/lib/curriculum';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const child = await prisma.child.findUnique({ where: { id: params.id } });
  if (!child) {
    return NextResponse.json({ error: 'Child not found' }, { status: 404 });
  }

  const topics = getTopicsForChild(child.grade, child.track);
  return NextResponse.json({ topics });
}
