'use client';

import { POSTS, type PostBlock } from '@/lib/blog';
import { StepFlow } from '@/components/ui/step-flow';
import { PostCalc } from '@/components/sections/post-calc';
import { cn } from '@/lib/utils';

// Renders a case-study post body. Client-side because `flow` blocks carry
// Lucide icon components, which can't be passed from a server component.
export function PostBody({ slug }: { slug: string }) {
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return null;

  return (
    <div className="mt-12 space-y-6">
      {post.body.map((block, i) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2
                key={i}
                className="pt-4 font-display text-2xl font-semibold tracking-[-0.02em] text-foreground"
              >
                {block.text}
              </h2>
            );
          case 'ul':
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
          case 'callout':
            return <Callout key={i} block={block} />;
          case 'flow':
            return (
              <div key={i} className="py-3">
                <StepFlow steps={block.steps} />
              </div>
            );
          case 'calc':
            return (
              <div key={i} className="py-3">
                <PostCalc data={block} />
              </div>
            );
          default:
            return (
              <p key={i} className="text-[1.05rem] leading-relaxed text-foreground/85">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}

function Callout({ block }: { block: Extract<PostBlock, { type: 'callout' }> }) {
  const problem = block.variant === 'problem';
  return (
    <div
      className={cn(
        'rounded-2xl border p-5',
        problem ? 'border-amber-500/30 bg-amber-500/5' : 'border-brand-blue/30 bg-brand-blue/5',
      )}
    >
      <p
        className={cn(
          'text-xs font-semibold uppercase tracking-[0.2em]',
          problem ? 'text-amber-300' : 'text-brand-light',
        )}
      >
        {block.label}
      </p>
      <p className="mt-2 text-foreground/90">{block.text}</p>
    </div>
  );
}
