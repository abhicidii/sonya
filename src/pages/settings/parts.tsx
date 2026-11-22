import type { ReactNode } from "react";
import { Card, CardHeader, CardPanel, type TileColor } from "@/components/ui";
import { cn } from "@/lib/cn";

/** Two-layer settings card: title + description in the shell, content in the panel. */
export function SettingsCard({
  title,
  description,
  icon,
  tile,
  actions,
  children,
  flush,
  className,
  footer,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  tile?: TileColor;
  actions?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader title={title} description={description} icon={icon} tile={tile} actions={actions} />
      <CardPanel flush={flush} className={cn(flush && "px-4")}>
        {children}
      </CardPanel>
      {footer}
    </Card>
  );
}

/** Label-left / control-right row with a hairline between rows. */
export function SettingRow({ label, hint, children, className }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2 border-b border-line py-4 first:pt-0 last:border-b-0 last:pb-0 md:flex-row md:items-center md:gap-6", className)}>
      <div className="md:w-56 md:shrink-0">
        <div className="t-body-medium text-ink">{label}</div>
        {hint && <div className="mt-0.5 t-caption text-ink-3">{hint}</div>}
      </div>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/** Section title above a stack of cards. */
export function SectionIntro({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1">
        <h2 className="t-title text-ink">{title}</h2>
        <p className="mt-1 t-body text-ink-2">{description}</p>
      </div>
      {actions}
    </div>
  );
}

/** Small tag with an optional remove button (aliases). */
export function Tag({ children, onRemove }: { children: ReactNode; onRemove?: () => void }) {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-md bg-subtle pl-2 pr-1 t-caption-medium text-ink-2">
      {children}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${typeof children === "string" ? children : "tag"}`}
          onClick={onRemove}
          className="grid size-4 place-items-center rounded text-icon-muted transition-colors hover:bg-hover hover:text-ink"
        >
          <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden>
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </span>
  );
}
