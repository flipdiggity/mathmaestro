import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { prisma } from '@/lib/db';

// Admin: support tickets (created by the public POST /api/support).
//   GET   → newest-first list
//   PATCH → { ticketId, status?: "open" | "resolved", notes?: string }

async function requireAdmin() {
  const currentUser = await requireUser();
  if (!isAdminEmail(currentUser.email)) return null;
  return currentUser;
}

export async function GET() {
  let currentUser;
  try {
    currentUser = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!currentUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        email: true,
        subject: true,
        message: true,
        status: true,
        notes: true,
        createdAt: true,
        resolvedAt: true,
      },
    });
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('admin/tickets GET error:', error);
    return NextResponse.json({ error: 'Failed to load tickets' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  let currentUser;
  try {
    currentUser = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!currentUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const { ticketId, status, notes } = body as {
      ticketId?: string;
      status?: string;
      notes?: string;
    };

    if (!ticketId || typeof ticketId !== 'string') {
      return NextResponse.json({ error: 'ticketId is required' }, { status: 400 });
    }
    if (status !== undefined && !['open', 'resolved'].includes(status)) {
      return NextResponse.json({ error: 'status must be "open" or "resolved"' }, { status: 400 });
    }
    if (notes !== undefined && typeof notes !== 'string') {
      return NextResponse.json({ error: 'notes must be a string' }, { status: 400 });
    }
    if (status === undefined && notes === undefined) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const existing = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!existing) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const data: { status?: string; notes?: string; resolvedAt?: Date | null } = {};
    if (notes !== undefined) data.notes = notes;
    if (status !== undefined) {
      data.status = status;
      // Resolving stamps resolvedAt (kept if already set); reopening clears it.
      data.resolvedAt = status === 'resolved' ? existing.resolvedAt ?? new Date() : null;
    }

    const ticket = await prisma.supportTicket.update({ where: { id: ticketId }, data });

    await prisma.auditLog.create({
      data: {
        actorEmail: currentUser.email,
        action: 'ticket-update',
        targetType: 'ticket',
        targetId: ticketId,
        detailJson: JSON.stringify({
          previousStatus: existing.status,
          ...(status !== undefined ? { status } : {}),
          ...(notes !== undefined ? { notes: notes.slice(0, 300) } : {}),
        }),
      },
    });

    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    console.error('admin/tickets PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
