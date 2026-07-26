import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Reveal } from '@/components/reveal';
import { CtaBanner } from '@/components/sections/cta-banner';
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
    <div className="pt-32">
      <article className="container-x mx-auto max-w-3xl">
        <Reveal>
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            All posts
          </Link>

          <p className="mt-8 text-xs uppercase tracking-[0.2em] text-brand-light">
            {post.date} · {post.readingTime}
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-[-0.03em] sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
          <p className="mt-6 text-sm text-muted-foreground">By {post.author}</p>
        </Reveal>

        <div className="mt-12 space-y-6">
          {post.body.map((block, i) => {
            if (block.type === 'h2') {
              return (
                <h2
                  key={i}
                  className="pt-4 font-display text-2xl font-semibold tracking-[-0.02em] text-foreground"
                >
                  {block.text}
                </h2>
              );
            }
            if (block.type === 'ul') {
              return (
                <ul key={i} className="space-y-2.5 pl-1">
                  {block.items.map((item) => (
                    <li key={item} className="flex gap-3 text-muted-foreground">
                      <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand-gradient" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="text-[1.05rem] leading-relaxed text-foreground/85">
                {block.text}
              </p>
            );
          })}
        </div>
      </article>

      <section className="container-x py-24">
        <CtaBanner />
      </section>
    </div>
  );
}
