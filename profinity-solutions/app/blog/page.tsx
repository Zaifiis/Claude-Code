import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionHeading } from '@/components/sections/section-heading';
import { Reveal } from '@/components/reveal';
import { POSTS, SITE_CONFIG } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Notes on AI automation, agents, and putting AI to work in real businesses.',
};

export default function BlogPage() {
  return (
    <div className="pt-32">
      <section className="container-x">
        <SectionHeading
          eyebrow="Blog"
          title="Ideas on AI at work"
          subtitle="Practical notes on automation, agents, and running leaner with AI."
        />

        {POSTS.length === 0 ? (
          <Reveal>
            <div className="mx-auto mt-16 flex max-w-xl flex-col items-center rounded-3xl border border-border bg-surface/50 px-8 py-20 text-center">
              {/* animated gradient orb */}
              <div className="relative mb-8 h-28 w-28">
                <div className="absolute inset-0 animate-spin-slow rounded-full bg-brand-gradient opacity-80 blur-md" />
                <div className="absolute inset-2 rounded-full bg-base" />
                <div className="absolute inset-0 animate-float rounded-full bg-brand-glow/10" />
              </div>
              <h3 className="font-display text-2xl font-semibold">First posts coming soon</h3>
              <p className="mt-3 max-w-sm text-muted-foreground">
                We&apos;re putting together practical guides on AI automation. In the
                meantime, book a free audit and we&apos;ll answer your questions directly.
              </p>
              <Link
                href={SITE_CONFIG.primaryCta.href}
                className="mt-8 inline-block rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white"
              >
                {SITE_CONFIG.primaryCta.label}
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {POSTS.map((post) => (
              <Reveal key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="block h-full rounded-2xl border border-border bg-surface/60 p-6 transition-colors hover:border-brand-blue/40"
                >
                  <p className="text-xs text-muted-foreground">
                    {post.date} · {post.readingTime}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold">{post.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
