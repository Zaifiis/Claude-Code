import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { nav } from '@/lib/site-data';
import { Logo } from '@/components/site/logo';

const socials = ["Twitter", "LinkedIn", "GitHub"];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Logo />
          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} Profinity Solutions. All rights reserved.
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-6">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-neutral-400 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {socials.map((social) => (
            <a
              key={social}
              href="#"
              className="flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-white"
            >
              {social}
              <ArrowUpRight size={14} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
