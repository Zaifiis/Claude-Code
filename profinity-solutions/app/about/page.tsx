import type { Metadata } from 'next';
import { SectionHeading } from '@/components/sections/section-heading';
import { ProcessTimeline } from '@/components/sections/process-timeline';
import { GlowCard } from '@/components/ui/glow-card';
import { Reveal } from '@/components/reveal';
import { CtaBanner } from '@/components/sections/cta-banner';
import { VALUES } from '@/lib/site-config';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Profinity Solutions is a team of AI automation specialists building agents that call, chat, and work 24/7 — integrated with the tools you already use.',
};

export default function AboutPage() {
  return (
    <div className="pt-32">
      <section className="container-x">
        <SectionHeading
          eyebrow="About us"
          title="AI automation specialists"
          subtitle="We build agents that call, chat, and work around the clock — and we wire them into the stack your business already runs on."
        />
        <Reveal delay={0.1}>
          <div className="mx-auto mt-10 max-w-3xl space-y-5 text-center text-muted-foreground">
            <p>
              Profinity Solutions exists for one reason: most teams lose hours every day to
              busywork a machine could handle. Calls that go unanswered, leads that cool off,
              carts that get abandoned, content that never ships.
            </p>
            <p>
              We design and build AI agents that take that work off your plate — answering the
              phone in a natural voice, replying to new leads in seconds, recovering sales on
              your storefront, and keeping your content flowing. Every build is custom, measured
              on real outcomes, and integrated with the tools you already use.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="container-x py-24">
        <SectionHeading eyebrow="How we work" title="From audit to always-on" />
        <div className="mt-14">
          <ProcessTimeline />
        </div>
      </section>

      <section className="container-x py-12">
        <SectionHeading eyebrow="What we value" title="How we think about your business" />
        <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          {VALUES.map((v) => (
            <GlowCard
              key={v.title}
              icon={<Sparkles className="h-5 w-5" />}
              title={v.title}
              description={v.body}
            />
          ))}
        </ul>
      </section>

      <section className="container-x py-16">
        <CtaBanner />
      </section>
    </div>
  );
}
