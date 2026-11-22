import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Tile, type TileColor } from "./Tile";
import { DeltaPill } from "./Pill";

/**
 * Two-layer card (Layout → Two-layer card):
 * 1 · Shell       bg-canvas, radius 16, padding 4, ring, Elevation/XS
 * 2 · Header zone padding 12 — icon tile, title, meta / actions
 * 3 · Inner panel bg-surface, radius 12, padding 16, ring — holds the content
 * Rule: content lives in the inner panel; titles and meta stay in the shell header.
 */
export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex min-w-0 flex-col rounded-2xl bg-canvas p-1 shadow-card", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({
  icon,
  tile,
  title,
  description,
  meta,
  actions,
  className,
}: {
  icon?: ReactNode;
  tile?: TileColor;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-12 items-center gap-2.5 px-3 py-2.5", className)}>
      {icon && (tile ? <Tile color={tile} size="sm">{icon}</Tile> : <span className="inline-flex text-icon [&>svg]:size-4">{icon}</span>)}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 truncate t-heading text-ink">{title}</div>
        {description && <div className="mt-1 truncate t-caption text-ink-2">{description}</div>}
      </div>
      {meta && <div className="shrink-0 t-caption text-ink-3">{meta}</div>}
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  );
}

export function CardPanel({ className, children, flush, ...rest }: HTMLAttributes<HTMLDivElement> & { flush?: boolean }) {
  return (
    <div className={cn("min-w-0 flex-1 rounded-xl bg-surface shadow-card", !flush && "p-4", className)} {...rest}>
      {children}
    </div>
  );
}

/** Footer row inside the shell, under the panel ("Total change  −1,152"). */
export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex items-center justify-between px-3 pb-2 pt-3 t-body-medium", className)}>{children}</div>;
}

/** Card/KPI — label + prior in the shell header, value + unit + delta in the panel. */
export function KpiCard({
  label,
  icon,
  tile = "blue",
  prior,
  value,
  unit,
  delta,
  className,
  footer,
}: {
  label: string;
  icon: ReactNode;
  tile?: TileColor;
  prior?: string;
  value: string;
  unit?: string;
  delta?: { value: string; direction: "up" | "down" | "flat"; good?: boolean };
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader icon={icon} tile={tile} title={<span className="t-label">{label}</span>} meta={prior} className="min-h-0 py-2.5" />
      <CardPanel className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-1.5">
          <span className="t-num-lg text-ink">{value}</span>
          {unit && <span className="truncate t-caption text-ink-3">{unit}</span>}
        </div>
        {delta && <DeltaPill {...delta} />}
      </CardPanel>
      {footer}
    </Card>
  );
}

/** A plain bordered surface for big content areas (tables, editors). */
export function Panel({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("min-w-0 rounded-2xl bg-surface shadow-card", className)} {...rest}>
      {children}
    </div>
  );
}

/** Section heading used between card groups: "Sites 4 …… [search] [⋯]" */
export function SectionHeader({ title, count, actions, className }: { title: ReactNode; count?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <h2 className="t-heading text-ink">{title}</h2>
      {count !== undefined && (
        <span className="inline-grid h-6 min-w-6 place-items-center rounded-md bg-surface px-1.5 t-num-sm text-ink-2 shadow-control-soft">{count}</span>
      )}
      <div className="flex-1" />
      {actions}
    </div>
  );
}
