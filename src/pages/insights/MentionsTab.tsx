import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowSquareOut, ChatCircleDots, FileText, Link as LinkIcon, Quotes, Sparkle } from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardPanel,
  CountChip,
  DeltaText,
  EmptyState,
  KpiCard,
  ModelMark,
  MODELS,
  Segmented,
  StatusPill,
  Toggle,
  type ModelId,
} from "@/components/ui";
import { BarChart, Legend, Sparkline, SplitBar } from "@/components/charts";
import { PageSection } from "@/components/shell/PageHeader";
import type { Filters } from "@/components/shell/FilterBar";
import { citedPages, days14, mentionsFeed, models, prompts } from "@/data/mock";
import { fmt } from "@/lib/cn";
import { RANGE_LABEL, RichText, scaleBy, selectedBrand, TONE, topicName, walk, type Tone } from "./_shared";

type Mention = { id: string; model: ModelId; prompt: string; excerpt: string; position: number; sentiment: Tone; cited: boolean; time: string };

const moreMentions: Mention[] = [
  {
    id: "m6",
    model: "chatgpt",
    prompt: "How to calculate activation rate",
    excerpt: "Activation rate = activated users ÷ new signups. **Lumen**'s guide recommends defining activation as the first meaningful action…",
    position: 1,
    sentiment: "positive",
    cited: true,
    time: "4 h ago",
  },
  {
    id: "m7",
    model: "perplexity",
    prompt: "Lumen vs Orbit for funnel analysis",
    excerpt: "**Lumen** offers unlimited funnel steps and account-level breakdowns; Orbit caps conversion windows on its Growth plan…",
    position: 1,
    sentiment: "positive",
    cited: true,
    time: "5 h ago",
  },
  {
    id: "m8",
    model: "aio",
    prompt: "Product analytics for mobile apps",
    excerpt: "For mobile, Orbit and Tidal have mature SDKs. **Lumen** supports iOS and Android, though its React Native SDK is newer…",
    position: 3,
    sentiment: "neutral",
    cited: false,
    time: "6 h ago",
  },
  {
    id: "m9",
    model: "gemini",
    prompt: "How to build a retention cohort chart",
    excerpt: "Most analytics tools — Orbit, **Lumen**, Parcel — generate cohort tables automatically from a signup event…",
    position: 2,
    sentiment: "neutral",
    cited: true,
    time: "8 h ago",
  },
  {
    id: "m10",
    model: "claude",
    prompt: "Is Lumen GDPR compliant?",
    excerpt: "**Lumen** states it is GDPR compliant, offers EU data residency and signs DPAs on all paid plans…",
    position: 1,
    sentiment: "positive",
    cited: true,
    time: "9 h ago",
  },
  {
    id: "m11",
    model: "copilot",
    prompt: "Warehouse-native analytics platforms",
    excerpt: "Warehouse-native options include Quanta and Tidal. **Lumen** can sync to Snowflake but isn't warehouse-native…",
    position: 4,
    sentiment: "negative",
    cited: false,
    time: "11 h ago",
  },
  {
    id: "m12",
    model: "chatgpt",
    prompt: "Best tools to measure product-led growth",
    excerpt: "**Lumen** ships PLG templates for activation, PQLs and expansion — a good fit for sales-assisted PLG teams…",
    position: 2,
    sentiment: "positive",
    cited: true,
    time: "Yesterday",
  },
];
const feed: Mention[] = [...mentionsFeed, ...moreMentions];

/** Gentler scale for counts that saturate (pages, daily bars). */
const RANGE_SCALE_PAGES: Record<string, number> = { "24h": 0.4, "7d": 1, "30d": 1.25, "90d": 1.45, ytd: 1.6 };

const FEED_MODELS: ModelId[] = ["chatgpt", "perplexity", "aio", "gemini", "claude", "copilot"];

export default function MentionsTab({ filters }: { filters: Filters }) {
  const nav = useNavigate();
  const brand = selectedBrand(filters);
  const [model, setModel] = useState<"all" | ModelId>(filters.model);
  const [citedOnly, setCitedOnly] = useState(false);
  useEffect(() => setModel(filters.model), [filters.model]);
  const [limit, setLimit] = useState(6);
  const topic = topicName(filters);

  const modelRows = filters.model === "all" ? models : models.filter((m) => m.id === filters.model);
  const brandScale = brand.mentions / 1284;
  const mentions = scaleBy(modelRows.reduce((a, m) => a + m.mentions, 0) * brandScale, filters.range);
  const citations = scaleBy(modelRows.reduce((a, m) => a + m.citations, 0) * brandScale, filters.range);
  const rate = mentions ? (citations / mentions) * 100 : 0;
  const ownedPages = Math.max(
    1,
    Math.round((filters.model === "all" ? 84 : 84 * (modelRows[0].citations / 264)) * Math.min(1.6, RANGE_SCALE_PAGES[filters.range] ?? 1)),
  );

  const topicPrompts = topic ? new Set(prompts.filter((p) => p.topic === topic).map((p) => p.text)) : null;
  const rows = feed
    .filter((m) => model === "all" || m.model === model)
    .filter((m) => !citedOnly || m.cited)
    .filter((m) => !topicPrompts || topicPrompts.has(m.prompt));

  const counts = Object.fromEntries(FEED_MODELS.map((id) => [id, feed.filter((m) => m.model === id).length]));

  const barModels = (filters.model === "all" ? models : models.filter((m) => m.id === filters.model)).slice(0, 6);
  const barSeries = barModels.map((m) => ({
    label: MODELS[m.id].name,
    color: MODELS[m.id].color,
    values: walk(`mentions-${m.id}`, (m.mentions / 14) * 1.08, m.mentions / 14 / 4, 14, m.mentions / 14 / 6).map((v) =>
      Math.max(0, Math.round(v * brandScale * (RANGE_SCALE_PAGES[filters.range] ?? 1))),
    ),
  }));
  const owned = scaleBy(citedPages.reduce((a, p) => a + p.citations, 0) * brandScale, filters.range);
  const earned = Math.round(owned * 1.34);

  return (
    <>
      <PageSection className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="success">Data updated Nov 6, 2026 · 06:30 UTC</StatusPill>
          <span className="t-caption text-ink-3">
            {RANGE_LABEL[filters.range]} · {filters.model === "all" ? "all models" : MODELS[filters.model].name}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Mentions"
            icon={<ChatCircleDots weight="fill" />}
            tile="blue"
            prior="vs 1,146"
            value={fmt.int(mentions)}
            unit="answers"
            delta={{ value: "+12.0%", direction: "up" }}
          />
          <KpiCard
            label="Citations"
            icon={<LinkIcon weight="bold" />}
            tile="orange"
            prior="vs 602"
            value={fmt.int(citations)}
            unit={`links to ${brand.domain}`}
            delta={{ value: "+14.1%", direction: "up" }}
          />
          <KpiCard
            label="Citation rate"
            icon={<Quotes weight="fill" />}
            tile="green"
            prior="vs 52.5%"
            value={fmt.pct(rate)}
            unit="of mentions"
            delta={{ value: "+1.0 pts", direction: "up" }}
          />
          <KpiCard
            label="Owned pages cited"
            icon={<FileText weight="fill" />}
            tile="pink"
            prior="vs 79"
            value={fmt.int(ownedPages)}
            unit="pages"
            delta={{ value: "+5", direction: "up" }}
          />
        </div>
      </PageSection>

      <PageSection className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,9fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader
            title="Mentions by model"
            description="Daily answers that mention you, stacked by AI model"
            meta={`${fmt.int(barSeries.reduce((a, s) => a + s.values.reduce((x, y) => x + y, 0), 0))} total`}
          />
          <CardPanel className="flex flex-col gap-4">
            <Legend items={barSeries.map((s) => ({ label: s.label, color: s.color }))} />
            <BarChart labels={days14} series={barSeries} height={220} format={(v) => fmt.int(v)} />
          </CardPanel>
        </Card>

        <Card>
          <CardHeader title="Where citations come from" description="Links to your pages vs third-party pages that name you" />
          <CardPanel className="flex flex-col gap-5">
            <div className="flex items-baseline gap-2">
              <span className="t-num-lg text-ink">{fmt.int(owned + earned)}</span>
              <span className="t-caption text-ink-2">citations mentioning {brand.name}</span>
            </div>
            <SplitBar
              height={10}
              parts={[
                { value: owned, color: "var(--data-1)", label: "Owned" },
                { value: earned, color: "var(--data-2)", label: "Earned" },
              ]}
            />
            <div className="flex flex-col">
              {[
                { label: "Owned", sub: `${brand.domain} pages`, value: owned, color: "var(--data-1)", delta: 8.2 },
                { label: "Earned", sub: "Reviews, forums, press", value: earned, color: "var(--data-2)", delta: 3.6 },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
                  <span className="size-2.5 rounded-[3px]" style={{ background: r.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="t-body-medium text-ink">{r.label}</div>
                    <div className="t-caption text-ink-3">{r.sub}</div>
                  </div>
                  <span className="t-num text-ink">{fmt.int(r.value)}</span>
                  <span className="w-12 text-right t-num-sm text-ink-3">{((r.value / (owned + earned)) * 100).toFixed(0)}%</span>
                  <DeltaText value={fmt.signedPct(r.delta)} good className="w-14 text-right" />
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-canvas p-3 t-caption text-ink-2">
              <Sparkle weight="fill" className="mt-0.5 size-3.5 shrink-0 text-brand" />
              <span>
                Perplexity cites your pages <span className="t-num-sm-medium text-ink">2.1×</span> more often than ChatGPT. Comparison pages earn the most
                links.
              </span>
            </div>
          </CardPanel>
        </Card>
      </PageSection>

      <PageSection className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,9fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader
            title={
              <>
                Latest mentions <CountChip>{rows.length}</CountChip>
              </>
            }
            description="Answers where AI named your brand"
            actions={<Toggle size="xs" checked={citedOnly} onChange={setCitedOnly} label="Cited only" />}
          />
          <CardPanel flush>
            <div className="overflow-x-auto border-b border-line p-2 [scrollbar-width:none]">
              <Segmented
                size="xs"
                value={model}
                onChange={(v) => (setModel(v), setLimit(6))}
                options={[
                  { value: "all" as const, label: "All", count: feed.length },
                  ...FEED_MODELS.map((id) => ({
                    value: id,
                    label: MODELS[id].name,
                    icon: <ModelMark id={id} size={14} className="[&>svg]:!size-[9px]" />,
                    count: counts[id],
                  })),
                ]}
              />
            </div>
            {rows.length === 0 ? (
              <EmptyState
                icon={<ChatCircleDots weight="duotone" />}
                title="No mentions match"
                description="No answers for this model and topic in the selected range. Try another model or turn off “Cited only”."
                action={
                  <Button variant="outlined" tone="secondary" onClick={() => (setModel("all"), setCitedOnly(false))}>
                    Show all mentions
                  </Button>
                }
              />
            ) : (
              <ul className="flex flex-col">
                {rows.slice(0, limit).map((m) => (
                  <li key={m.id} className="group flex gap-3 border-b border-line px-4 py-3.5 transition-colors last:border-b-0 hover:bg-canvas/60">
                    <ModelMark id={m.model} size={28} className="mt-0.5 rounded-full" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="t-caption-medium text-ink-2">{MODELS[m.model].name}</span>
                        <span className="t-caption text-ink-3">·</span>
                        <span className="t-caption text-ink-3">{m.time}</span>
                      </div>
                      <div className="mt-1 t-body-medium text-ink">{m.prompt}</div>
                      <p className="mt-1.5 border-l-2 border-line pl-3 t-body text-ink-2">
                        <RichText text={m.excerpt.replace(/\*\*Lumen\*\*/g, `**${brand.name}**`)} />
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <Badge tone="outline">
                          Position <span className="t-num-sm-medium text-ink">#{m.position}</span>
                        </Badge>
                        <StatusPill tone={TONE[m.sentiment].status} className="h-5">
                          {TONE[m.sentiment].label}
                        </StatusPill>
                        {m.cited ? (
                          <Badge tone="green">
                            <LinkIcon weight="bold" className="size-3" /> Cited
                          </Badge>
                        ) : (
                          <Badge tone="neutral">Not cited</Badge>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Open prompt"
                      title="Open prompt"
                      onClick={() => nav("/prompts")}
                      className="grid size-7 shrink-0 place-items-center rounded-md text-icon-muted opacity-0 transition-[opacity,background-color] hover:bg-subtle hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <ArrowSquareOut className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardPanel>
          {rows.length > limit && (
            <CardFooter className="justify-center">
              <Button size="xs" variant="link" tone="secondary" onClick={() => setLimit((l) => l + 6)}>
                Show {Math.min(6, rows.length - limit)} more
              </Button>
            </CardFooter>
          )}
        </Card>

        <Card className="self-start">
          <CardHeader title="Most cited pages" description="Your URLs AI links to most" meta={RANGE_LABEL[filters.range]} />
          <CardPanel flush className="px-4">
            {citedPages
              .filter((p) => filters.model === "all" || p.models.includes(filters.model))
              .map((p, i) => (
                <div key={p.url} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
                  <span className="w-4 t-num-sm text-ink-3">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate t-body-medium text-ink">{p.title}</div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="truncate t-caption text-ink-3">{p.url}</span>
                      <span className="flex shrink-0 -space-x-1">
                        {p.models.map((id) => (
                          <ModelMark key={id} id={id} size={14} className="rounded-full ring-2 ring-surface" />
                        ))}
                      </span>
                    </div>
                  </div>
                  <span className="hidden sm:block">
                    <Sparkline
                      values={walk(p.url, p.citations, p.delta * 2, 10, p.citations / 14)}
                      color={p.delta >= 0 ? "var(--status-success)" : "var(--status-danger)"}
                      width={56}
                      height={22}
                    />
                  </span>
                  <div className="w-16 text-right">
                    <div className="t-num text-ink">{fmt.int(scaleBy(p.citations, filters.range))}</div>
                    <DeltaText value={fmt.signedPct(p.delta, 0)} good={p.delta >= 0} />
                  </div>
                </div>
              ))}
          </CardPanel>
          <CardFooter>
            <span className="t-caption text-ink-2">
              Top {citedPages.length} of {ownedPages} cited pages
            </span>
            <Button size="xs" variant="link" tone="secondary" iconRight={<ArrowSquareOut className="size-3.5" />} onClick={() => nav("/site-health")}>
              View all
            </Button>
          </CardFooter>
        </Card>
      </PageSection>
    </>
  );
}
