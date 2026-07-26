import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Instagram, Facebook, Youtube } from 'lucide-react';
import { NAV_LINKS, SERVICES, SITE_CONFIG } from '@/lib/site-config';

const companyLinks = NAV_LINKS.filter((l) =>
  ['/about', '/services', '/portfolio', '/blog', '/contact'].includes(l.href),
);

export function Footer() {
  const year = new Date().getFullYear();
  const { contact, socials } = SITE_CONFIG;

  return (
    <footer className="mt-24 border-t border-border bg-surface/40">
      <div className="container-x grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="mb-4 flex items-center gap-2.5">
            <Image src="/logo.jpeg" alt="" width={40} height={40} className="rounded-lg" />
            <span className="font-display text-lg font-bold">Profinity Solutions</span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            An AI automation agency building agents that call, chat, and work 24/7 —
            integrated with the tools your team already uses.
          </p>
          <div className="mt-5 flex gap-3">
            {socials.linkedin && <Social href={socials.linkedin} label="LinkedIn"><Linkedin className="h-4 w-4" /></Social>}
            {socials.instagram && <Social href={socials.instagram} label="Instagram"><Instagram className="h-4 w-4" /></Social>}
            {socials.facebook && <Social href={socials.facebook} label="Facebook"><Facebook className="h-4 w-4" /></Social>}
            {socials.youtube && <Social href={socials.youtube} label="YouTube"><Youtube className="h-4 w-4" /></Social>}
          </div>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-widest text-brand-light">
            Company
          </h3>
          <ul className="space-y-2.5">
            {companyLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-widest text-brand-light">
            Services
          </h3>
          <ul className="space-y-2.5">
            {SERVICES.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/services#${s.id}`}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-widest text-brand-light">
            Get in touch
          </h3>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li>
              <a href={`mailto:${contact.email}`} className="transition-colors hover:text-foreground">
                {contact.email}
              </a>
            </li>
            <li>
              <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="transition-colors hover:text-foreground">
                {contact.phone}
              </a>
            </li>
            <li className="max-w-xs">{contact.address}</li>
          </ul>
          <Link
            href={SITE_CONFIG.primaryCta.href}
            className="mt-5 inline-block rounded-full bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
          >
            {SITE_CONFIG.primaryCta.label}
          </Link>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {year} Profinity Solutions. All rights reserved.</p>
          <p>{SITE_CONFIG.domain}</p>
        </div>
      </div>
    </footer>
  );
}

function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="rounded-lg border border-border bg-muted p-2 text-muted-foreground transition-colors hover:text-brand-light"
    >
      {children}
    </a>
  );
}
