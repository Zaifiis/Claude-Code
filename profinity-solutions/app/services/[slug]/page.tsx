import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { SectionHeading } from '@/components/sections/section-heading';
import { CtaBanner } from '@/components/sections/cta-banner';
import { Reveal } from '@/components/reveal';
import MovingDotCard from '@/components/ui/moving-dot-card';
import { SERVICES, SITE_CONFIG } from '@/lib/site-config';

// Static export needs the full list of slugs up front.
export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

// Only the slugs above are valid — anything else 404s.
export const dynamicParams = false;

function getService(slug: string) {
  return SERVICES.find((s) => s.slug === slug);
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const service = getService(params.slug);
  if (!service) return { title: 'Service not found' };
  return {
    title: service.name,
    description: service.short,
  };
}

export default function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = getService(params.slug);
  if (!service) notFound();

  const Icon = service.icon;
  const others = SERVICES.filter((s) => s.slug !== service.slug);

  return (
    <div className="pt-32">
      {/* Hero */}
      <section className="container-x">
        <Reveal>
          <Link
            href="/services"
            className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            All services
          </Link>

          <div className="mt-8 flex flex-col gap-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted text-brand-light">
              <Icon className="h-7 w-7" />
            </div>
            <h1 className="max-w-3xl font-display text-4xl font-bold tracking-[-0.03em] sm:text-5xl">
              {service.name}
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">{service.short}</p>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href={SITE_CONFIG.primaryCta.href}
              className="group inline-flex items-center gap-2 rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(59,130,246,0.7)] transition-transform hover:scale-[1.03]"
            >
              {SITE_CONFIG.primaryCta.label}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-brand-blue/50"
            >
              See all services
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Overview + What you get */}
      <section className="container-x mt-20 grid gap-10 md:grid-cols-2 md:items-start">
        <Reveal>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
              Overview
            </h2>
            <div className="mt-5 space-y-4 text-muted-foreground">
              {service.overview.map((para) => (
                <p key={para}>{para}</p>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
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

      {/* How it works */}
      <section className="container-x mt-24">
        <SectionHeading eyebrow="How it works" title="Live in three steps" center={false} />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {service.howItWorks.map((step, i) => (
            <Reveal key={step.title} delay={0.05 * i}>
              <div className="h-full rounded-2xl border border-border bg-surface p-6">
                <span className="font-display text-2xl font-bold text-gradient">
                  0{i + 1}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold tracking-[-0.02em]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Other services */}
      <section className="container-x mt-24">
        <h2 className="font-display text-2xl font-bold tracking-[-0.03em]">Explore other services</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((s) => {
            const OtherIcon = s.icon;
            return (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-brand-blue/50"
              >
                <span className="mt-0.5 flex-none rounded-lg border border-border bg-muted p-2.5 text-brand-light">
                  <OtherIcon className="h-5 w-5" />
                </span>
                <span>
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    {s.name}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </span>
                  <span className="mt-1 block text-sm leading-snug text-muted-foreground">
                    {s.whatYouGet[0]}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-x py-24">
        <CtaBanner />
      </section>
    </div>
  );
}
