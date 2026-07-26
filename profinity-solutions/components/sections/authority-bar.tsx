import { Reveal, RevealGroup } from '@/components/reveal';
import { AUTHORITY } from '@/lib/site-config';

// A trust strip: "who this is for" text-logos plus credibility badges. No
// client is named or faked — swap `AUTHORITY.clients` for real logos later.
export function AuthorityBar() {
  return (
    <div className="rounded-[1.75rem] border border-border bg-surface/40 px-6 py-10 md:px-10">
      <Reveal>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {AUTHORITY.eyebrow}
        </p>
      </Reveal>

      <RevealGroup className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        {AUTHORITY.clients.map((c) => (
          <Reveal as="div" key={c}>
            <span className="font-display text-base font-semibold tracking-tight text-muted-foreground/70 transition-colors hover:text-foreground sm:text-lg">
              {c}
            </span>
          </Reveal>
        ))}
      </RevealGroup>

      <div className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
        {AUTHORITY.badges.map((b) => (
          <div key={b.label} className="bg-surface px-4 py-6 text-center">
            <div className="font-display text-2xl font-bold text-gradient md:text-3xl">{b.value}</div>
            <p className="mt-1 text-xs text-muted-foreground">{b.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
