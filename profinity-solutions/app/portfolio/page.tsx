import type { Metadata } from 'next';
import { SectionHeading } from '@/components/sections/section-heading';
import { CaseVideo } from '@/components/sections/case-video';
import { DemoPin } from '@/components/sections/demo-pin';
import { CtaBanner } from '@/components/sections/cta-banner';
import { Reveal } from '@/components/reveal';
import { CASE_STUDIES, DEMO_SCENARIOS } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Portfolio',
  description:
    'Real client results and illustrative demo scenarios for AI calling agents, speed-to-lead chatbots, and e-commerce chat agents.',
};

export default function PortfolioPage() {
  return (
    <div className="pt-32">
      {/* Client Results */}
      <section className="container-x">
        <SectionHeading
          eyebrow="Client results"
          title="Real work, real outcomes"
          subtitle="Client identities stay private — results are labelled by industry."
        />
        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {CASE_STUDIES.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.05}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface/60">
                <CaseVideo src={c.video} label={c.industry} />
                <div className="flex flex-1 flex-col p-6">
                  <span className="text-xs font-semibold uppercase tracking-widest text-brand-light">
                    {c.service}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-semibold">{c.industry}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{c.result}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Demo Scenarios */}
      <section className="container-x py-24">
        <SectionHeading
          eyebrow="Demo scenarios"
          title="Example use cases"
          subtitle="Illustrative scenarios — not specific client data — showing how each agent works."
        />
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          {DEMO_SCENARIOS.map((s) => (
            <DemoPin key={s.id} scenario={s} href="/contact" />
          ))}
        </div>
      </section>

      <section className="container-x py-8">
        <CtaBanner />
      </section>
    </div>
  );
}
