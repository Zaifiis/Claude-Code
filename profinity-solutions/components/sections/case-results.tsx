import MovingDotCard from '@/components/ui/moving-dot-card';
import { AnimatedBars, AnimatedLine, ProgressRing } from '@/components/ui/animated-chart';
import { Reveal } from '@/components/reveal';
import { CASE_STUDIES, type CaseStudy } from '@/lib/site-config';

function Chart({ study }: { study: CaseStudy }) {
  const m = study.metric;
  if (!m) return null;
  if (m.kind === 'bars') return <AnimatedBars values={m.values} captions={m.captions} />;
  if (m.kind === 'line') return <AnimatedLine values={m.values} />;
  return <ProgressRing value={m.values[0]} label={m.label} />;
}

export function CaseResults() {
  const studies = CASE_STUDIES.filter((s) => s.metric);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {studies.map((study, i) => (
        <Reveal key={study.id} delay={i * 0.08}>
          <MovingDotCard className="h-full" radius="1.25rem">
            <div className="flex h-full flex-col gap-5 p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-light">
                  {study.service}
                </span>
                <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                  {study.metric!.label}
                </span>
              </div>

              {/* Chart */}
              <div className="flex h-[130px] items-center justify-center rounded-xl border border-border bg-base/60 px-4 py-3">
                <Chart study={study} />
              </div>

              <div>
                <div className="font-display text-3xl font-bold tracking-tight text-gradient">
                  {study.metric!.display}
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{study.metric!.note}</p>
              </div>

              <div className="mt-auto border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground">{study.industry}</p>
                <p className="mt-1 text-xs text-muted-foreground">{study.result}</p>
              </div>
            </div>
          </MovingDotCard>
        </Reveal>
      ))}
    </div>
  );
}
