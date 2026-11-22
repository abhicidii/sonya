import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, DownloadSimple, GraduationCap, Info, Sparkle } from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardPanel,
  CountChip,
  DeltaPill,
  DeltaText,
  ModelMark,
  MODELS,
  Segmented,
  SentimentScore,
  StatusPill,
  Table,
  Td,
  Th,
  THead,
  TickMeter,
  Tooltip,
  Tr,
  useToast,
  type ModelId,
} from "@/components/ui";
import { Donut, LineChart, Sparkline } from "@/components/charts";
import { FilterBar, useFilters } from "@/components/shell/FilterBar";
import { PageHeader, PageSection } from "@/components/shell/PageHeader";
import { useShell } from "@/components/shell/ShellContext";
import { days14, models, prompts } from "@/data/mock";
import { cn, fmt } from "@/lib/cn";
import { downloadCsv, RANGE_LABEL, scaleBy, selectedBrand, sortHeader, topicName, walk, type SortDir } from "@/pages/insights/_shared";

type SortKey = "visibility" | "mentions" | "citations" | "position" | "sentiment" | "share";
const ALL: ModelId[] = models.map((m) => m.id);

export default function LlmPage() {
  const nav = useNavigate();
  const toast = useToast();
  const { openLearn } = useShell();
  const [filters, setFilters] = useFilters();
  const [hidden, setHidden] = useState<ModelId[]>([]);
  const [focus, setFocus] = useState<ModelId | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "visibility", dir: "desc" });
  const [mode, setMode] = useState<"split" | "all">("split");
  const th = sortHeader(sort, setSort);

  const brand = selectedBrand(filters);
  const k = brand.visibility / 41.8;
  const data = models.map((m) => ({
    ...m,
    visibility: +(m.visibility * k).toFixed(1),
    mentions: scaleBy(m.mentions * (brand.mentions / 1284), filters.range),
    citations: scaleBy(m.citations * (brand.mentions / 1284), filters.range),
    trend: walk(`llm-${m.id}-${brand.id}`, m.visibility * k, m.delta * 1.6, 14, 1.3),
  }));

  const sorted = [...data].sort((a, b) => {
    const d = a[sort.key] - b[sort.key];
    return sort.dir === "desc" ? -d : d;
  });

  const series = data
    .filter((m) => !hidden.includes(m.id))
    .map((m) => ({ id: m.id, label: MODELS[m.id].name, values: m.trend, color: MODELS[m.id].color, emphasis: focus ? focus === m.id : undefined }));

  const toggleSeries = (id: ModelId) => setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : h.length >= ALL.length - 1 ? h : [...h, id]));

  // "Where models disagree": tracked prompts scored by how split the engines are.
  const topic = topicName(filters);
  const disagree = prompts
    .filter((p) => p.status === "active")
    .filter((p) => !topic || p.topic === topic)
    .filter((p) => filters.branded === "all" || (filters.branded === "branded" ? p.branded : !p.branded))
    .map((p) => ({ ...p, hits: ALL.filter((m) => p.models.includes(m)).length }))
    .filter((p) => mode === "all" || (p.hits > 0 && p.hits < ALL.length))
    .sort((a, b) => Math.abs(a.hits - ALL.length / 2) - Math.abs(b.hits - ALL.length / 2) || b.volume - a.volume);

  const best = [...data].sort((a, b) => b.visibility - a.visibility)[0];
  const worst = [...data].sort((a, b) => a.visibility - b.visibility)[0];

  const exportCsv = () => {
    downloadCsv("llm-analytics.csv", [
      ["Model", "Visibility %", "Mentions", "Citations", "Avg position", "Sentiment", "Share of answers %"],
      ...data.map((m) => [MODELS[m.id].name, m.visibility, m.mentions, m.citations, m.position, m.sentiment, m.share]),
    ]);
    toast({ title: "Exported LLM analytics", description: "llm-analytics.csv saved to your downloads." });
  };

  return (
    <>
      <PageHeader
        title="LLM Analytics"
        actions={
          <>
            <Button variant="outlined" tone="secondary" iconLeft={<GraduationCap weight="duotone" className="size-4" />} onClick={() => openLearn("videos")}>
              Learn
            </Button>
            <Button iconLeft={<DownloadSimple weight="bold" className="size-4" />} onClick={exportCsv}>
              Export
            </Button>
          </>
        }
      />
      <div className="border-b border-line px-5 py-3">
        <FilterBar value={filters} onChange={setFilters} show={["brand", "range", "granularity", "branded", "topic", "location"]} />
      </div>

      {/* Per-model KPI cards */}
      <PageSection className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="success">6 models tracked</StatusPill>
          <span className="t-caption text-ink-3">{RANGE_LABEL[filters.range]} · click a model to highlight it in the chart</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {data.map((m) => {
            const on = focus === m.id;
            return (
              <Card
                key={m.id}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                onClick={() => setFocus(on ? null : m.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setFocus(on ? null : m.id))}
                className={cn(
                  "cursor-pointer transition-[box-shadow,opacity] duration-150",
                  on && "shadow-[0_0_0_1.5px_var(--text-primary)]",
                  focus && !on && "opacity-60 hover:opacity-100",
                )}
              >
                <CardHeader
                  title={
                    <>
                      <ModelMark id={m.id} size={20} className="rounded-full" />
                      <span className="truncate t-label">{MODELS[m.id].name}</span>
                    </>
                  }
                  meta={`${m.share}% share`}
                  className="min-h-0 py-2.5"
                />
                <CardPanel className="flex flex-col gap-3">
                  <div className="flex items-end justify-between gap-2">
                    <div className="flex items-baseline gap-1">
                      <span className="t-num-lg text-ink">{m.visibility.toFixed(1)}</span>
                      <span className="t-caption text-ink-3">%</span>
                    </div>
                    <DeltaPill value={fmt.signed(m.delta)} direction={m.delta >= 0 ? "up" : "down"} size="xs" />
                  </div>
                  <Sparkline values={m.trend} color={MODELS[m.id].color} width={200} height={28} />
                  <div className="flex justify-between t-caption text-ink-3">
                    <span>
                      <span className="t-num-sm text-ink-2">{fmt.compact(m.mentions)}</span> mentions
                    </span>
                    <span>
                      <span className="t-num-sm text-ink-2">#{m.position.toFixed(1)}</span> pos.
                    </span>
                  </div>
                </CardPanel>
              </Card>
            );
          })}
        </div>
      </PageSection>

      {/* Trend + share of answers */}
      <PageSection className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,9fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader title="Visibility by model" description="Share of each model's answers that mention you · click a legend item to hide it" />
          <CardPanel className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="t-num-lg text-ink">{fmt.pct(brand.visibility)}</span>
              <span className="t-caption text-ink-2">blended visibility</span>
              <span className="flex-1" />
              <StatusPill tone="info">
                Best on {MODELS[best.id].name} · {best.visibility.toFixed(1)}%
              </StatusPill>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {ALL.map((id) => {
                const off = hidden.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={!off}
                    onClick={() => toggleSeries(id)}
                    className={cn(
                      "inline-flex h-6 items-center gap-1.5 rounded-md px-1.5 t-caption transition-[background-color,opacity] hover:bg-subtle",
                      off ? "text-ink-3 opacity-60" : "text-ink-2",
                    )}
                  >
                    <span className="size-2.5 rounded-[3px] transition-colors" style={{ background: off ? "var(--bg-muted)" : MODELS[id].color }} />
                    <span className={cn(off && "line-through")}>{MODELS[id].name}</span>
                  </button>
                );
              })}
            </div>
            <LineChart labels={days14} series={series} height={248} area={false} format={(v) => `${v.toFixed(1)}%`} />
          </CardPanel>
        </Card>

        <Card>
          <CardHeader title="Share of answers" description="Where your mentions come from" />
          <CardPanel className="flex flex-col items-center gap-5">
            <Donut
              size={188}
              data={data.map((m) => ({ label: MODELS[m.id].name, value: m.share, color: MODELS[m.id].color }))}
              center={
                <div>
                  <div className="t-num-lg text-ink">{fmt.compact(data.reduce((a, m) => a + m.mentions, 0))}</div>
                  <div className="t-caption text-ink-2">mentions</div>
                </div>
              }
            />
            <div className="grid w-full grid-cols-2 gap-x-4 gap-y-2">
              {data.map((m) => (
                <div key={m.id} className="flex items-center gap-2 t-caption">
                  <span className="size-2.5 rounded-[3px]" style={{ background: MODELS[m.id].color }} />
                  <span className="flex-1 truncate text-ink-2">{MODELS[m.id].name}</span>
                  <span className="t-num-sm-medium text-ink">{m.share}%</span>
                </div>
              ))}
            </div>
          </CardPanel>
          <CardFooter>
            <span className="t-caption text-ink-2">Weakest engine</span>
            <span className="flex items-center gap-1.5 t-caption-medium text-ink">
              <ModelMark id={worst.id} size={14} className="rounded-full" />
              {MODELS[worst.id].name} · <span className="t-num-sm-medium text-danger">{worst.visibility.toFixed(1)}%</span>
            </span>
          </CardFooter>
        </Card>
      </PageSection>

      {/* Comparison table */}
      <PageSection>
        <Card>
          <CardHeader title="Model comparison" description="Every metric, side by side · click a column to sort" />
          <CardPanel flush className="p-2">
            <Table className="min-w-[820px]">
              <THead>
                <tr>
                  <Th>Model</Th>
                  <Th {...th("visibility")}>Visibility</Th>
                  <Th align="right" {...th("mentions")}>
                    Mentions
                  </Th>
                  <Th align="right" {...th("citations")}>
                    Citations
                  </Th>
                  <Th align="right" {...th("position")}>
                    Avg. pos.
                  </Th>
                  <Th align="right" {...th("sentiment")}>
                    Sentiment
                  </Th>
                  <Th {...th("share")}>Share of answers</Th>
                </tr>
              </THead>
              <tbody>
                {sorted.map((m) => (
                  <Tr key={m.id} interactive selected={focus === m.id} onClick={() => setFocus(focus === m.id ? null : m.id)}>
                    <Td>
                      <span className="flex items-center gap-2.5">
                        <ModelMark id={m.id} size={22} className="rounded-full" />
                        <span className="t-body-medium">{MODELS[m.id].name}</span>
                        {m.id === best.id && <Badge tone="green">Best</Badge>}
                      </span>
                    </Td>
                    <Td>
                      <span className="flex items-center gap-2">
                        <span className="w-12 t-num">{fmt.pct(m.visibility)}</span>
                        <DeltaText value={fmt.signed(m.delta)} good={m.delta >= 0} />
                      </span>
                    </Td>
                    <Td align="right" className="t-num">
                      {fmt.int(m.mentions)}
                    </Td>
                    <Td align="right">
                      <span className="t-num">{fmt.int(m.citations)}</span>
                      <span className="ml-1.5 t-num-sm text-ink-3">{((m.citations / Math.max(1, m.mentions)) * 100).toFixed(0)}%</span>
                    </Td>
                    <Td align="right" className="t-num text-ink-2">
                      #{m.position.toFixed(1)}
                    </Td>
                    <Td align="right">
                      <SentimentScore value={m.sentiment} />
                    </Td>
                    <Td>
                      <span className="flex items-center gap-3">
                        <TickMeter value={m.share} max={40} color={MODELS[m.id].color} className="w-28" />
                        <span className="t-num">{m.share}%</span>
                      </span>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </CardPanel>
        </Card>
      </PageSection>

      {/* Where models disagree */}
      <PageSection>
        <Card>
          <CardHeader
            title={
              <>
                Where models disagree <CountChip>{disagree.length}</CountChip>
              </>
            }
            description="Prompts where some engines mention you and others don't"
            actions={
              <Segmented
                size="xs"
                value={mode}
                onChange={setMode}
                options={[
                  { value: "split", label: "Split only" },
                  { value: "all", label: "All prompts" },
                ]}
              />
            }
          />
          <CardPanel flush>
            <div className="hidden items-center gap-3 border-b border-line px-4 py-2 t-caption text-ink-3 md:flex">
              <span className="flex-1">Prompt</span>
              <span className="flex w-[180px] justify-between">
                {ALL.map((id) => (
                  <span key={id} className="grid w-6 place-items-center" title={MODELS[id].name}>
                    <ModelMark id={id} size={14} className="rounded-full" />
                  </span>
                ))}
              </span>
              <span className="w-20 text-right">Agreement</span>
              <span className="w-6" />
            </div>
            {disagree.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-8 t-body text-ink-2">
                <Info className="size-4 text-icon-muted" /> No prompts match these filters.
              </div>
            ) : (
              disagree.slice(0, 10).map((p) => (
                <div key={p.id} className="group flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-3 last:border-b-0 hover:bg-canvas/60">
                  <div className="min-w-0 flex-1 basis-60">
                    <div className="truncate t-body-medium text-ink">{p.text}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 t-caption text-ink-3">
                      <span># {p.topic}</span>
                      <span>·</span>
                      <span>{p.intent}</span>
                    </div>
                  </div>
                  <span className="flex w-[180px] justify-between">
                    {ALL.map((id) => {
                      const hit = p.models.includes(id);
                      return (
                        <Tooltip key={id} content={`${MODELS[id].name} · ${hit ? "mentions you" : "doesn't mention you"}`}>
                          <span className="grid size-6 place-items-center" tabIndex={0} aria-label={`${MODELS[id].name}: ${hit ? "hit" : "miss"}`}>
                            <span className={cn("size-2.5 rounded-full", hit ? "dot-success" : "shadow-[inset_0_0_0_1.5px_var(--status-danger)]")} />
                          </span>
                        </Tooltip>
                      );
                    })}
                  </span>
                  <span className="w-20 text-right">
                    <span className="t-num-sm-medium text-ink">{p.hits}</span>
                    <span className="t-num-sm text-ink-3">/{ALL.length}</span>
                  </span>
                  <button
                    type="button"
                    aria-label="Open prompt"
                    title="Open prompt"
                    onClick={() => nav("/prompts")}
                    className="grid size-6 place-items-center rounded-md text-icon-muted transition-colors hover:bg-subtle hover:text-ink"
                  >
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </CardPanel>
          <CardFooter>
            <span className="flex items-center gap-1.5 t-caption text-ink-2">
              <Sparkle weight="fill" className="size-3.5 text-brand" />
              Prompts missed by Perplexity usually lack a cited comparison page.
            </span>
            <Button size="xs" variant="link" tone="secondary" onClick={() => nav("/opportunities")} iconRight={<ArrowRight className="size-3.5" />}>
              Opportunities
            </Button>
          </CardFooter>
        </Card>
      </PageSection>
    </>
  );
}
