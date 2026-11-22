import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface Option<T extends string = string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  count?: ReactNode;
}

/** Segmented control — the "Group by Month · Site · Source" control and D/W/M toggles. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "sm",
  className,
  stretch,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "xs";
  className?: string;
  stretch?: boolean;
}) {
  return (
    <div role="tablist" className={cn("inline-flex items-center gap-0.5 rounded-[10px] bg-subtle p-0.5", stretch && "flex w-full", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-lg transition-[background-color,color,box-shadow] duration-150 [&>svg]:size-4",
              size === "sm" ? "h-7 px-2.5 t-label" : "h-6 px-2 t-caption-medium",
              stretch && "flex-1",
              active ? "bg-surface text-ink shadow-control" : "text-ink-2 hover:text-ink",
            )}
          >
            {o.icon}
            {o.label}
            {o.count !== undefined && <span className="t-num-sm text-ink-3">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Underline tabs — AEO Insights sub-navigation. */
export function Tabs<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("flex items-center gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative inline-flex h-10 shrink-0 items-center gap-1.5 px-2.5 t-label transition-colors duration-150 [&>svg]:size-4",
              active ? "text-ink" : "text-ink-2 hover:text-ink",
            )}
          >
            {o.icon}
            {o.label}
            {o.count !== undefined && (
              <span className={cn("rounded px-1 t-num-sm", active ? "bg-inverse text-on-inverse" : "bg-subtle text-ink-2")}>{o.count}</span>
            )}
            {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--text-primary)]" />}
          </button>
        );
      })}
    </div>
  );
}

/** Pill tabs (Learn → "All videos · Prompts · …"). */
export function PillTabs<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-full px-3 t-caption-medium transition-colors duration-150",
              active ? "bg-primary text-on-primary" : "bg-subtle text-ink-2 hover:bg-hover hover:text-ink",
            )}
          >
            {o.icon}
            {o.label}
            {o.count !== undefined && <span className="opacity-60">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
