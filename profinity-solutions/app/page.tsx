import { Hero } from '@/components/sections/hero';
import { SectionHeading } from '@/components/sections/section-heading';
import { ServicesBento } from '@/components/sections/services-bento';
import { Stats } from '@/components/ui/statistics-card';
import { DemoPin } from '@/components/sections/demo-pin';
import { CtaBanner } from '@/components/sections/cta-banner';
import { AuthorityBar } from '@/components/sections/authority-bar';
import { PainPoints } from '@/components/sections/pain-points';
import { RoiCalculator } from '@/components/sections/roi-calculator';
import { CaseResults } from '@/components/sections/case-results';
import { Testimonials } from '@/components/sections/testimonials';
import { Faq } from '@/components/sections/faq';
import { AnimatedTestimonialGrid } from '@/components/ui/testimonial-2';
import { Reveal } from '@/components/reveal';
import { DEMO_SCENARIOS, TESTIMONIAL_AVATARS } from '@/lib/site-config';

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Authority / trust strip */}
      <section className="container-x pt-8">
        <AuthorityBar />
      </section>

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

      {/* Pain points + ROI calculator */}
      <section id="roi" className="container-x py-24">
        <SectionHeading
          eyebrow="The cost of doing nothing"
          title="Every slow reply is revenue walking out the door"
          subtitle="Missed calls, cold leads, and hours lost to busywork add up fast. See what it's quietly costing you — then what automation gives back."
        />
        <div className="mt-12">
          <PainPoints />
        </div>
        <div className="mt-8">
          <RoiCalculator />
        </div>
      </section>

      {/* Stats band */}
      <section className="container-x py-10">
        <Reveal>
          <Stats />
        </Reveal>
      </section>

      {/* Case studies with animated charts */}
      <section id="results" className="container-x py-24">
        <SectionHeading
          eyebrow="Results"
          title="Outcomes, not just automations"
          subtitle="Anonymous client work, labelled by industry. Figures are representative of the outcomes our agents are built to deliver."
        />
        <div className="mt-14">
          <CaseResults />
        </div>
      </section>

      {/* Testimonials — quotes */}
      <section className="container-x py-24">
        <SectionHeading
          eyebrow="What clients say"
          title="Teams that stopped losing leads"
        />
        <div className="mt-14">
          <Testimonials />
        </div>
      </section>

      {/* Testimonials — animated avatar wall */}
      <section className="container-x py-12">
        <AnimatedTestimonialGrid
          testimonials={TESTIMONIAL_AVATARS}
          title={
            <>
              Trusted by leaders
              <br />
              across industries
            </>
          }
          description="From clinics to storefronts, operators rely on our AI agents to run the front lines around the clock."
          ctaText="See our work"
          ctaHref="/portfolio"
        />
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

      {/* FAQ */}
      <section className="container-x py-24">
        <SectionHeading
          eyebrow="FAQ"
          title="Answers before you ask"
          subtitle="More questions? The full sales FAQ lives on our contact page."
        />
        <div className="mt-12">
          <Faq />
        </div>
      </section>

      {/* CTA banner */}
      <section className="container-x py-16">
        <CtaBanner />
      </section>
    </>
  );
}
