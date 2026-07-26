import { PinContainer } from '@/components/ui/3d-pin';
import type { DemoScenario } from '@/lib/site-config';

// A single 3D-pin card for a demo scenario. Clearly labelled as an example.
export function DemoPin({ scenario, href = '/portfolio' }: { scenario: DemoScenario; href?: string }) {
  return (
    <PinContainer title={scenario.serviceName} href={href} containerClassName="h-[24rem] w-[20rem]">
      <div className="flex h-[19rem] w-[18rem] flex-col p-5 tracking-tight">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-light" />
            <span className="text-xs text-muted-foreground">Live agent</span>
          </div>
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-brand-light">
            Example scenario
          </span>
        </div>

        <h3 className="mt-5 font-display text-xl font-bold text-foreground">{scenario.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{scenario.serviceName}</p>

        <div className="mt-5 grid grid-cols-2 gap-4">
          {scenario.stats.map((s) => (
            <div key={s.label} className="space-y-1">
              <div className="text-2xl font-bold text-gradient">{s.value}</div>
              <div className="text-[11px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* brand-blue wave animation */}
        <div className="relative mt-4 h-16 overflow-hidden rounded-lg">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute h-16 w-full"
              style={{
                background:
                  'linear-gradient(180deg, transparent 0%, rgba(56,189,248,0.14) 50%, transparent 100%)',
                animation: `wave ${2 + i * 0.5}s ease-in-out infinite`,
                opacity: 0.4 / i,
                transform: `translateY(${i * 8}px)`,
              }}
            />
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between pt-3">
          <span className="text-[11px] text-muted-foreground">{scenario.ping}</span>
          <span className="text-sm font-medium text-brand-light">View demo →</span>
        </div>
      </div>
    </PinContainer>
  );
}
