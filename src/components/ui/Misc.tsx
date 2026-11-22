import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-grid h-5 min-w-5 place-items-center rounded-[5px] bg-surface px-1 font-sans text-[11px] font-medium text-ink-3 shadow-control-soft",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

const avatarColors = ["#2e90fa", "#ff8000", "#16b364", "#7b42ff", "#e708a4", "#525252"];

export function Avatar({
  name,
  src,
  size = 32,
  className,
}: {
  name: string;
  src?: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const color = avatarColors[name.length % avatarColors.length];
  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-medium text-white shadow-[0_0_0_1px_var(--ring-1)]", className)}
      style={{ width: size, height: size, fontSize: size * 0.38, background: src ? undefined : color }}
    >
      {src ? <img src={src} alt="" className="size-full object-cover" /> : initials}
    </span>
  );
}

export function AvatarStack({ names, max = 3, size = 22 }: { names: string[]; max?: number; size?: number }) {
  return (
    <span className="flex -space-x-1.5">
      {names.slice(0, max).map((n) => (
        <Avatar key={n} name={n} size={size} className="ring-2 ring-surface" />
      ))}
      {names.length > max && (
        <span
          className="inline-grid place-items-center rounded-full bg-subtle text-[10px] font-medium text-ink-2 ring-2 ring-surface"
          style={{ width: size, height: size }}
        >
          +{names.length - max}
        </span>
      )}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "block rounded-md bg-subtle bg-[linear-gradient(90deg,transparent,var(--bg-hover),transparent)] bg-[length:200px_100%] bg-no-repeat animate-[sy-shimmer_1.4s_ease-in-out_infinite]",
        className,
      )}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <div className="mb-4 grid size-12 place-items-center rounded-xl bg-surface text-icon shadow-card [&_svg]:size-6">{icon}</div>
      <div className="t-heading text-ink">{title}</div>
      {description && <p className="mt-1.5 max-w-sm t-body text-ink-2">{description}</p>}
      {action && <div className="mt-5 flex items-center gap-2">{action}</div>}
    </div>
  );
}

/** Ticked meter — solid fill over a dashed tick track (Source split card). */
export function TickMeter({
  value,
  max = 100,
  color = "var(--data-1)",
  className,
  height = 8,
}: {
  value: number;
  max?: number;
  color?: string;
  className?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("relative w-full overflow-hidden rounded-[3px]", className)} style={{ height }}>
      <div className="ticks absolute inset-0" />
      <div className="absolute inset-y-0 left-0 rounded-[3px] transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

/** Diverging tick meter around a centre line (Year-over-year card). */
export function DivergingMeter({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = Math.min(50, (Math.abs(value) / max) * 50);
  const good = value <= 0;
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-[3px]", className)}>
      <div className="ticks absolute inset-0" />
      <div className="absolute inset-y-[-2px] left-1/2 w-px bg-line-strong" />
      <div
        className="absolute inset-y-0 rounded-[3px]"
        style={{
          width: `${pct}%`,
          left: good ? `${50 - pct}%` : "50%",
          background: good ? "var(--status-success)" : "var(--status-danger)",
        }}
      />
    </div>
  );
}

/** Plain progress bar. */
export function Progress({ value, max = 100, tone = "ink", className }: { value: number; max?: number; tone?: "ink" | "blue" | "green" | "orange" | "red"; className?: string }) {
  const colors = {
    ink: "var(--primary-bg)",
    blue: "var(--blue-500)",
    green: "var(--status-success)",
    orange: "var(--status-warning)",
    red: "var(--status-danger)",
  };
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-subtle", className)}>
      <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${(value / max) * 100}%`, background: colors[tone] }} />
    </div>
  );
}

/** Score ring 0–100 (Site Health: Technical / AEO). */
export function ScoreRing({ value, size = 20, stroke = 3, showValue = false }: { value: number; size?: number; stroke?: number; showValue?: boolean }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = value >= 80 ? "var(--status-success)" : value >= 50 ? "var(--status-warning)" : "var(--status-danger)";
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-subtle)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`}
        />
      </svg>
      {showValue && <span className="absolute t-num-sm-medium text-ink">{value}</span>}
    </span>
  );
}

/** Five-step strength bars (Volume / Difficulty). */
export function LevelBars({ level, tone = "green" }: { level: number; tone?: "green" | "red" | "orange" | "blue" }) {
  const color = { green: "var(--status-success)", red: "var(--status-danger)", orange: "var(--status-warning)", blue: "var(--blue-500)" }[tone];
  return (
    <span className="inline-flex items-center gap-[2px]" aria-label={`${level} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="h-3 w-1 rounded-[1.5px]" style={{ background: i <= level ? color : "var(--bg-muted)" }} />
      ))}
    </span>
  );
}

/** Sentiment score pill: coloured dot + number. */
export function SentimentScore({ value }: { value: number }) {
  const tone = value >= 65 ? "dot-success" : value >= 45 ? "dot-warning" : "dot-danger";
  return (
    <span className="inline-flex items-center gap-1.5 t-num-sm-medium text-ink">
      <span className={cn("size-1.5 rounded-full", tone)} />
      {value}
    </span>
  );
}

export function Divider({ className, vertical }: { className?: string; vertical?: boolean }) {
  return <span className={cn(vertical ? "mx-1 h-5 w-px self-center" : "h-px w-full", "block bg-line", className)} />;
}

/** Simple hover tooltip (CSS only, no portal). */
export function Tooltip({ content, children, side = "top" }: { content: ReactNode; children: ReactNode; side?: "top" | "bottom" }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-inverse px-2 py-1.5 t-caption text-on-inverse shadow-tooltip animate-[sy-fade-in_120ms_ease-out]",
            side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
