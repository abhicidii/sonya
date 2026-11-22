import { useMemo, useState } from "react";
import { ArrowsInLineVertical, ArrowsOutLineVertical, CaretRight, Check, DownloadSimple, GitFork, MagnifyingGlass, Plus, Repeat } from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardPanel,
  CountChip,
  DeltaPill,
  EmptyState,
  LevelBars,
  ModelMark,
  MODELS,
  SearchInput,
  Table,
  Td,
  Th,
  THead,
  Toggle,
  Tr,
  useToast,
  type ModelId,
} from "@/components/ui";
import { PageSection } from "@/components/shell/PageHeader";
import type { Filters } from "@/components/shell/FilterBar";
import { fanouts, prompts } from "@/data/mock";
import { cn, fmt } from "@/lib/cn";
import { downloadCsv, hash, Highlight, RANGE_LABEL, scaleBy, TabIntro, topicName } from "./_shared";

type Query = { q: string; topic: string; volume: number; difficulty: number; count: number; tracked: boolean };
type Group = { prompt: string; queries: Query[] };

/** The mock ships two prompts; the rest round out the demo table. */
const extraGroups: Group[] = [
  {
    prompt: "Lumen vs Orbit for funnel analysis",
    queries: [
      { q: "Lumen funnel analysis features", topic: "Competitor comparison", volume: 3, difficulty: 2, count: 4, tracked: true },
      { q: "Orbit funnels conversion window limits", topic: "Competitor comparison", volume: 2, difficulty: 3, count: 3, tracked: false },
      { q: "funnel analysis tool reviews reddit", topic: "Product analytics", volume: 4, difficulty: 3, count: 2, tracked: false },
      { q: "Lumen vs Orbit pricing 2026", topic: "Pricing", volume: 3, difficulty: 2, count: 2, tracked: true },
    ],
  },
  {
    prompt: "How do I track feature adoption without engineers?",
    queries: [
      { q: "no-code event tagging tools", topic: "Feature adoption", volume: 4, difficulty: 3, count: 5, tracked: false },
      { q: "visual event tracking product managers", topic: "Feature adoption", volume: 3, difficulty: 2, count: 3, tracked: false },
      { q: "retroactive event tracking analytics", topic: "Product analytics", volume: 2, difficulty: 4, count: 2, tracked: false },
      { q: "feature adoption rate formula", topic: "Activation", volume: 5, difficulty: 2, count: 2, tracked: true },
      { q: "autocapture vs manual tracking", topic: "Product analytics", volume: 3, difficulty: 3, count: 1, tracked: false },
    ],
  },
  {
    prompt: "Best tools to measure product-led growth",
    queries: [
      { q: "PLG metrics dashboard template", topic: "Product-led growth", volume: 4, difficulty: 3, count: 4, tracked: false },
      { q: "product qualified leads scoring tools", topic: "Product-led growth", volume: 3, difficulty: 4, count: 3, tracked: false },
      { q: "PLG analytics stack 2026", topic: "Product-led growth", volume: 3, difficulty: 3, count: 2, tracked: false },
    ],
  },
  {
    prompt: "Session replay tools with privacy controls",
    queries: [
      { q: "session replay PII masking", topic: "Session replay", volume: 3, difficulty: 3, count: 4, tracked: false },
      { q: "GDPR compliant session recording", topic: "Security & privacy", volume: 4, difficulty: 4, count: 3, tracked: false },
      { q: "session replay sampling and filters", topic: "Session replay", volume: 2, difficulty: 2, count: 1, tracked: false },
    ],
  },
];

const initialGroups: Group[] = [...fanouts.map((f) => ({ prompt: f.prompt, queries: f.queries.map((q) => ({ ...q })) })), ...extraGroups];
const FANOUT_MODELS: ModelId[] = ["chatgpt", "perplexity", "aio", "gemini", "claude"];
const modelOf = (q: string): ModelId => FANOUT_MODELS[hash(q) % FANOUT_MODELS.length];

export default function FanoutTab({ filters }: { filters: Filters }) {
  const toast = useToast();
  const [groups, setGroups] = useState(initialGroups);
  const [open, setOpen] = useState<Record<string, boolean>>({ [initialGroups[0].prompt]: true });
  const [query, setQuery] = useState("");
  const [untrackedOnly, setUntrackedOnly] = useState(false);

  const topic = topicName(filters);
  const q = query.trim().toLowerCase();

  const visible = useMemo(
    () =>
      groups
        .map((g) => {
          const promptHit = q && g.prompt.toLowerCase().includes(q);
          const rows = g.queries
            .map((row, i) => ({ ...row, index: i }))
            .filter((r) => filters.model === "all" || modelOf(r.q) === filters.model)
            .filter((r) => !topic || r.topic === topic)
            .filter((r) => !untrackedOnly || !r.tracked)
            .filter((r) => !q || promptHit || r.q.toLowerCase().includes(q) || r.topic.toLowerCase().includes(q));
          return { ...g, rows };
        })
        .filter((g) => g.rows.length > 0),
    [groups, q, filters.model, topic, untrackedOnly],
  );

  const allQueries = groups.flatMap((g) => g.queries);
  const trackedCount = allQueries.filter((r) => r.tracked).length;
  const distinct = scaleBy(567, filters.range);
  const occurrences = scaleBy(584, filters.range);
  const isOpen = (p: string) => (q ? true : !!open[p]);
  const allOpen = visible.every((g) => isOpen(g.prompt));

  const toggleTrack = (prompt: string, index: number) => {
    const row = groups.find((g) => g.prompt === prompt)!.queries[index];
    const next = !row.tracked;
    setGroups((gs) => gs.map((g) => (g.prompt === prompt ? { ...g, queries: g.queries.map((r, i) => (i === index ? { ...r, tracked: next } : r)) } : g)));
    toast(
      next
        ? {
            title: `“${row.q}” added to your tracked prompts`,
            description: "First answers arrive with the next daily run.",
            action: { label: "Undo", onClick: () => toggleBack(prompt, index, false) },
          }
        : { title: `“${row.q}” removed from tracked prompts`, tone: "info" },
    );
  };
  const toggleBack = (prompt: string, index: number, value: boolean) =>
    setGroups((gs) => gs.map((g) => (g.prompt === prompt ? { ...g, queries: g.queries.map((r, i) => (i === index ? { ...r, tracked: value } : r)) } : g)));

  const exportCsv = () => {
    const rows = visible.flatMap((g) =>
      g.rows.map((r) => [g.prompt, r.q, MODELS[modelOf(r.q)].name, r.topic, r.volume, r.difficulty, r.count, r.tracked ? "yes" : "no"]),
    );
    downloadCsv("query-fanouts.csv", [["Prompt", "Query", "Model", "Topic", "Volume", "Difficulty", "Count", "Tracked"], ...rows]);
    toast({ title: `Exported ${rows.length} query fanouts`, description: "query-fanouts.csv saved to your downloads." });
  };

  return (
    <>
      <PageSection className="flex flex-col gap-4">
        <TabIntro title="Query fanouts" description="The extra questions AI asks to dig up more information about your prompts" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatPanel
            icon={<GitFork weight="fill" />}
            label="Distinct query fanouts"
            value={fmt.int(distinct)}
            hint={`${RANGE_LABEL[filters.range] ?? "Last 7 days"} · from ${prompts.filter((p) => p.status === "active").length} tracked prompts`}
            delta="+12.4%"
          />
          <StatPanel
            icon={<Repeat weight="fill" />}
            label="Total occurrences"
            value={fmt.int(occurrences)}
            hint={`${(occurrences / Math.max(1, distinct)).toFixed(2)} occurrences per fanout`}
            delta="+9.8%"
          />
        </div>
      </PageSection>

      <PageSection>
        <Card>
          <CardHeader
            title={
              <>
                Query Fanouts by Prompt <CountChip>{visible.reduce((a, g) => a + g.rows.length, 0)}</CountChip>
              </>
            }
            description={`${trackedCount} of ${allQueries.length} fanouts tracked · click a prompt to see what AI searched for`}
            actions={
              <span className="hidden items-center gap-1.5 sm:flex">
                <Button
                  size="xs"
                  variant="link"
                  tone="secondary"
                  iconLeft={allOpen ? <ArrowsInLineVertical className="size-3.5" /> : <ArrowsOutLineVertical className="size-3.5" />}
                  onClick={() => setOpen(Object.fromEntries(visible.map((g) => [g.prompt, !allOpen])))}
                  disabled={!!q}
                >
                  {allOpen ? "Collapse all" : "Expand all"}
                </Button>
              </span>
            }
          />
          <CardPanel flush>
            <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
              <SearchInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search fanouts or prompts…"
                wrapperClassName="w-full sm:w-72"
                aria-label="Search fanouts"
              />
              <Toggle size="xs" checked={untrackedOnly} onChange={setUntrackedOnly} label="Untracked only" />
              {filters.model !== "all" && (
                <Badge tone="outline">
                  <ModelMark id={filters.model} size={12} /> {MODELS[filters.model].name}
                </Badge>
              )}
              {topic && <Badge tone="outline"># {topic}</Badge>}
              <span className="flex-1" />
              <Button variant="outlined" tone="secondary" iconLeft={<DownloadSimple className="size-4" />} onClick={exportCsv}>
                Export
              </Button>
            </div>

            {visible.length === 0 ? (
              <EmptyState
                icon={<MagnifyingGlass />}
                title="No fanouts match"
                description="Try a different search, or clear the model and topic filters."
                action={
                  <Button variant="outlined" tone="secondary" onClick={() => (setQuery(""), setUntrackedOnly(false))}>
                    Clear search
                  </Button>
                }
              />
            ) : (
              <div className="p-2">
                <Table className="min-w-[860px]">
                  <THead>
                    <tr>
                      <Th className="w-12">#</Th>
                      <Th>Query</Th>
                      <Th>Topics</Th>
                      <Th>Volume</Th>
                      <Th>Difficulty</Th>
                      <Th align="right">Count</Th>
                      <Th align="right" className="w-32">
                        Tracked
                      </Th>
                    </tr>
                  </THead>
                  <tbody>
                    {visible.map((g) => {
                      const expanded = isOpen(g.prompt);
                      const full = groups.find((x) => x.prompt === g.prompt)!;
                      const coverage = Math.round((full.queries.filter((r) => r.tracked).length / full.queries.length) * 100);
                      return (
                        <GroupBlock
                          key={g.prompt}
                          prompt={g.prompt}
                          query={query}
                          expanded={expanded}
                          onToggle={() => setOpen((o) => ({ ...o, [g.prompt]: !expanded }))}
                          fanoutCount={full.queries.length}
                          coverage={coverage}
                        >
                          {expanded &&
                            g.rows.map((r, i) => (
                              <Tr key={r.q} className="animate-[sy-fade-in_160ms_ease-out]">
                                <Td className="t-num-sm text-ink-3">{i + 1}</Td>
                                <Td>
                                  <span className="flex min-w-0 items-center gap-2.5">
                                    <ModelMark id={modelOf(r.q)} size={18} className="rounded-full" />
                                    <span className="truncate t-body text-ink">
                                      <Highlight text={r.q} query={query} />
                                    </span>
                                  </span>
                                </Td>
                                <Td>
                                  <span className="flex flex-wrap gap-1">
                                    <Badge tone="outline"># {r.topic}</Badge>
                                  </span>
                                </Td>
                                <Td>
                                  <LevelBars level={r.volume} tone="green" />
                                </Td>
                                <Td>
                                  <LevelBars level={r.difficulty} tone="red" />
                                </Td>
                                <Td align="right">
                                  <CountChip>{r.count}</CountChip>
                                </Td>
                                <Td align="right">
                                  <TrackButton tracked={r.tracked} onClick={() => toggleTrack(g.prompt, r.index)} />
                                </Td>
                              </Tr>
                            ))}
                        </GroupBlock>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </CardPanel>
        </Card>
      </PageSection>
    </>
  );
}

function StatPanel({ icon, label, value, hint, delta }: { icon: React.ReactNode; label: string; value: string; hint: string; delta: string }) {
  return (
    <Card>
      <CardHeader
        icon={icon}
        tile={label.startsWith("Distinct") ? "blue" : "purple"}
        title={<span className="t-label">{label}</span>}
        className="min-h-0 py-2.5"
      />
      <CardPanel className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="t-num-xl text-ink">{value}</div>
          <div className="mt-1 truncate t-caption text-ink-3">{hint}</div>
        </div>
        <DeltaPill value={delta} direction="up" />
      </CardPanel>
    </Card>
  );
}

function GroupBlock({
  prompt,
  query,
  expanded,
  onToggle,
  fanoutCount,
  coverage,
  children,
}: {
  prompt: string;
  query: string;
  expanded: boolean;
  onToggle: () => void;
  fanoutCount: number;
  coverage: number;
  children: React.ReactNode;
}) {
  const tone = coverage === 0 ? "bg-subtle text-ink-2" : coverage >= 50 ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning";
  return (
    <>
      <tr>
        <td colSpan={7} className="border-b border-line p-0">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="flex min-h-12 w-full items-center gap-2.5 bg-canvas/60 px-3 py-2 text-left transition-colors hover:bg-canvas"
          >
            <CaretRight weight="bold" className={cn("size-3.5 shrink-0 text-icon transition-transform duration-200 ease-out", expanded && "rotate-90")} />
            <span className="min-w-0 flex-1 truncate t-body-medium text-ink">
              <Highlight text={prompt} query={query} />
            </span>
            <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md bg-surface px-2 t-caption-medium text-ink-2 shadow-control-soft">
              <span className="t-num-sm-medium text-ink">{fanoutCount}</span> fanouts
            </span>
            <span className={cn("inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 t-caption-medium transition-colors", tone)}>
              <span className="t-num-sm-medium">{coverage}%</span> tracked
            </span>
          </button>
        </td>
      </tr>
      {children}
    </>
  );
}

function TrackButton({ tracked, onClick }: { tracked: boolean; onClick: () => void }) {
  return tracked ? (
    <button
      type="button"
      onClick={onClick}
      title="Stop tracking"
      className="inline-flex h-7 items-center gap-1 rounded-md bg-success-subtle px-2.5 t-caption-medium text-success transition-[transform,background-color] duration-150 active:scale-[0.97]"
    >
      <Check weight="bold" className="size-3.5" />
      Tracked
    </button>
  ) : (
    <Button size="xs" variant="outlined" tone="secondary" iconLeft={<Plus weight="bold" className="size-3" />} onClick={onClick}>
      Track
    </Button>
  );
}
