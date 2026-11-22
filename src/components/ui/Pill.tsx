import type { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

/**
 * DeltaPill — change vs prior period.
 * `good` decides colour (green = improvement), `direction` decides the arrow.
 * For visibility metrics "up" is good; for position/rank "down" is good.
 */
export function DeltaPill({
  value,
  direction,
  good,
  size = "sm",
  className,
}: {
  value: string;
  direction: "up" | "down" | "flat";
  good?: boolean;
  size?: "sm" | "xs";
  className?: string;
}) {
  const isGood = good ?? direction === "up";
  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-mono font-medium tabular-nums",
        size === "sm" ? "h-6 px-1.5 text-[12px]" : "h-5 px-1 text-[11px]",
        direction === "flat"
          ? "bg-subtle text-ink-2"
          : isGood
            ? "bg-success-subtle text-success"
            : "bg-danger-subtle text-danger",
        className,
      )}
    >
      {direction !== "flat" && <Icon weight="bold" className={size === "sm" ? "size-3" : "size-2.5"} />}
      {value}
    </span>
  );
}

/** Inline delta text without a pill (list rows, tables). */
export function DeltaText({ value, good, className }: { value: string; good: boolean | null; className?: string }) {
  return (
    <span
      className={cn(
        "t-num-sm-medium",
        good === null ? "text-ink-3" : good ? "text-success" : "text-danger",
        className,
      )}
    >
      {value}
    </span>
  );
}

export type StatusTone = "success" | "warning" | "danger" | "neutral" | "info";

/** StatusPill — Success/Warning carry a glowing dot; Neutral is a plain value chip. */
export function StatusPill({
  tone = "success",
  children,
  className,
  dot = true,
}: {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md bg-surface px-2 t-caption-medium shadow-control-soft",
        tone === "success" && "text-success",
        tone === "warning" && "text-warning",
        tone === "danger" && "text-danger",
        tone === "info" && "text-brand",
        tone === "neutral" && "text-ink-2",
        className,
      )}
    >
      {dot && tone !== "neutral" && <StatusDot tone={tone} />}
      {children}
    </span>
  );
}

export function StatusDot({ tone, className }: { tone: StatusTone; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-1.5 shrink-0 rounded-full",
        tone === "success" && "dot-success",
        tone === "warning" && "dot-warning",
        tone === "danger" && "dot-danger",
        tone === "info" && "bg-[var(--blue-500)]",
        tone === "neutral" && "bg-icon-muted",
        className,
      )}
    />
  );
}

export type BadgeTone = "neutral" | "inverse" | "blue" | "green" | "orange" | "red" | "purple" | "pink" | "outline";

/** Badge — small label (Pro, Beta, New, Scope 2, counts). */
export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded px-1.5 t-micro whitespace-nowrap",
        tone === "neutral" && "bg-subtle text-ink-2",
        tone === "inverse" && "bg-inverse text-on-inverse",
        tone === "outline" && "bg-surface text-ink-2 shadow-control-soft",
        tone === "blue" && "bg-brand-subtle text-brand",
        tone === "green" && "bg-success-subtle text-success",
        tone === "orange" && "bg-warning-subtle text-warning",
        tone === "red" && "bg-danger-subtle text-danger",
        tone === "purple" && "bg-[var(--purple-50)] text-[var(--purple-500)] [:root[data-theme=dark]_&]:bg-[rgb(123_66_255/0.16)] [:root[data-theme=dark]_&]:text-[#a98bff]",
        tone === "pink" && "bg-[var(--pink-50)] text-[var(--pink-600)] [:root[data-theme=dark]_&]:bg-[rgb(235_94_192/0.16)] [:root[data-theme=dark]_&]:text-[var(--pink-400)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Count chip next to section titles: "Sites 4". */
export function CountChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-grid h-6 min-w-6 place-items-center rounded-md bg-surface px-1.5 t-num-sm text-ink-2 shadow-control-soft", className)}>
      {children}
    </span>
  );
}
