import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { SectionHeading } from '@/components/sections/section-heading';
import { ServicesSubnav } from '@/components/sections/services-subnav';
import { CtaBanner } from '@/components/sections/cta-banner';
import { Reveal } from '@/components/reveal';
import MovingDotCard from '@/components/ui/moving-dot-card';
import { SERVICES } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'AI Automations, Calling Agents, Speed-to-Lead Chatbots, E-commerce Chat Agents, Content Automation, and AI-Connected Web Development.',
};

export default function ServicesPage() {
  return (
    <div className="pt-32">
      <section className="container-x">
        <SectionHeading
          eyebrow="Services"
          title="AI that does the work"
          subtitle="Six core services, each custom-built around the tools your team already uses."
        />
      </section>

      <div className="container-x mt-14">
        <ServicesSubnav />

        <div className="space-y-24">
          {SERVICES.map((service, i) => {
            const Icon = service.icon;
            const flip = i % 2 === 1;
            return (
              <section
                key={service.id}
                id={service.id}
                className="scroll-mt-28 grid items-center gap-10 md:grid-cols-2"
              >
                <Reveal className={flip ? 'md:order-2' : ''}>
                  <div>
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted text-brand-light">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="font-display text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                      {service.name}
                    </h2>
                    <p className="mt-4 text-muted-foreground">{service.short}</p>
                    <Link
                      href={`/services/${service.slug}`}
                      className="group mt-7 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-brand-blue/50"
                    >
                      Explore {service.name}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </Reveal>

                <Reveal delay={0.1} className={flip ? 'md:order-1' : ''}>
                  <MovingDotCard radius="1.25rem">
                    <div className="rounded-[calc(1.25rem-1.5px)] p-7">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
                        What you get
                      </h3>
                      <ul className="mt-5 space-y-3.5">
                        {service.whatYouGet.map((item) => (
                          <li key={item} className="flex items-start gap-3 text-sm text-foreground/90">
                            <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-gradient">
                              <Check className="h-3 w-3 text-white" />
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </MovingDotCard>
                </Reveal>
              </section>
            );
          })}
        </div>
      </div>

      <section className="container-x py-24">
        <CtaBanner />
      </section>
    </div>
  );
}
