import type { ReactNode } from "react";
import { ChatCircleDots, ChatText, Robot, UsersThree } from "@phosphor-icons/react";
import {
  Badge,
  BrandMark,
  Card,
  CardPanel,
  DomainMark,
  ModelMark,
  MODELS,
  Skeleton,
  StatusPill,
  type BrandDef,
  type ModelId,
} from "@/components/ui";
import { cn } from "@/lib/cn";

export interface PreviewCompetitor {
  key: string;
  name: string;
  domain: string;
  brand?: BrandDef;
}

/**
 * Live workspace preview on the right of onboarding. Mirrors the form:
 * brand → competitors → models → prompts; the section for the current step is highlighted.
 */
export function OnboardingPreview({
  step,
  brand,
  industry,
  competitors,
  models,
  prompts,
  analysing,
}: {
  step: number;
  brand: BrandDef;
  industry?: string;
  competitors: PreviewCompetitor[];
  models: ModelId[];
  prompts: string[];
  analysing: boolean;
}) {
  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="t-caption-medium text-ink-2">Workspace preview</span>
        {analysing ? <StatusPill tone="warning">Analysing</StatusPill> : <StatusPill tone="neutral">Draft</StatusPill>}
      </div>
      <Card className="shadow-panel">
        <div className={cn("flex items-center gap-3 rounded-xl px-3 py-3 transition-shadow duration-300", step === 0 && "shadow-[0_0_0_1.5px_var(--border-brand)]")}>
          <BrandMark brand={brand} size={36} className="transition-colors duration-300" />
          <div className="min-w-0 flex-1">
            <div className="truncate t-heading text-ink">{brand.name || "Your brand"}</div>
            <div className="mt-1 truncate t-caption text-ink-3">{brand.domain || "yourdomain.com"}</div>
          </div>
          {industry && <Badge tone="outline">{industry}</Badge>}
        </div>
        <CardPanel flush className="flex flex-col gap-1 p-2">
          <PreviewBlock active={step === 1} icon={<UsersThree weight="duotone" />} title="Competitors" count={competitors.length}>
            {competitors.length === 0 ? (
              <Placeholder rows={2} />
            ) : (
              <div className="flex flex-col">
                {competitors.slice(0, 5).map((c) => (
                  <div key={c.key} className="flex items-center gap-2 py-1.5 animate-[sy-pop-in_200ms_var(--ease-out)]">
                    {c.brand ? <BrandMark brand={c.brand} size={18} /> : <DomainMark domain={c.domain} size={18} />}
                    <span className="t-body-medium text-ink">{c.name}</span>
                    <span className="truncate t-caption text-ink-3">{c.domain}</span>
                  </div>
                ))}
                {competitors.length > 5 && <span className="pt-1 t-caption text-ink-3">+{competitors.length - 5} more</span>}
              </div>
            )}
          </PreviewBlock>

          <PreviewBlock active={step === 2} icon={<Robot weight="duotone" />} title="AI models" count={models.length}>
            {models.length === 0 ? (
              <Placeholder rows={1} />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {models.map((m) => (
                  <span key={m} className="inline-flex h-7 items-center gap-1.5 rounded-full bg-surface pl-1 pr-2.5 t-caption-medium text-ink shadow-control-soft animate-[sy-pop-in_200ms_var(--ease-out)]">
                    <ModelMark id={m} size={20} className="rounded-full" />
                    {MODELS[m].name}
                  </span>
                ))}
              </div>
            )}
          </PreviewBlock>

          <PreviewBlock active={step === 3} icon={<ChatText weight="duotone" />} title="Prompts" count={prompts.length}>
            {prompts.length === 0 ? (
              <Placeholder rows={3} />
            ) : (
              <ul className="flex flex-col gap-1.5">
                {prompts.slice(0, 3).map((p) => (
                  <li key={p} className="truncate t-caption text-ink-2">
                    “{p}”
                  </li>
                ))}
                {prompts.length > 3 && <li className="t-caption text-ink-3">+{prompts.length - 3} more prompts</li>}
              </ul>
            )}
          </PreviewBlock>
        </CardPanel>
        <div className="flex items-center justify-between px-3 pb-2 pt-3 t-caption text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <ChatCircleDots className="size-3.5 text-icon-subtle" />
            <span className="t-num-sm-medium text-ink">{models.length * prompts.length}</span> answers per run
          </span>
          <span className="t-num-sm text-ink-3">Daily · 06:30 UTC</span>
        </div>
      </Card>
    </div>
  );
}

function PreviewBlock({ active, icon, title, count, children }: { active: boolean; icon: ReactNode; title: string; count: number; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-[10px] p-3 transition-[background-color,box-shadow] duration-300",
        active ? "bg-canvas shadow-[0_0_0_1.5px_var(--border-brand)]" : "bg-transparent",
      )}
    >
      <div className="mb-2 flex items-center gap-1.5 t-caption-medium text-ink-2 [&_svg]:size-4 [&_svg]:text-icon">
        {icon}
        {title}
        <span className="t-num-sm text-ink-3">{count}</span>
      </div>
      {children}
    </div>
  );
}

function Placeholder({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-2 py-0.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="size-[18px] rounded-[5px]" />
          <Skeleton className={cn("h-2.5", i % 2 ? "w-24" : "w-36")} />
        </div>
      ))}
    </div>
  );
}
