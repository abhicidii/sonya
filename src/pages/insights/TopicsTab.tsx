import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CaretRight, Plus, TrendDown, TrendUp, Target } from "@phosphor-icons/react";
import {
  Badge,
  BrandMark,
  Button,
  Card,
  CardHeader,
  CardPanel,
  CountChip,
  DeltaText,
  LevelBars,
  ModelMark,
  SentimentScore,
  Table,
  Td,
  Th,
  THead,
  Tr,
  useToast,
  type TileColor,
} from "@/components/ui";
import { Legend, Sparkline, SplitBar } from "@/components/charts";
import { PageSection } from "@/components/shell/PageHeader";
import type { Filters } from "@/components/shell/FilterBar";
import { brands, prompts, topics } from "@/data/mock";
import { cn, fmt } from "@/lib/cn";
import { brandColor, rand, sortHeader, type SortDir } from "./_shared";

type SortKey = "visibility" | "sov" | "position" | "sentiment" | "volume" | "prompts";

export default function TopicsTab({ filters }: { filters: Filters }) {
  const nav = useNavigate();
  const toast = useToast();
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "visibility", dir: "desc" });
  const [open, setOpen] = useState<string | null>(filters.topic === "all" ? topics[0].id : filters.topic);
  const th = sortHeader(sort, setSort);

  useEffect(() => {
    if (filters.topic !== "all") setOpen(filters.topic);
  }, [filters.topic]);

  // Model filter nudges per-topic visibility so the table reacts.
  const data = topics.map((t) => {
    const f = filters.model === "all" ? 1 : 0.7 + rand(`${filters.model}-${t.id}`) * 0.6;
    return { ...t, visibility: Math.round(t.visibility * f), trend: t.trend.map((v) => v * f) };
  });
  const rows = [...data].sort((a, b) => {
    const d = a[sort.key] - b[sort.key];
    return sort.dir === "desc" ? -d : d;
  });

  // Opportunity callouts derived from the data.
  const gap = [...data].filter((t) => t.volume >= 4).sort((a, b) => a.visibility - b.visibility)[0];
  const falling = [...data].sort((a, b) => a.delta - b.delta)[0];
  const rising = [...data].sort((a, b) => b.delta - a.delta)[0];
  const callouts: { topic: (typeof data)[number]; tile: TileColor; icon: JSX.Element; kicker: string; text: string; cta: string }[] = [
    {
      topic: gap,
      tile: "orange",
      icon: <Target weight="fill" />,
      kicker: "Biggest gap",
      text: `High-volume topic where you show up in only ${gap.visibility}% of answers. Orbit leads with a dedicated guide.`,
      cta: "Create brief",
    },
    {
      topic: falling,
      tile: "pink",
      icon: <TrendDown weight="bold" />,
      kicker: "Losing ground",
      text: `Visibility fell ${Math.abs(falling.delta)} pts this period. Refresh the pages engines cite for this topic.`,
      cta: "See prompts",
    },
    {
      topic: rising,
      tile: "green",
      icon: <TrendUp weight="bold" />,
      kicker: "Momentum",
      text: `Up ${rising.delta} pts — your fastest-growing topic. Add prompts to track it more closely.`,
      cta: "Add prompts",
    },
  ];

  const onCallout = (c: (typeof callouts)[number]) => {
    if (c.cta === "See prompts") {
      setOpen(c.topic.id);
      document.getElementById(`topic-${c.topic.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (c.cta === "Create brief") {
      toast({
        title: `Brief created for “${c.topic.name}”`,
        description: "Find it in Content → Briefs.",
        action: { label: "Open", onClick: () => nav("/content") },
      });
    } else {
      nav("/prompts/research");
    }
  };

  const competitors = brands.slice(0, 3);

  return (
    <>
      <PageSection className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {callouts.map((c) => (
          <Card key={c.kicker}>
            <CardHeader
              icon={c.icon}
              tile={c.tile}
              title={<span className="t-label">{c.kicker}</span>}
              meta={<DeltaText value={fmt.signed(c.topic.delta) + " pts"} good={c.topic.delta >= 0} />}
              className="min-h-0 py-2.5"
            />
            <CardPanel className="flex flex-1 flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate t-body-medium text-ink">{c.topic.name}</span>
                <span className="t-num text-ink">{c.topic.visibility}%</span>
              </div>
              <p className="flex-1 t-caption text-ink-2">{c.text}</p>
              <Button
                size="xs"
                variant="outlined"
                tone="secondary"
                className="self-start"
                iconRight={<ArrowRight className="size-3.5" />}
                onClick={() => onCallout(c)}
              >
                {c.cta}
              </Button>
            </CardPanel>
          </Card>
        ))}
      </PageSection>

      <PageSection>
        <Card>
          <CardHeader
            title={
              <>
                Topics <CountChip>{rows.length}</CountChip>
              </>
            }
            description="Visibility across the topics your prompts belong to · expand a topic to see its prompts"
            actions={
              <Button size="xs" variant="outlined" tone="secondary" iconLeft={<Plus weight="bold" className="size-3" />} onClick={() => nav("/prompts")}>
                Add topic
              </Button>
            }
          />
          <CardPanel flush className="p-2">
            <Table className="min-w-[900px]">
              <THead>
                <tr>
                  <Th className="w-8" />
                  <Th>Topic</Th>
                  <Th {...th("visibility")}>Visibility</Th>
                  <Th align="right" {...th("sov")}>
                    SOV
                  </Th>
                  <Th align="right" {...th("position")}>
                    Avg. pos.
                  </Th>
                  <Th align="right" {...th("sentiment")}>
                    Sentiment
                  </Th>
                  <Th {...th("volume")}>Volume</Th>
                  <Th align="right">Trend</Th>
                </tr>
              </THead>
              <tbody>
                {rows.map((t) => {
                  const expanded = open === t.id;
                  const list = prompts
                    .filter((p) => p.topic === t.name)
                    .filter((p) => filters.branded === "all" || (filters.branded === "branded" ? p.branded : !p.branded));
                  return (
                    <Fragment key={t.id}>
                      <Tr
                        id={`topic-${t.id}`}
                        interactive
                        selected={filters.topic === t.id}
                        onClick={() => setOpen(expanded ? null : t.id)}
                        aria-expanded={expanded}
                      >
                        <Td className="pr-0">
                          <CaretRight weight="bold" className={cn("size-3.5 text-icon transition-transform duration-200 ease-out", expanded && "rotate-90")} />
                        </Td>
                        <Td>
                          <div className="t-body-medium text-ink">{t.name}</div>
                          <div className="t-caption text-ink-3">{t.prompts} prompts</div>
                        </Td>
                        <Td>
                          <span className="flex items-center gap-2.5">
                            <span className="relative h-1.5 w-20 overflow-hidden rounded-full bg-subtle">
                              <span className="absolute inset-y-0 left-0 rounded-full bg-[var(--data-1)]" style={{ width: `${t.visibility}%` }} />
                            </span>
                            <span className="w-9 t-num">{t.visibility}%</span>
                            <DeltaText value={fmt.signed(t.delta)} good={t.delta >= 0} />
                          </span>
                        </Td>
                        <Td align="right" className="t-num">
                          {t.sov}%
                        </Td>
                        <Td align="right" className="t-num text-ink-2">
                          #{t.position.toFixed(1)}
                        </Td>
                        <Td align="right">
                          <SentimentScore value={t.sentiment} />
                        </Td>
                        <Td>
                          <LevelBars level={t.volume} tone="green" />
                        </Td>
                        <Td align="right">
                          <span className="inline-block">
                            <Sparkline values={t.trend} color={t.delta >= 0 ? "var(--status-success)" : "var(--status-danger)"} width={72} height={22} />
                          </span>
                        </Td>
                      </Tr>
                      {expanded && (
                        <tr>
                          <td colSpan={8} className="border-b border-line bg-canvas/60 p-0">
                            <div className="animate-[sy-fade-in_160ms_ease-out] px-3 py-2 sm:pl-11">
                              {list.length === 0 ? (
                                <div className="flex flex-wrap items-center gap-3 py-3">
                                  <span className="t-body text-ink-2">
                                    No tracked prompts in this topic{filters.branded !== "all" ? " for this branded filter" : ""} yet.
                                  </span>
                                  <Button
                                    size="xs"
                                    variant="outlined"
                                    tone="secondary"
                                    iconLeft={<Plus weight="bold" className="size-3" />}
                                    onClick={() => nav("/prompts/research")}
                                  >
                                    Find prompts
                                  </Button>
                                </div>
                              ) : (
                                list.map((p) => (
                                  <div key={p.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
                                    <span className="min-w-0 flex-1 truncate t-body text-ink">{p.text}</span>
                                    {p.status !== "active" && (
                                      <Badge tone={p.status === "suggested" ? "blue" : "neutral"}>{p.status === "suggested" ? "Suggested" : "Inactive"}</Badge>
                                    )}
                                    {p.branded && <Badge tone="outline">Branded</Badge>}
                                    <span className="hidden w-24 shrink-0 -space-x-1 sm:flex">
                                      {p.models.slice(0, 4).map((m) => (
                                        <ModelMark key={m} id={m} size={16} className="rounded-full ring-2 ring-canvas" />
                                      ))}
                                    </span>
                                    <span className="w-12 text-right t-num-sm-medium text-ink">{p.visibility}%</span>
                                    <span className="w-10 text-right t-num-sm text-ink-3">{p.position ? `#${p.position.toFixed(1)}` : "—"}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </Table>
          </CardPanel>
        </Card>
      </PageSection>

      <PageSection>
        <Card>
          <CardHeader title="Share of voice by topic" description="Who AI mentions for each topic" />
          <CardPanel className="flex flex-col gap-4">
            <Legend items={[...competitors.map((b) => ({ label: b.name, color: brandColor(b) })), { label: "Others", color: "var(--bg-muted)" }]} />
            <div className="grid grid-cols-1 gap-x-8 gap-y-3 lg:grid-cols-2">
              {data.map((t) => {
                const you = t.sov;
                const a = Math.round(10 + rand(`sov-a-${t.id}`) * 16);
                const b = Math.round(6 + rand(`sov-b-${t.id}`) * 12);
                const parts = [you, a, b, Math.max(0, 100 - you - a - b)];
                return (
                  <div key={t.id} className="flex items-center gap-3">
                    <span className="w-36 shrink-0 truncate t-caption-medium text-ink">{t.name}</span>
                    <SplitBar
                      className="flex-1"
                      height={10}
                      parts={parts.map((v, i) => ({
                        value: v,
                        color: i < 3 ? brandColor(competitors[i]) : "var(--bg-muted)",
                        label: `${i < 3 ? competitors[i].name : "Others"} ${v}%`,
                      }))}
                    />
                    <span className="flex w-14 shrink-0 items-center justify-end gap-1.5">
                      <BrandMark brand={competitors[0]} size={12} />
                      <span className="t-num-sm-medium text-ink">{you}%</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </CardPanel>
        </Card>
      </PageSection>
    </>
  );
}
