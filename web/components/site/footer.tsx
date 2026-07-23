import { ArrowUpRight } from 'lucide-react';
import { nav } from '@/lib/site-data';

const socials = ["Twitter", "LinkedIn", "GitHub"];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="text-center md:text-left">
          <p className="text-lg font-semibold text-white">
            Nova<span className="text-neutral-400">Studio</span>
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} Nova Studio. All rights reserved.
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-6">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-neutral-400 transition-colors hover:text-white"
            >
              {item.label}
            </a>
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
