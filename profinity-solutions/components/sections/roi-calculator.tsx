'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { animate, useReducedMotion } from 'framer-motion';
import { PhoneMissed, Clock, ArrowRight } from 'lucide-react';
import { CALCULATOR_DEFAULTS as D, SITE_CONFIG } from '@/lib/site-config';
import { cn } from '@/lib/utils';

type Tab = 'leads' | 'hours';

// A number that eases to its latest target whenever the target changes.
function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setDisplay,
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduce]);

  return <>{format(display)}</>;
}

function Field({
  label,
  value,
  set,
  min,
  max,
  step = 1,
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  set: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="font-display text-sm font-semibold text-foreground">
          {prefix}
          {value.toLocaleString()}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        aria-label={label}
        className="roi-range mt-2 w-full"
      />
    </label>
  );
}

const money = (n: number) =>
  '$' + Math.round(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
const whole = (n: number) => Math.round(n).toLocaleString();

export function RoiCalculator() {
  const [tab, setTab] = useState<Tab>('leads');

  // Missed-revenue inputs
  const [leads, setLeads] = useState<number>(D.leadsPerMonth);
  const [deal, setDeal] = useState<number>(D.dealValue);
  const [closeRate, setCloseRate] = useState<number>(D.closeRate);
  const [missed, setMissed] = useState<number>(D.missedPct);

  // Automation-hours inputs
  const [hours, setHours] = useState<number>(D.hoursPerWeek);
  const [cost, setCost] = useState<number>(D.hourlyCost);
  const [autoPct, setAutoPct] = useState<number>(D.automatablePct);

  // Revenue model: capture the leads currently missed/replied-to-too-slowly,
  // plus a relative lift on the rest from instant response.
  const missedLeads = leads * (missed / 100);
  const recovered = missedLeads * (closeRate / 100) * deal;
  const uplift = leads * (1 - missed / 100) * (closeRate / 100) * (D.speedUplift / 100) * deal;
  const monthlyGain = recovered + uplift;
  const annualGain = monthlyGain * 12;
  const extraCustomers = missedLeads * (closeRate / 100) + leads * (1 - missed / 100) * (closeRate / 100) * (D.speedUplift / 100);

  // Hours model
  const autoHours = hours * (autoPct / 100);
  const annualHours = autoHours * 52;
  const annualCost = autoHours * cost * 52;
  const weeklyBack = autoHours;

  const results =
    tab === 'leads'
      ? [
          { big: <CountUp value={monthlyGain} format={money} />, label: 'Recoverable revenue / month' },
          { big: <CountUp value={annualGain} format={money} />, label: 'Recoverable revenue / year' },
          { big: <CountUp value={extraCustomers} format={whole} />, label: 'Extra customers / month' },
        ]
      : [
          { big: <CountUp value={annualHours} format={whole} />, label: 'Hours saved / year' },
          { big: <CountUp value={annualCost} format={money} />, label: 'Staff cost saved / year' },
          { big: <CountUp value={weeklyBack} format={whole} />, label: 'Hours / week given back' },
        ];

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border bg-surface/50">
      {/* Tabs */}
      <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row">
        <TabButton active={tab === 'leads'} onClick={() => setTab('leads')} icon={<PhoneMissed className="h-4 w-4" />}>
          Revenue lost to slow leads
        </TabButton>
        <TabButton active={tab === 'hours'} onClick={() => setTab('hours')} icon={<Clock className="h-4 w-4" />}>
          Time lost to busywork
        </TabButton>
      </div>

      <div className="grid gap-8 p-6 md:grid-cols-2 md:p-8">
        {/* Inputs */}
        <div className="space-y-6">
          {tab === 'leads' ? (
            <>
              <Field label="New leads / month" value={leads} set={setLeads} min={20} max={2000} step={10} />
              <Field label="Avg. value of a customer" value={deal} set={setDeal} min={100} max={10000} step={50} prefix="$" />
              <Field label="Close rate on qualified leads" value={closeRate} set={setCloseRate} min={5} max={60} suffix="%" />
              <Field label="Leads missed or answered too slowly" value={missed} set={setMissed} min={5} max={70} suffix="%" />
            </>
          ) : (
            <>
              <Field label="Hours / week on repetitive work" value={hours} set={setHours} min={2} max={80} />
              <Field label="Blended staff cost / hour" value={cost} set={setCost} min={8} max={120} prefix="$" />
              <Field label="Share an AI agent can take over" value={autoPct} set={setAutoPct} min={20} max={95} suffix="%" />
            </>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">
            Estimates only — a directional model to size the opportunity, not a quote. Your free
            audit produces the real numbers.
          </p>
        </div>

        {/* Results */}
        <div className="flex flex-col justify-between gap-6 rounded-2xl border border-border bg-base/60 p-6">
          <div className="space-y-5">
            {results.map((r, i) => (
              <div key={i} className={cn(i === 0 && 'border-b border-border pb-5')}>
                <div
                  className={cn(
                    'font-display font-bold tracking-tight text-gradient',
                    i === 0 ? 'text-4xl md:text-5xl' : 'text-2xl',
                  )}
                >
                  {r.big}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{r.label}</p>
              </div>
            ))}
          </div>
          <Link
            href={SITE_CONFIG.primaryCta.href}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(59,130,246,0.8)] transition-transform hover:scale-[1.02]"
          >
            {SITE_CONFIG.primaryCta.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
        active
          ? 'bg-gradient-to-r from-navy-800 to-navy-600 text-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
      {children}
    </button>
  );
}
