import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

/**
 * Page header — 64px, padding 16/20, 1px bottom border. Title uses Title/18.
 * Keep at most one Primary Filled button in `actions`.
 */
export function PageHeader({
  title,
  breadcrumbs,
  actions,
  badge,
  className,
}: {
  title: ReactNode;
  breadcrumbs?: { label: string; to?: string }[];
  actions?: ReactNode;
  badge?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-16 shrink-0 flex-wrap items-center gap-3 border-b border-line px-5 py-3", className)}>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {breadcrumbs?.map((b) => (
          <span key={b.label} className="hidden items-center gap-2 t-title text-ink-3 sm:inline-flex">
            {b.to ? (
              <Link to={b.to} className="transition-colors hover:text-ink">
                {b.label}
              </Link>
            ) : (
              b.label
            )}
            <CaretRight className="size-3.5" />
          </span>
        ))}
        <h1 className="truncate t-title text-ink">{title}</h1>
        {badge}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Scrollable page body with standard padding. */
export function PageBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex flex-col gap-4 p-4 sm:p-5", className)}>{children}</div>;
}

/** A horizontal band divided from the next by a hairline — the overview page rhythm. */
export function PageSection({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("border-b border-line p-4 last:border-b-0 sm:p-5", className)}>{children}</section>;
}
