import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { isSaas } from '@/lib/mode';

// Settings for the signed-in household. The daily-email recipient lives on
// User.email: the personal-mode seed uses the unroutable sentinel
// 'felipe@local', in which case the cron falls back to the DAILY_EMAIL_TO env
// var — setting a real address here takes precedence.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function maskEmail(addr: string | undefined): string | null {
  if (!addr || !addr.includes('@')) return null;
  const [local, domain] = addr.split('@');
  return `${local.slice(0, 1)}•••@${domain}`;
}

export async function GET() {
  try {
    const user = await requireUser();
    const routable = user.email && !user.email.endsWith('@local') && EMAIL_RE.test(user.email);
    const children = await prisma.child.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, emailEnabled: true, displayGrade: true, grade: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({
      dailyEmail: routable ? user.email : '',
      // Where mail goes when no address is set (personal-mode env fallback).
      fallbackMasked: maskEmail(process.env.DAILY_EMAIL_TO),
      emailManagedByAccount: isSaas, // saas: the account email is the recipient
      schedule: 'Weekday mornings at 6:00 AM Central',
      children,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    if (isSaas) {
      return NextResponse.json(
        { error: 'In accounts mode the daily email goes to your account address.' },
        { status: 400 }
      );
    }
    const body = (await request.json()) as { dailyEmail?: string };
    const raw = (body.dailyEmail ?? '').trim();
    if (raw && (!EMAIL_RE.test(raw) || raw.length > 320)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }
    // Empty → restore the unroutable sentinel so the env fallback applies.
    await prisma.user.update({
      where: { id: user.id },
      data: { email: raw || 'felipe@local' },
    });
    return NextResponse.json({ ok: true, dailyEmail: raw });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
