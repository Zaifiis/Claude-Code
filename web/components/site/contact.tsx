'use client';

import { useState } from 'react';
import { Spotlight } from '@/components/ui/spotlight';

export function Contact() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="contact" className="relative overflow-hidden bg-black px-6 py-24">
      <Spotlight className="left-1/2 top-0 -translate-x-1/2" fill="white" />

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-neutral-400">
          Get in touch
        </p>
        <h2 className="text-3xl font-bold text-white md:text-4xl">
          Have a project in mind?
        </h2>
        <p className="mt-4 text-neutral-300">
          Tell us a bit about what you&apos;re building — we usually reply within one
          business day.
        </p>

        {submitted ? (
          <p className="mt-10 rounded-lg border border-white/10 bg-white/5 p-6 text-neutral-200">
            Thanks — we&apos;ve got your message and will be in touch shortly.
          </p>
        ) : (
          <form
            className="mt-10 flex flex-col gap-4 text-left"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                type="text"
                placeholder="Your name"
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white/30 focus:outline-none"
              />
              <input
                required
                type="email"
                placeholder="Email address"
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white/30 focus:outline-none"
              />
            </div>
            <textarea
              required
              rows={4}
              placeholder="What are you building?"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white/30 focus:outline-none"
            />
            <button
              type="submit"
              className="mt-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-neutral-200"
            >
              Send message
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
