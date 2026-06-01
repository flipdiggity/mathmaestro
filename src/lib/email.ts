// Minimal Resend email sender using the REST API directly (no SDK dependency).
// Docs: https://resend.com/docs/api-reference/emails/send-email
//
// Env:
//   RESEND_API_KEY    — required to actually send
//   DAILY_EMAIL_FROM  — sender (default Resend's shared onboarding@resend.dev)
//   DAILY_EMAIL_TO    — default recipient

export interface EmailAttachment {
  filename: string;
  /** Base64-encoded file content. */
  content: string;
}

export interface SendEmailInput {
  to?: string;
  from?: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = input.from ?? process.env.DAILY_EMAIL_FROM ?? 'onboarding@resend.dev';
  const to = input.to ?? process.env.DAILY_EMAIL_TO;

  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY is not set' };
  if (!to) return { ok: false, error: 'No recipient (set DAILY_EMAIL_TO or pass `to`)' };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: input.subject,
        html: input.html,
        attachments: input.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content, // Resend accepts base64 string content
        })),
      }),
    });

    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      return { ok: false, error: data.message ?? `Resend returned ${res.status}` };
    }
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Email send failed' };
  }
}
