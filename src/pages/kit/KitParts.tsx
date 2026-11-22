import { useState, type ReactNode } from "react";
import { Check, Copy } from "@phosphor-icons/react";
import { Card, CardPanel, useToast } from "@/components/ui";
import { PageSection } from "@/components/shell/PageHeader";
import { cn } from "@/lib/cn";

export const KIT_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "colour", label: "Colour" },
  { id: "typography", label: "Typography" },
  { id: "effects", label: "Effects" },
  { id: "layout", label: "Layout" },
  { id: "actions", label: "Actions" },
  { id: "inputs", label: "Inputs" },
  { id: "navigation", label: "Navigation" },
  { id: "data", label: "Data display" },
  { id: "feedback", label: "Feedback" },
  { id: "charts", label: "Charts" },
  { id: "marks", label: "Marks" },
] as const;

export type KitSectionId = (typeof KIT_SECTIONS)[number]["id"];

/** A documentation band: numbered eyebrow, title, intro, then blocks. */
export function KitSection({
  id,
  title,
  description,
  children,
  className,
}: {
  id: KitSectionId;
  title: string;
  description: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const index = KIT_SECTIONS.findIndex((s) => s.id === id) + 1;
  return (
    <>
      <span id={`kit-${id}`} data-kit-anchor={id} aria-hidden className="block scroll-mt-14 lg:scroll-mt-0" />
      <PageSection className={cn("flex flex-col gap-4 py-8 sm:py-10", className)}>
        <header className="flex max-w-2xl flex-col gap-2 pb-2">
          <span className="t-num-sm text-ink-3">{String(index).padStart(2, "0")}</span>
          <h2 className="t-display text-ink">{title}</h2>
          <p className="t-body text-ink-2">{description}</p>
        </header>
        {children}
      </PageSection>
    </>
  );
}

/** One documented component: title, one-line usage, live demo panel, code-name label. */
export function Block({
  title,
  usage,
  code,
  actions,
  children,
  className,
  panelClassName,
  flush,
}: {
  title: ReactNode;
  usage: ReactNode;
  code?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
  flush?: boolean;
}) {
  return (
    <Card className={className}>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2 px-3 pb-2.5 pt-3">
        <div className="min-w-0 flex-1 basis-56">
          <h3 className="t-heading text-ink">{title}</h3>
          <p className="mt-1 t-caption text-ink-2">{usage}</p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <CardPanel flush={flush} className={panelClassName}>
        {children}
      </CardPanel>
      {code && <CodeLabel code={code} />}
    </Card>
  );
}

export function CodeLabel({ code }: { code: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
      toast({ title: "Copied to clipboard", description: <code className="font-mono">{code}</code> });
    } catch {
      toast({ tone: "warning", title: "Couldn’t access the clipboard" });
    }
  };
  return (
    <div className="flex min-w-0 items-center gap-2 py-1.5 pl-3 pr-1.5">
      <code title={code} className="min-w-0 flex-1 truncate font-mono text-[11.5px] leading-5 text-ink-2">
        {code}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        title="Copy code"
        className="grid size-6 shrink-0 place-items-center rounded-md text-icon-subtle transition-colors hover:bg-subtle hover:text-ink"
      >
        {copied ? <Check weight="bold" className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}

/** Small caption under a demo item. */
export function Caption({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("t-caption text-ink-3", className)}>{children}</span>;
}

/** A labelled demo cell. */
export function Demo({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <div className="flex min-h-8 flex-wrap items-center gap-2">{children}</div>
      <Caption>{label}</Caption>
    </div>
  );
}

/** Row label used in matrices. */
export function MonoLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[11.5px] text-ink-2", className)}>{children}</span>;
}
