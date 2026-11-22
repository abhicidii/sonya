import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ChartLineUp,
  Check,
  ClockCounterClockwise,
  Cpu,
  EyeSlash,
  Flame,
  GlobeHemisphereWest,
  MagnifyingGlass,
  Plus,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import {
  Badge,
  BrandMark,
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardPanel,
  Checkbox,
  DeltaText,
  EmptyState,
  IconButton,
  Input,
  LevelBars,
  ModelMark,
  MODELS,
  Segmented,
  Select,
  Skeleton,
  StatusPill,
  Table,
  Td,
  Th,
  THead,
  Tr,
  useToast,
  type BadgeTone,
  type ModelId,
} from "@/components/ui";
import { Sparkline, SplitBar } from "@/components/charts";
import { PageHeader, PageSection } from "@/components/shell/PageHeader";
import { brands, locations } from "@/data/mock";
import { cn, fmt } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/* Data                                                                        */
/* -------------------------------------------------------------------------- */

type Intent = "Informational" | "Comparison" | "Transactional" | "Navigational";
type SortKey = "opportunity" | "volume" | "difficulty" | "visibility";

interface Result {
  id: string;
  text: string;
  intent: Intent;
  volume: number;
  difficulty: number;
  winners: (typeof brands)[number][];
  visibility: number | null;
  answers: number;
}

const intentTone: Record<Intent, BadgeTone> = {
  Informational: "blue",
  Comparison: "purple",
  Transactional: "green",
  Navigational: "orange",
};
const intentColor: Record<Intent, string> = {
  Informational: "var(--blue-500)",
  Comparison: "var(--purple-500)",
  Transactional: "var(--green-500)",
  Navigational: "var(--orange-500)",
};

const templates: [string, Intent][] = [
  ["What is the best {kw}?", "Comparison"],
  ["Best {kw} for early-stage startups", "Comparison"],
  ["How do I choose a {kw}?", "Informational"],
  ["{Kw} pricing comparison for 2026", "Transactional"],
  ["Top alternatives to Orbit for {kw}", "Comparison"],
  ["Is Lumen a good {kw}?", "Navigational"],
  ["How does a {kw} work for B2B teams?", "Informational"],
  ["Cheapest {kw} with a free plan", "Transactional"],
  ["{Kw} vs spreadsheets — when should we switch?", "Informational"],
  ["Which {kw} integrates with Snowflake?", "Comparison"],
  ["Open-source {kw} options worth trying", "Comparison"],
  ["How to roll out a {kw} in one week", "Informational"],
];

const STOP = new Set(["a", "an", "the", "for", "and", "or", "to", "of", "we", "our", "is", "that", "with", "in", "on", "it", "helps", "help", "teams", "team", "which", "who"]);

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}

function keywordOf(seed: string) {
  const words = seed.toLowerCase().replace(/[^\w\s-]/g, "").split(/\s+/).filter(Boolean);
  if (words.length <= 4) return words.join(" ");
  return words.filter((w) => !STOP.has(w)).slice(0, 3).join(" ");
}

function research(seed: string, country: string, model: string): Result[] {
  const kw = keywordOf(seed) || "product analytics tool";
  const Kw = kw[0].toUpperCase() + kw.slice(1);
  const rivals = brands;
  return templates.map(([tpl, intent], i) => {
    const h = hash(`${kw}|${country}|${model}|${i}`);
    const text = tpl.replace("{kw}", kw).replace("{Kw}", Kw);
    const w0 = h % rivals.length;
    const winners = [0, 2, 5].map((o) => rivals[(w0 + o) % rivals.length]);
    const branded = /lumen/i.test(text);
    return {
      id: `${i}-${h}`,
      text,
      intent,
      volume: 1 + (h % 5),
      difficulty: 1 + ((h >> 5) % 5),
      winners: branded ? [brands[0], ...winners.filter((w) => !w.you).slice(0, 2)] : winners,
      visibility: branded ? 84 : (h >> 9) % 4 === 0 ? null : 6 + ((h >> 11) % 62),
      answers: 40 + ((h >> 3) % 260),
    };
  });
}

const trending = [
  { name: "AI product analytics", growth: 38.2, trend: [12, 14, 15, 18, 21, 24, 27, 31, 36] },
  { name: "Warehouse-native analytics", growth: 21.4, trend: [20, 21, 21, 23, 24, 25, 26, 27, 29] },
  { name: "Session replay privacy", growth: 17.9, trend: [9, 10, 10, 11, 12, 12, 13, 14, 15] },
  { name: "PLG metrics", growth: 12.1, trend: [30, 31, 31, 32, 33, 33, 34, 35, 35] },
  { name: "Feature adoption tracking", growth: 8.6, trend: [22, 22, 23, 22, 23, 24, 24, 25, 25] },
  { name: "Mobile product analytics", growth: -4.3, trend: [28, 28, 27, 27, 26, 27, 26, 26, 25] },
];

const examples = ["product analytics for B2B SaaS", "session replay tool", "activation rate", "retention cohort analysis"];

const DEFAULT_SEED = "product analytics for B2B SaaS";

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function ResearchPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [input, setInput] = useState(DEFAULT_SEED);
  const [country, setCountry] = useState("US");
  const [model, setModel] = useState<"all" | ModelId>("all");
  const [query, setQuery] = useState({ seed: DEFAULT_SEED, country: "US", model: "all" as "all" | ModelId });
  const [loading, setLoading] = useState(false);
  const [intent, setIntent] = useState<"all" | Intent>("all");
  const [sort, setSort] = useState<SortKey>("opportunity");
  const [tracked, setTracked] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [recent, setRecent] = useState<string[]>(["session replay tool", "activation rate"]);
  const [credits, setCredits] = useState(38);

  const results = useMemo(() => research(query.seed, query.country, query.model), [query]);

  const rows = useMemo(() => {
    const score = (r: Result) => r.volume * 2 - r.difficulty + (r.visibility === null ? 3 : r.visibility < 25 ? 1.5 : 0);
    const list = results.filter((r) => intent === "all" || r.intent === intent);
    return [...list].sort((a, b) => {
      if (sort === "volume") return b.volume - a.volume;
      if (sort === "difficulty") return a.difficulty - b.difficulty;
      if (sort === "visibility") return (a.visibility ?? -1) - (b.visibility ?? -1);
      return score(b) - score(a);
    });
  }, [results, intent, sort]);

  const run = (seed = input, c = country, m = model) => {
    const s = seed.trim();
    if (!s) {
      toast({ tone: "warning", title: "Add a description or keyword", description: "Describe your product or paste a keyword to research." });
      return;
    }
    setInput(s);
    setLoading(true);
    setSelected(new Set());
    setRecent((r) => [s, ...r.filter((x) => x !== s)].slice(0, 5));
    window.setTimeout(() => {
      setQuery({ seed: s, country: c, model: m });
      setLoading(false);
      setCredits((n) => Math.max(0, n - 1));
    }, 900);
  };

  const track = (ids: string[]) => {
    const fresh = ids.filter((id) => !tracked.has(id));
    if (!fresh.length) return;
    setTracked((t) => new Set([...t, ...fresh]));
    setSelected(new Set());
    const one = results.find((r) => r.id === fresh[0]);
    toast({
      title: fresh.length === 1 ? "Prompt added to tracking" : `${fresh.length} prompts added to tracking`,
      description: fresh.length === 1 && one ? `“${one.text}”` : "First answers arrive within a few minutes.",
      action: { label: "View", onClick: () => nav("/prompts") },
    });
  };

  const untracked = rows.filter((r) => !tracked.has(r.id));
  const allSelected = untracked.length > 0 && untracked.every((r) => selected.has(r.id));
  const someSelected = untracked.some((r) => selected.has(r.id));
  const selectedIds = [...selected].filter((id) => !tracked.has(id));

  /* Summary */
  const gaps = results.filter((r) => r.visibility === null).length;
  const avgVol = results.reduce((a, r) => a + r.volume, 0) / results.length;
  const visible = results.filter((r) => r.visibility !== null);
  const avgVis = visible.length ? visible.reduce((a, r) => a + (r.visibility ?? 0), 0) / visible.length : 0;
  const intentMix = (Object.keys(intentTone) as Intent[]).map((i) => ({ intent: i, n: results.filter((r) => r.intent === i).length }));
  const leader = useMemo(() => {
    const tally = new Map<string, number>();
    results.forEach((r) => tally.set(r.winners[0].id, (tally.get(r.winners[0].id) ?? 0) + 1));
    const [id, n] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
    return { brand: brands.find((b) => b.id === id)!, n };
  }, [results]);

  const countryLabel = locations.find((l) => l.code === query.country);
  const modelLabel = query.model === "all" ? "All models" : MODELS[query.model].name;

  return (
    <>
      <PageHeader
        title="Prompt Research"
        breadcrumbs={[{ label: "Prompts", to: "/prompts" }]}
        actions={
          <>
            <StatusPill tone="neutral" className="hidden sm:inline-flex">
              <span className="t-num-sm-medium text-ink">{credits}</span> research credits left
            </StatusPill>
            <Button variant="outlined" tone="secondary" iconRight={<ArrowUpRight className="size-4" />} onClick={() => nav("/prompts")}>
              Your prompts
            </Button>
          </>
        }
      />

      {/* Search */}
      <PageSection>
        <Card>
          <CardHeader
            icon={<Sparkle weight="fill" />}
            tile="purple"
            title="Find prompts worth tracking"
            description="Sonya expands your seed into real questions people ask AI engines, then checks who wins each answer."
          />
          <CardPanel className="flex flex-col gap-4">
            <form
              className="flex flex-col gap-2 lg:flex-row lg:items-center"
              onSubmit={(e) => {
                e.preventDefault();
                run();
              }}
            >
              <Input
                size="md"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                iconLeft={<MagnifyingGlass />}
                placeholder="Describe your product or paste a keyword"
                aria-label="Describe your product or paste a keyword"
                wrapperClassName="flex-1"
                trailing={
                  input ? (
                    <button type="button" aria-label="Clear" onClick={() => setInput("")} className="grid size-5 place-items-center rounded-md text-icon-muted transition-colors hover:bg-subtle hover:text-ink">
                      <X className="size-3.5" />
                    </button>
                  ) : undefined
                }
              />
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  label="Country"
                  value={country}
                  onChange={setCountry}
                  icon={<GlobeHemisphereWest />}
                  className="!h-10 !rounded-[10px]"
                  options={locations.map((l) => ({ value: l.code, label: `${l.flag}  ${l.name}` }))}
                />
                <Select<"all" | ModelId>
                  label="Model"
                  value={model}
                  onChange={setModel}
                  align="end"
                  icon={model === "all" ? <Cpu /> : undefined}
                  className="!h-10 !rounded-[10px]"
                  options={[
                    { value: "all", label: "All models" },
                    ...(["chatgpt", "perplexity", "aio", "gemini", "claude", "copilot"] as ModelId[]).map((m) => ({
                      value: m,
                      label: MODELS[m].name,
                      icon: <ModelMark id={m} size={16} />,
                    })),
                  ]}
                />
                <Button type="submit" size="md" loading={loading} iconLeft={!loading ? <Sparkle weight="fill" className="size-4" /> : undefined} className="flex-1 lg:flex-none">
                  {loading ? "Researching…" : "Research"}
                </Button>
              </div>
            </form>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 t-caption text-ink-3">Try</span>
              {examples.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => run(e)}
                  className="inline-flex h-7 items-center rounded-full bg-subtle px-3 t-caption-medium text-ink-2 transition-colors hover:bg-hover hover:text-ink"
                >
                  {e}
                </button>
              ))}
              {recent.length > 0 && (
                <>
                  <span className="mx-1.5 h-4 w-px bg-line" />
                  <ClockCounterClockwise className="size-3.5 text-icon-muted" />
                  {recent.slice(0, 3).map((r) => (
                    <button key={r} type="button" onClick={() => run(r)} className="h-7 rounded-md px-2 t-caption text-ink-2 transition-colors hover:bg-subtle hover:text-ink">
                      {r}
                    </button>
                  ))}
                </>
              )}
            </div>
          </CardPanel>
        </Card>
      </PageSection>

      {/* Results + side */}
      <PageSection className="grid flex-1 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader
            title={
              <>
                <span className="truncate">Results for “{query.seed}”</span>
              </>
            }
            description={
              loading ? (
                "Asking engines…"
              ) : (
                <>
                  {results.length} prompts · {countryLabel?.flag} {countryLabel?.name} · {modelLabel}
                </>
              )
            }
            actions={
              <Select<SortKey>
                size="xs"
                label="Sort"
                align="end"
                value={sort}
                onChange={setSort}
                renderValue={(v) => `Sort: ${{ opportunity: "Opportunity", volume: "Volume", difficulty: "Easiest", visibility: "Lowest visibility" }[v]}`}
                options={[
                  { value: "opportunity", label: "Opportunity", description: "High volume, low difficulty, low visibility" },
                  { value: "volume", label: "Volume" },
                  { value: "difficulty", label: "Easiest first" },
                  { value: "visibility", label: "Lowest visibility" },
                ]}
              />
            }
          />
          <CardPanel flush className="flex flex-col">
            <div className="flex items-center gap-2 overflow-x-auto border-b border-line p-3 [scrollbar-width:none]">
              <Segmented<"all" | Intent>
                size="xs"
                value={intent}
                onChange={setIntent}
                options={[
                  { value: "all", label: "All", count: results.length },
                  ...(Object.keys(intentTone) as Intent[]).map((i) => ({ value: i, label: i, count: results.filter((r) => r.intent === i).length })),
                ]}
              />
            </div>

            {loading ? (
              <ResultsSkeleton />
            ) : rows.length === 0 ? (
              <EmptyState icon={<MagnifyingGlass weight="duotone" />} title="No prompts for this intent" description="Try another intent filter or a broader seed." />
            ) : (
              <div className="p-2">
                <Table className="min-w-[900px]">
                  <THead>
                    <tr>
                      <Th className="w-9 pr-0">
                        <Checkbox
                          checked={allSelected}
                          indeterminate={!allSelected && someSelected}
                          onChange={() => setSelected(allSelected ? new Set() : new Set(untracked.map((r) => r.id)))}
                        />
                      </Th>
                      <Th>Prompt</Th>
                      <Th>Intent</Th>
                      <Th>Volume</Th>
                      <Th>Difficulty</Th>
                      <Th>Who's winning</Th>
                      <Th align="right">Your visibility</Th>
                      <Th className="w-[104px]">
                        <span className="sr-only">Track</span>
                      </Th>
                    </tr>
                  </THead>
                  <tbody>
                    {rows.map((r) => {
                      const isTracked = tracked.has(r.id);
                      const dTone = r.difficulty <= 2 ? "green" : r.difficulty === 3 ? "orange" : "red";
                      return (
                        <Tr key={r.id} selected={selected.has(r.id)} className="animate-[sy-fade-in_200ms_ease-out]">
                          <Td className="w-9 pr-0">
                            <Checkbox
                              checked={selected.has(r.id) || isTracked}
                              disabled={isTracked}
                              onChange={() =>
                                setSelected((s) => {
                                  const n = new Set(s);
                                  if (n.has(r.id)) n.delete(r.id);
                                  else n.add(r.id);
                                  return n;
                                })
                              }
                            />
                          </Td>
                          <Td className="max-w-[340px] py-2.5">
                            <div className="truncate t-body-medium" title={r.text}>
                              {r.text}
                            </div>
                            <div className="mt-0.5 t-caption text-ink-3">
                              <span className="t-num-sm">{r.answers}</span> answers sampled
                            </div>
                          </Td>
                          <Td>
                            <Badge tone={intentTone[r.intent]}>{r.intent}</Badge>
                          </Td>
                          <Td>
                            <span className="inline-flex items-center gap-2">
                              <LevelBars level={r.volume} tone="blue" />
                              <span className="t-caption text-ink-2">{["Very low", "Low", "Medium", "High", "Very high"][r.volume - 1]}</span>
                            </span>
                          </Td>
                          <Td>
                            <span className="inline-flex items-center gap-2">
                              <LevelBars level={r.difficulty} tone={dTone} />
                              <span className="t-caption text-ink-2">{r.difficulty <= 2 ? "Easy" : r.difficulty === 3 ? "Medium" : "Hard"}</span>
                            </span>
                          </Td>
                          <Td>
                            <span className="inline-flex items-center gap-2">
                              <span className="flex -space-x-1">
                                {r.winners.map((b) => (
                                  <BrandMark key={b.id} brand={b} size={20} className="ring-2 ring-surface" />
                                ))}
                              </span>
                              <span className={cn("t-caption", r.winners[0].you ? "text-success" : "text-ink-2")}>{r.winners[0].you ? "You lead" : r.winners[0].name}</span>
                            </span>
                          </Td>
                          <Td align="right">
                            {r.visibility === null ? (
                              <span className="inline-flex items-center gap-1.5 t-caption text-ink-3">
                                <EyeSlash className="size-3.5" />
                                Not visible
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2">
                                <span className="h-1.5 w-12 overflow-hidden rounded-full bg-subtle">
                                  <span className="block h-full rounded-full bg-[var(--data-1)]" style={{ width: `${r.visibility}%` }} />
                                </span>
                                <span className="w-10 t-num">{fmt.pct(r.visibility, 0)}</span>
                              </span>
                            )}
                          </Td>
                          <Td align="right">
                            {isTracked ? (
                              <span className="inline-flex h-7 items-center gap-1 px-2 t-caption-medium text-success">
                                <Check weight="bold" className="size-3.5" />
                                Tracking
                              </span>
                            ) : (
                              <Button size="xs" variant="outlined" iconLeft={<Plus weight="bold" className="size-3" />} onClick={() => track([r.id])}>
                                Track
                              </Button>
                            )}
                          </Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </CardPanel>
          <CardFooter className="flex-wrap gap-2">
            <span className="t-caption text-ink-2">
              {selectedIds.length > 0 ? (
                <>
                  <span className="t-num-sm-medium text-ink">{selectedIds.length}</span> selected
                </>
              ) : (
                <>
                  <span className="t-num-sm-medium text-ink">{tracked.size}</span> tracked from this session
                </>
              )}
            </span>
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <Button size="xs" variant="link" tone="secondary" onClick={() => setSelected(new Set())}>
                  Clear
                </Button>
              )}
              <Button
                size="xs"
                variant="outlined"
                disabled={loading || (selectedIds.length === 0 && untracked.length === 0)}
                iconLeft={<Plus weight="bold" className="size-3" />}
                onClick={() => track(selectedIds.length ? selectedIds : untracked.map((r) => r.id))}
              >
                {selectedIds.length ? `Track ${selectedIds.length} selected` : `Track all ${untracked.length}`}
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Side */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader icon={<ChartLineUp weight="fill" />} tile="blue" title="Research summary" />
            <CardPanel className="flex flex-col gap-4">
              {loading ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line shadow-card">
                    {[
                      { label: "Prompts found", value: `${results.length}` },
                      { label: "Visibility gaps", value: `${gaps}`, tone: gaps ? "text-danger" : "text-ink" },
                      { label: "Avg. volume", value: `${avgVol.toFixed(1)}/5` },
                      { label: "Your avg. visibility", value: fmt.pct(avgVis, 0) },
                    ].map((s) => (
                      <div key={s.label} className="flex flex-col gap-1 bg-surface px-3 py-2.5">
                        <span className="truncate t-caption text-ink-3">{s.label}</span>
                        <span className={cn("t-num", s.tone ?? "text-ink")}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="t-caption-medium text-ink">Intent mix</span>
                    <SplitBar parts={intentMix.filter((m) => m.n).map((m) => ({ value: m.n, color: intentColor[m.intent], label: `${m.intent} · ${m.n}` }))} />
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {intentMix.map((m) => (
                        <span key={m.intent} className="flex items-center gap-1.5 t-caption text-ink-2">
                          <span className="size-2 rounded-[2px]" style={{ background: intentColor[m.intent] }} />
                          <span className="flex-1 truncate">{m.intent}</span>
                          <span className="t-num-sm text-ink">{m.n}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl bg-canvas p-3">
                    <BrandMark brand={leader.brand} size={28} />
                    <div className="min-w-0 flex-1">
                      <div className="t-body-medium text-ink">{leader.brand.you ? "You win most answers" : `${leader.brand.name} wins most answers`}</div>
                      <div className="t-caption text-ink-2">
                        Ranked first in <span className="t-num-sm">{leader.n}</span> of {results.length} prompts
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardPanel>
          </Card>

          <Card>
            <CardHeader icon={<Flame weight="fill" />} tile="orange" title="Trending topics" description="AI search demand · last 30 days" />
            <CardPanel flush className="p-1.5">
              {trending.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => run(t.name)}
                  className="group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-canvas"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate t-body-medium text-ink">{t.name}</div>
                    <DeltaText value={fmt.signedPct(t.growth)} good={t.growth >= 0} />
                  </div>
                  <Sparkline values={t.trend} width={64} height={24} color={t.growth >= 0 ? "var(--status-success)" : "var(--status-danger)"} />
                  <ArrowRight className="size-3.5 text-icon-muted opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </CardPanel>
            <CardFooter>
              <span className="t-caption text-ink-2">Click a topic to research it</span>
              <IconButton label="Refresh trends" size="xs" variant="link" onClick={() => toast({ tone: "info", title: "Trends are up to date", description: "Refreshed Nov 6, 2026 · 06:30 UTC" })}>
                <ClockCounterClockwise className="size-3.5" />
              </IconButton>
            </CardFooter>
          </Card>
        </div>
      </PageSection>
    </>
  );
}

function ResultsSkeleton() {
  return (
    <div className="flex flex-col p-2" aria-busy="true" aria-label="Loading results">
      <div className="mb-1 flex h-9 items-center gap-6 rounded-lg bg-canvas px-3">
        {[16, 180, 56, 56, 64, 80].map((w, i) => (
          <span key={i} style={{ width: w }}>
            <Skeleton className="h-2.5" />
          </span>
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex h-[60px] items-center gap-4 border-b border-line px-3 last:border-b-0">
          <Skeleton className="size-4 shrink-0 rounded-[5px]" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className={["h-3 w-4/5", "h-3 w-3/5", "h-3 w-2/3", "h-3 w-1/2"][i % 4]} />
            <Skeleton className="h-2.5 w-24" />
          </div>
          <Skeleton className="hidden h-5 w-20 sm:block" />
          <Skeleton className="hidden h-3 w-14 md:block" />
          <Skeleton className="hidden h-3 w-14 md:block" />
          <span className="hidden -space-x-1 lg:flex">
            <Skeleton className="size-5 rounded-md" />
            <Skeleton className="size-5 rounded-md" />
            <Skeleton className="size-5 rounded-md" />
          </span>
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}
