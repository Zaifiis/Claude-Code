export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="profinity-mark" x1="0" y1="0" x2="200" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#bfdcff" />
          <stop offset="50%" stopColor="#4f8ef7" />
          <stop offset="100%" stopColor="#8fc0ff" />
        </linearGradient>
      </defs>
      <path
        d="M50 20C27.9 20 10 37.9 10 60c0 22.1 17.9 40 40 40 12.5 0 23.7-5.7 31.1-14.7L100 68l18.9 17.3C126.3 94.3 137.5 100 150 100c22.1 0 40-17.9 40-40 0-22.1-17.9-40-40-40-12.5 0-23.7 5.7-31.1 14.7L100 52 81.1 34.7C73.7 25.7 62.5 20 50 20Zm0 20c11 0 20 9 20 20s-9 20-20 20-20-9-20-20 9-20 20-20Zm100 0c11 0 20 9 20 20s-9 20-20 20-20-9-20-20 9-20 20-20Z"
        fill="url(#profinity-mark)"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <LogoMark className="h-8 w-8 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight text-white">
          PROFINITY
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-brand-300">
          Solutions
        </span>
      </span>
    </span>
  );
}
