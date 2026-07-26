import type { Metadata } from 'next';
import { Mail, Phone, MapPin } from 'lucide-react';
import { SectionHeading } from '@/components/sections/section-heading';
import { ContactForm } from '@/components/sections/contact-form';
import { Faq } from '@/components/sections/faq';
import { Reveal } from '@/components/reveal';
import { SITE_CONFIG, SALES_FAQS } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Book a free automation audit with Profinity Solutions. Tell us what you want to automate and we will map where AI saves you the most time.',
};

export default function ContactPage() {
  const { contact } = SITE_CONFIG;
  return (
    <div className="pt-32">
      <section className="container-x">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left: pitch + channels */}
          <Reveal>
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
                Get in touch
              </span>
              <h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.03em] sm:text-5xl">
                Let&apos;s put AI to work
              </h1>
              <p className="mt-4 max-w-md text-muted-foreground">
                Book a free automation audit. Tell us what slows your team down and we&apos;ll
                map exactly where AI agents save you time and win you more customers.
              </p>

              <ul className="mt-10 space-y-4">
                <Channel icon={<Mail className="h-5 w-5" />} label="Email" value={contact.email} href={`mailto:${contact.email}`} />
                <Channel icon={<Phone className="h-5 w-5" />} label="Phone" value={contact.phone} href={`tel:${contact.phone.replace(/\s/g, '')}`} />
                <Channel icon={<MapPin className="h-5 w-5" />} label="Address" value={contact.address} href={contact.mapsUrl || undefined} />
              </ul>
            </div>
          </Reveal>

          {/* Right: form in a glow card */}
          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-border bg-surface/60 p-6 sm:p-8">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-x py-24">
        <SectionHeading
          eyebrow="FAQ"
          title="The questions we get on sales calls"
          subtitle="The real objections, answered up front — pricing, integrations, safety, and what happens if it doesn't work."
        />
        <div className="mt-12">
          <Faq items={SALES_FAQS} />
        </div>
      </section>
    </div>
  );
}

function Channel({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-4">
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-border bg-muted text-brand-light">
        {icon}
      </span>
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
  return (
    <li>
      {href ? (
        <a href={href} className="block transition-opacity hover:opacity-80">
          {inner}
        </a>
      ) : (
        inner
      )}
    </li>
  );
}
