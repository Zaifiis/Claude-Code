'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { SERVICES, SITE_CONFIG } from '@/lib/site-config';

type Status = 'idle' | 'sending' | 'success' | 'error';

const field =
  'w-full rounded-lg border border-input bg-base px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-brand-blue/60';

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    // No server on static hosting — post to Formspree-style endpoint if set,
    // otherwise fall back to opening the user's mail client.
    if (!SITE_CONFIG.formEndpoint) {
      const body = encodeURIComponent(
        `Name: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company}\nService: ${data.service}\n\n${data.message}`,
      );
      window.location.href = `mailto:${SITE_CONFIG.contact.email}?subject=${encodeURIComponent(
        'New enquiry from profinitysolution.com',
      )}&body=${body}`;
      setStatus('success');
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch(SITE_CONFIG.formEndpoint, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('success');
      form.reset();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-border bg-surface/60 p-10 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient">
          <Send className="h-6 w-6 text-white" />
        </div>
        <h3 className="font-display text-xl font-semibold">Thanks — we&apos;ll be in touch</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll reply within one business day to book your free automation audit.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Name
          </label>
          <input id="name" name="name" required autoComplete="name" className={field} placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Email
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className={field} placeholder="you@company.com" />
        </div>
      </div>

      <div>
        <label htmlFor="company" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Company
        </label>
        <input id="company" name="company" autoComplete="organization" className={field} placeholder="Company name" />
      </div>

      <div>
        <label htmlFor="service" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Service interest
        </label>
        <select id="service" name="service" defaultValue="" className={field} required>
          <option value="" disabled>
            Select a service
          </option>
          {SERVICES.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
          <option value="Not sure yet">Not sure yet</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          className={field}
          placeholder="Tell us what you'd like to automate…"
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-400">
          Something went wrong. Please email us directly at {SITE_CONFIG.contact.email}.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(59,130,246,0.7)] transition-transform hover:scale-[1.01] disabled:opacity-70"
      >
        {status === 'sending' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            Book my free audit
            <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </form>
  );
}
