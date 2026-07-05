import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

// PUBLIC endpoint (listed in middleware's public routes): anyone — signed in
// or not — can file a support ticket. The SupportTicket row is the source of
// truth; the notification email to the support inbox is best-effort.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const email = typeof raw.email === 'string' ? raw.email.trim() : '';
  const subject = typeof raw.subject === 'string' ? raw.subject.trim() : '';
  const message = typeof raw.message === 'string' ? raw.message.trim() : '';
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 100) : '';

  if (!email || email.length > 320 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
  }
  if (!subject || subject.length > 200) {
    return NextResponse.json(
      { error: 'Subject is required (200 characters max)' },
      { status: 400 }
    );
  }
  if (message.length < 10 || message.length > 5000) {
    return NextResponse.json(
      { error: 'Message must be between 10 and 5000 characters' },
      { status: 400 }
    );
  }

  try {
    const ticket = await prisma.supportTicket.create({
      data: { email, subject, message },
    });

    // Best-effort notification — a failure here must never fail the request,
    // since the ticket row above is what the admin console works from.
    try {
      const to = process.env.SUPPORT_INBOX_EMAIL || process.env.DAILY_EMAIL_TO;
      const from = name ? `${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;` : escapeHtml(email);
      await sendEmail({
        to,
        subject: `[MathMaestro Support] ${subject}`,
        html: `
          <h2 style="margin:0 0 12px">New support ticket</h2>
          <p style="margin:0 0 4px"><strong>From:</strong> ${from}</p>
          <p style="margin:0 0 4px"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <p style="margin:0 0 12px"><strong>Ticket ID:</strong> ${ticket.id}</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0" />
          <p style="white-space:pre-wrap;margin:0 0 12px">${escapeHtml(message)}</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0" />
          <p style="margin:0;color:#64748b;font-size:13px">
            Reply directly to <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>,
            then resolve the ticket in the admin console.
          </p>
        `,
      });
    } catch (emailError) {
      console.error('support: notification email failed:', emailError);
    }

    return NextResponse.json({ ok: true, ticketId: ticket.id });
  } catch (error) {
    console.error('support: ticket creation failed:', error);
    return NextResponse.json({ error: 'Failed to submit support request' }, { status: 500 });
  }
}
