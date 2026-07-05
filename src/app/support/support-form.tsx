'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CircleCheckBig, LoaderCircle, Send, TriangleAlert } from 'lucide-react';

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@mathmaestro.app';

const inputClasses =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function SupportForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') ?? '').trim() || undefined,
      email: String(data.get('email') ?? '').trim(),
      subject: String(data.get('subject') ?? '').trim(),
      message: String(data.get('message') ?? '').trim(),
    };

    setStatus('sending');
    setErrorMessage(null);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        throw new Error(
          typeof body?.error === 'string' ? body.error : `Request failed (${res.status})`
        );
      }
      form.reset();
      setStatus('sent');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CircleCheckBig className="mx-auto h-8 w-8 text-emerald-600" />
        <h3 className="mt-3 text-base font-semibold text-emerald-900">Message sent</h3>
        <p className="mt-1 text-sm text-emerald-800">
          Thanks — we&rsquo;ll reply to the email address you provided.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => setStatus('idle')}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="support-name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Name <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="support-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            className={inputClasses}
          />
        </div>
        <div>
          <label
            htmlFor="support-email"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Email
          </label>
          <input
            id="support-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={inputClasses}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="support-subject"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Subject
        </label>
        <input
          id="support-subject"
          name="subject"
          type="text"
          required
          placeholder="e.g. Refund request, grading question, billing"
          className={inputClasses}
        />
      </div>

      <div>
        <label
          htmlFor="support-message"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Message
        </label>
        <textarea
          id="support-message"
          name="message"
          required
          rows={5}
          placeholder="Tell us what happened — include your child's first name and the worksheet date if it's about a specific sheet."
          className={inputClasses}
        />
      </div>

      {status === 'error' ? (
        <div className="flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 p-3">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">
            Couldn&rsquo;t send your message{errorMessage ? ` (${errorMessage})` : ''}. Please try
            again, or email{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium underline">
              {SUPPORT_EMAIL}
            </a>{' '}
            directly.
          </p>
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={status === 'sending'}
        className="bg-indigo-600 hover:bg-indigo-700"
      >
        {status === 'sending' ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send message
          </>
        )}
      </Button>
    </form>
  );
}
