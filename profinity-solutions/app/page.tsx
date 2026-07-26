import { Hero } from '@/components/sections/hero';
import { SectionHeading } from '@/components/sections/section-heading';
import { ServicesBento } from '@/components/sections/services-bento';
import { Stats } from '@/components/ui/statistics-card';
import { DemoPin } from '@/components/sections/demo-pin';
import { CtaBanner } from '@/components/sections/cta-banner';
import { Reveal } from '@/components/reveal';
import { DEMO_SCENARIOS } from '@/lib/site-config';

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Services bento */}
      <section id="services" className="container-x py-24">
        <SectionHeading
          eyebrow="What we build"
          title="Six ways we put AI to work"
          subtitle="Every service is custom-built around your existing tools — no rip-and-replace, just the speed of automation."
        />
        <div className="mt-14">
          <ServicesBento />
        </div>
      </section>

      {/* Stats band */}
      <section className="container-x py-10">
        <Reveal>
          <Stats />
        </Reveal>
      </section>

      {/* See it in action — 3D pins */}
      <section className="container-x py-24">
        <SectionHeading
          eyebrow="See it in action"
          title="Agents built for real front lines"
          subtitle="Illustrative scenarios showing how our agents handle the busywork, end to end."
        />
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          {DEMO_SCENARIOS.slice(0, 3).map((s) => (
            <DemoPin key={s.id} scenario={s} href="/portfolio" />
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="container-x py-16">
        <CtaBanner />
      </section>
    </>
  );
}
