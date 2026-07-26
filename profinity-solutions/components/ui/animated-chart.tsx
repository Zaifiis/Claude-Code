'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Small, brand-styled chart primitives drawn with SVG. Each animates once when
// it scrolls into view and honours prefers-reduced-motion.

function useReveal(amount = 0.5) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount });
  const reduce = useReducedMotion();
  return { ref, active: inView, reduce };
}

// Animated vertical bars for before/after or short trend comparisons.
export function AnimatedBars({
  values,
  captions,
  className,
}: {
  values: number[];
  captions?: string[];
  className?: string;
}) {
  const { ref, active, reduce } = useReveal();
  const [p, setP] = useState(reduce ? 1 : 0);

  useEffect(() => {
    if (!active || reduce) return;
    const controls = animate(0, 1, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setP,
    });
    return () => controls.stop();
  }, [active, reduce]);

  const w = 220;
  const h = 120;
  const gap = 24;
  const bw = (w - gap * (values.length - 1)) / values.length;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${w} ${h + 22}`}
      className={cn('h-full w-full', className)}
      role="img"
      aria-label="Bar chart comparing values"
    >
      <defs>
        <linearGradient id="bar-grad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#2159c9" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
      </defs>
      {values.map((v, i) => {
        const bh = (v / 100) * h * p;
        const last = i === values.length - 1;
        return (
          <g key={i}>
            <rect
              x={i * (bw + gap)}
              y={h - bh}
              width={bw}
              height={bh}
              rx={6}
              fill={last ? 'url(#bar-grad)' : 'rgba(148,163,184,0.28)'}
            />
            {captions?.[i] && (
              <text
                x={i * (bw + gap) + bw / 2}
                y={h + 16}
                textAnchor="middle"
                className="fill-[#a9b6cc]"
                fontSize="11"
              >
                {captions[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// Animated growth line with a soft area fill and a leading dot.
export function AnimatedLine({ values, className }: { values: number[]; className?: string }) {
  const { ref, active, reduce } = useReveal();
  const pathRef = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(0);
  const [draw, setDraw] = useState(reduce ? 1 : 0);

  useEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength());
  }, [values]);

  useEffect(() => {
    if (!active || reduce) return;
    const controls = animate(0, 1, { duration: 1.3, ease: [0.4, 0, 0.2, 1], onUpdate: setDraw });
    return () => controls.stop();
  }, [active, reduce]);

  const w = 220;
  const h = 120;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - (v / max) * (h - 12) - 6;
    return [x, y] as const;
  });
  const line = pts.map((pt, i) => `${i ? 'L' : 'M'}${pt[0]},${pt[1]}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const lead = pts[pts.length - 1];

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${w} ${h}`}
      className={cn('h-full w-full', className)}
      role="img"
      aria-label="Line chart showing growth over time"
    >
      <defs>
        <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#a8e2fd" />
        </linearGradient>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(56,189,248,0.28)" />
          <stop offset="100%" stopColor="rgba(56,189,248,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#area-grad)" opacity={draw} />
      <path
        ref={pathRef}
        d={line}
        fill="none"
        stroke="url(#line-grad)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - draw)}
      />
      {draw > 0.85 && (
        <circle cx={lead[0]} cy={lead[1]} r={4.5} fill="#a8e2fd" stroke="#050914" strokeWidth={2} />
      )}
    </svg>
  );
}

// Animated progress ring for a single headline percentage.
export function ProgressRing({
  value,
  label,
  className,
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const { ref, active, reduce } = useReveal();
  const [p, setP] = useState(reduce ? 1 : 0);

  useEffect(() => {
    if (!active || reduce) return;
    const controls = animate(0, 1, { duration: 1.2, ease: [0.22, 1, 0.36, 1], onUpdate: setP });
    return () => controls.stop();
  }, [active, reduce]);

  const size = 132;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value, 100);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('h-full w-full', className)}
      role="img"
      aria-label={label ?? `${value} percent`}
    >
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a8e2fd" />
          <stop offset="100%" stopColor="#2159c9" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#ring-grad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - (pct / 100) * p)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="52%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-[#f1f5f9] font-display"
        fontSize="26"
        fontWeight="700"
      >
        {Math.round(pct * p)}%
      </text>
    </svg>
  );
}
