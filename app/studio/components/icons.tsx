/**
 * Line icons drawn on a 20pt grid with a 1.5pt stroke, so they sit next to
 * system text at the same optical weight. All of them inherit `currentColor`.
 */

type IconProps = { className?: string };

function Svg({ children, className }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
    >
      {children}
    </svg>
  );
}

export function GripIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx={7.5} cy={5} r={0.9} fill="currentColor" stroke="none" />
      <circle cx={12.5} cy={5} r={0.9} fill="currentColor" stroke="none" />
      <circle cx={7.5} cy={10} r={0.9} fill="currentColor" stroke="none" />
      <circle cx={12.5} cy={10} r={0.9} fill="currentColor" stroke="none" />
      <circle cx={7.5} cy={15} r={0.9} fill="currentColor" stroke="none" />
      <circle cx={12.5} cy={15} r={0.9} fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx={8.75} cy={8.75} r={5.25} />
      <path d="M12.75 12.75 17 17" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10 4.5v11M4.5 10h11" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />
    </Svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12.25 4.5 6.75 10l5.5 5.5" />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7.75 4.5 13.25 10l-5.5 5.5" />
    </Svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 7.75 10 12.75l5-5" />
    </Svg>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 5.5h9M7 10h9M7 14.5h9M4 5.5h.01M4 10h.01M4 14.5h.01" />
    </Svg>
  );
}

export function BoardIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x={3.25} y={3.75} width={4.5} height={12.5} rx={1.25} />
      <rect x={12.25} y={3.75} width={4.5} height={8} rx={1.25} />
    </Svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x={3.25} y={4.75} width={13.5} height={12} rx={2.5} />
      <path d="M3.25 8.75h13.5M7 3.25v3M13 3.25v3" />
    </Svg>
  );
}

export function ArchiveIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x={3.25} y={4} width={13.5} height={4} rx={1.5} />
      <path d="M4.75 8v6.5A2 2 0 0 0 6.75 16.5h6.5a2 2 0 0 0 2-2V8M8 11.5h4" />
    </Svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 6h11M8 6V4.5h4V6M6.25 6l.6 9.1a1.5 1.5 0 0 0 1.5 1.4h3.3a1.5 1.5 0 0 0 1.5-1.4l.6-9.1" />
    </Svg>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10 15.5V4.5M5.5 9 10 4.5 14.5 9" />
    </Svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx={10} cy={10} r={3.5} />
      <path d="M10 2.5v1.75M10 15.75v1.75M2.5 10h1.75M15.75 10h1.75M4.7 4.7l1.25 1.25M14.05 14.05l1.25 1.25M15.3 4.7l-1.25 1.25M5.95 14.05 4.7 15.3" />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15.5 12.4A6.5 6.5 0 0 1 7.6 4.5a6.5 6.5 0 1 0 7.9 7.9Z" />
    </Svg>
  );
}

export function HeadingIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 4.5v11M13 4.5v11M5 10h8" />
    </Svg>
  );
}

export function BulletIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 5.5h8M8 10h8M8 14.5h8" />
      <circle cx={4.5} cy={5.5} r={1} fill="currentColor" stroke="none" />
      <circle cx={4.5} cy={10} r={1} fill="currentColor" stroke="none" />
      <circle cx={4.5} cy={14.5} r={1} fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.5 10S5.5 5 10 5s7.5 5 7.5 5-3 5-7.5 5-7.5-5-7.5-5Z" />
      <circle cx={10} cy={10} r={2.25} />
    </Svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13.2 3.8l3 3L7.5 15.5l-4 1 1-4 8.7-8.7Z" />
    </Svg>
  );
}

export function ExpandIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5h4.5V8M8 16.5H3.5V12M16.5 3.5 11 9M3.5 16.5 9 11" />
    </Svg>
  );
}
