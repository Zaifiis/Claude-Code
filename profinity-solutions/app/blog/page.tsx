import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SectionHeading } from '@/components/sections/section-heading';
import { Reveal } from '@/components/reveal';
import { POSTS } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Case studies',
  description:
    'Real, plain-English case studies: the problem a business had, how we fixed it with AI, and the money math anyone can follow.',
};

export default function BlogPage() {
  return (
    <div className="pt-32 pb-24">
      <section className="container-x">
        <SectionHeading
          eyebrow="Case studies"
          title="Real problems, solved simply"
          subtitle="What we changed, how it works, and the numbers — one story per service."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((post) => (
            <Reveal key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-border bg-surface/60 p-6 transition-colors hover:border-brand-blue/40"
              >
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-brand-blue/40 bg-brand-blue/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-light">
                    {post.service}
                  </span>
                  <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {post.industry}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {post.date} · {post.readingTime}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-foreground">
                  {post.title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{post.excerpt}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-light">
                  Read the case study
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
