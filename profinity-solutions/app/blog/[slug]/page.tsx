import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/reveal';
import { CtaBanner } from '@/components/sections/cta-banner';
import { PostBody } from '@/components/sections/post-body';
import { POSTS } from '@/lib/blog';

// Static export needs every slug up front; anything else 404s.
export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

function getPost(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost(params.slug);
  if (!post) return { title: 'Post not found' };
  return { title: post.title, description: post.excerpt };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  return (
    <div className="pt-32 pb-24">
      <article className="container-x mx-auto max-w-3xl">
        <Reveal>
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            All posts
          </Link>

          {/* Case-study tags */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Link
              href={`/services/${post.serviceSlug}`}
              className="rounded-full border border-brand-blue/40 bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-light transition-colors hover:border-brand-blue/70"
            >
              {post.service}
            </Link>
            <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {post.industry}
            </span>
          </div>

          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-brand-light">
            {post.date} · {post.readingTime}
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-[-0.03em] sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
          <p className="mt-6 text-sm text-muted-foreground">By {post.author}</p>
        </Reveal>

        <PostBody slug={post.slug} />

        {/* Link back to the matching service */}
        <div className="mt-14 rounded-2xl border border-border bg-surface/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">This is what we do with</p>
          <Link
            href={`/services/${post.serviceSlug}`}
            className="group mt-2 inline-flex items-center gap-2 font-display text-xl font-semibold text-foreground"
          >
            {post.service}
            <ArrowRight className="h-4 w-4 text-brand-light transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </article>

      <section className="container-x mt-20">
        <CtaBanner />
      </section>
    </div>
  );
}
