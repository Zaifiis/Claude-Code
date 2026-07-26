import { AlertTriangle } from 'lucide-react';
import { Reveal } from '@/components/reveal';
import { PAIN_POINTS } from '@/lib/site-config';

// "The cost of doing nothing" — three friction cards that set up the ROI
// calculator directly beneath them.
export function PainPoints() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {PAIN_POINTS.map((p, i) => (
        <Reveal key={p.title} delay={i * 0.08}>
          <div className="group h-full rounded-2xl border border-border bg-surface/50 p-6 transition-colors hover:border-brand-blue/40">
            <div className="flex items-center gap-3">
              <span className="rounded-lg border border-border bg-muted p-2 text-brand-light">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <span className="font-display text-2xl font-bold text-gradient">{p.stat}</span>
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-foreground">
              {p.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
