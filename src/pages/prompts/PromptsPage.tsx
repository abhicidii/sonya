import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowClockwise,
  ArrowUpRight,
  CaretDown,
  CaretUp,
  ChatText,
  Check,
  Eye,
  EyeSlash,
  FolderSimple,
  Hash,
  Medal,
  Pause,
  Play,
  Plus,
  Sparkle,
  SidebarSimple,
  Trash,
  Tray,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import {
  Badge,
  BrandMark,
  Button,
  Card,
  CardHeader,
  CardPanel,
  Checkbox,
  ChoiceChip,
  CountChip,
  Dialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  KpiCard,
  MenuItem,
  MenuLabel,
  ModelMark,
  MODELS,
  Popover,
  Progress,
  SearchInput,
  Select,
  SentimentScore,
  Spinner,
  StatusPill,
  Table,
  Tabs,
  Td,
  Textarea,
  Th,
  THead,
  Tr,
  useToast,
  type BadgeTone,
  type ModelId,
} from "@/components/ui";
import { LineChart, Sparkline } from "@/components/charts";
import { PageHeader, PageSection } from "@/components/shell/PageHeader";
import { brands, days14, locations, prompts as seedPrompts, type Prompt } from "@/data/mock";
import { cn, fmt } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/* Model                                                                       */
/* -------------------------------------------------------------------------- */

const QUOTA = 50;
const ENGINES: ModelId[] = ["chatgpt", "perplexity", "aio", "gemini", "claude", "copilot"];
const LANGUAGES = ["English", "German", "French", "Spanish", "Portuguese", "Japanese", "Indonesian"];

type Tab = "active" | "suggested" | "inactive";
type SortKey = "text" | "visibility" | "position" | "sentiment" | "volume";
type Row = Prompt & { pending?: boolean; engines?: ModelId[] };
type Intent = Prompt["intent"];

const intentTone: Record<Intent, BadgeTone> = {
  Informational: "blue",
  Comparison: "purple",
  Transactional: "green",
  Navigational: "orange",
};

const suggestionPool: [string, string, Intent, number][] = [
  ["Best product analytics tool with a free tier", "Pricing", "Transactional", 4],
  ["How do B2B teams measure account health?", "Product analytics", "Informational", 3],
  ["Lumen vs Tidal for event tracking", "Competitor comparison", "Comparison", 3],
  ["Which analytics tools are SOC 2 compliant?", "Security & privacy", "Comparison", 2],
  ["How to set up a north star metric dashboard", "Product-led growth", "Informational", 4],
  ["Product analytics for PLG startups", "Product-led growth", "Comparison", 5],
  ["How to identify power users in a SaaS product", "Retention", "Informational", 3],
  ["Feature flags and analytics in one tool", "Experimentation", "Comparison", 3],
  ["How to track onboarding completion rate", "Activation", "Informational", 4],
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}

const flagOf = (code: string) => locations.find((l) => l.code === code)?.flag ?? "🌐";

let uid = 0;
function makePrompt(text: string, topic: string, intent: Intent, volume: number, status: Prompt["status"], extra: Partial<Row> = {}): Row {
  uid += 1;
  return {
    id: `n${Date.now().toString(36)}${uid}`,
    text,
    topic,
    intent,
    volume,
    visibility: 0,
    position: null,
    sentiment: null,
    models: [],
    status,
    tags: [],
    branded: /lumen/i.test(text),
    location: "US",
    added: "Just now",
    trend: Array(10).fill(0),
    ...extra,
  };
}

/** Deterministic "first answers" for a freshly tracked prompt. */
function resolveRow(p: Row): Row {
  const h = hash(p.id + p.text);
  const engines = p.engines ?? ENGINES;
  const vis = 8 + (h % 58);
  const models = engines.filter((_, i) => (h >> i) % 3 !== 0);
  const pos = 1 + ((h >> 4) % 35) / 10;
  return {
    ...p,
    pending: false,
    visibility: models.length ? vis : 0,
    position: models.length ? Math.round(pos * 10) / 10 : null,
    sentiment: models.length ? 56 + ((h >> 6) % 22) : null,
    models,
    trend: Array.from({ length: 10 }, (_, i) => Math.max(0, vis - 5 + i * 0.6 + ((h >> i) % 4))),
  };
}

function guessIntent(text: string): Intent {
  if (/\bvs\b|best|alternative|compare|top /i.test(text)) return "Comparison";
  if (/price|pricing|cost|cheap|free|buy/i.test(text)) return "Transactional";
  if (/lumen/i.test(text)) return "Navigational";
  return "Informational";
}

function sortRows(rows: Row[], key: SortKey, dir: "asc" | "desc") {
  const m = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (key === "text") return a.text.localeCompare(b.text) * m;
    const av = a[key];
    const bv = b[key];
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    return (av - bv) * m;
  });
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function PromptsPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<Row[]>(() => seedPrompts.map((p) => ({ ...p })));
  const [tab, setTabState] = useState<Tab>(() => seedPrompts.find((p) => p.id === params.get("p"))?.status ?? "active");
  const [topic, setTopic] = useState("all");
  const [extraTopics, setExtraTopics] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [intent, setIntent] = useState<"all" | Intent>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "visibility", dir: "desc" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [poolIndex, setPoolIndex] = useState(0);

  const addOpen = params.get("add") === "1";
  const drawerId = params.get("p");

  const setParam = useCallback(
    (k: string, v: string | null) =>
      setParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          if (v === null) n.delete(k);
          else n.set(k, v);
          return n;
        },
        { replace: true },
      ),
    [setParams],
  );

  const setTab = (t: Tab) => {
    setTabState(t);
    setSelected(new Set());
  };

  const counts = useMemo(
    () => ({
      active: items.filter((i) => i.status === "active").length,
      suggested: items.filter((i) => i.status === "suggested").length,
      inactive: items.filter((i) => i.status === "inactive").length,
    }),
    [items],
  );
  const used = counts.active;

  const inTab = useMemo(() => items.filter((i) => i.status === tab), [items, tab]);

  const topicList = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((i) => map.set(i.topic, (map.get(i.topic) ?? 0) + (i.status === tab ? 1 : 0)));
    extraTopics.forEach((t) => !map.has(t) && map.set(t, 0));
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [items, tab, extraTopics]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = inTab.filter(
      (i) =>
        (topic === "all" || i.topic === topic) &&
        (intent === "all" || i.intent === intent) &&
        (!term || i.text.toLowerCase().includes(term) || i.topic.toLowerCase().includes(term) || i.tags.some((t) => t.includes(term))),
    );
    return sortRows(filtered, sort.key, sort.dir);
  }, [inTab, topic, intent, q, sort]);

  const drawerRow = items.find((i) => i.id === drawerId) ?? null;

  /* ---------- KPIs ---------- */
  const tracked = items.filter((i) => i.status === "active" && !i.pending);
  const avgVis = tracked.length ? tracked.reduce((a, i) => a + i.visibility, 0) / tracked.length : 0;
  const withPos = tracked.filter((i) => i.position !== null);
  const avgPos = withPos.length ? withPos.reduce((a, i) => a + (i.position ?? 0), 0) / withPos.length : 0;
  const invisible = tracked.filter((i) => i.visibility === 0).length;

  /* ---------- Mutations ---------- */
  const snapshot = () => {
    const prev = items;
    return () => setItems(prev);
  };

  const scheduleResolve = (ids: string[]) => {
    window.setTimeout(() => {
      setItems((s) => s.map((i) => (ids.includes(i.id) && i.pending ? resolveRow(i) : i)));
    }, 2600);
  };

  const activate = (ids: string[], verb: "track" | "resume") => {
    const room = QUOTA - used;
    if (ids.length > room) {
      toast({
        tone: "warning",
        title: "Prompt limit reached",
        description: `You have ${room} of ${QUOTA} slots left. Pause prompts or upgrade to track more.`,
      });
      return;
    }
    const undo = snapshot();
    const fromSuggested = verb === "track";
    setItems((s) =>
      s.map((i) => (ids.includes(i.id) ? { ...i, status: "active", pending: fromSuggested ? true : i.pending, added: fromSuggested ? "Just now" : i.added } : i)),
    );
    if (fromSuggested) scheduleResolve(ids);
    setSelected(new Set());
    const one = items.find((i) => i.id === ids[0]);
    toast({
      title: ids.length === 1 && one ? (fromSuggested ? "Now tracking prompt" : "Prompt resumed") : `${ids.length} prompts ${fromSuggested ? "now tracked" : "resumed"}`,
      description: ids.length === 1 && one ? `“${one.text}” moved to Active.` : "First answers arrive within a few minutes.",
      action: { label: "Undo", onClick: undo },
    });
  };

  const pause = (ids: string[]) => {
    const undo = snapshot();
    setItems((s) => s.map((i) => (ids.includes(i.id) ? { ...i, status: "inactive" } : i)));
    setSelected(new Set());
    toast({ tone: "info", title: ids.length === 1 ? "Prompt paused" : `${ids.length} prompts paused`, description: "Paused prompts don't count toward your quota.", action: { label: "Undo", onClick: undo } });
  };

  const remove = (ids: string[], verb = "deleted") => {
    const undo = snapshot();
    setItems((s) => s.filter((i) => !ids.includes(i.id)));
    setSelected(new Set());
    if (drawerId && ids.includes(drawerId)) setParam("p", null);
    toast({ tone: "info", title: ids.length === 1 ? `Prompt ${verb}` : `${ids.length} prompts ${verb}`, action: { label: "Undo", onClick: undo } });
  };

  const moveTo = (ids: string[], t: string) => {
    const undo = snapshot();
    setItems((s) => s.map((i) => (ids.includes(i.id) ? { ...i, topic: t } : i)));
    setSelected(new Set());
    toast({ title: `Moved ${ids.length} ${ids.length === 1 ? "prompt" : "prompts"} to ${t}`, action: { label: "Undo", onClick: undo } });
  };

  const suggestMore = () => {
    setSuggesting(true);
    window.setTimeout(() => {
      const picks = [0, 1, 2].map((k) => suggestionPool[(poolIndex + k) % suggestionPool.length]);
      const existing = new Set(items.map((i) => i.text));
      const fresh = picks.filter(([t]) => !existing.has(t)).map(([t, tp, it, v]) => makePrompt(t, tp, it, v, "suggested", { added: "Just now" }));
      setItems((s) => [...fresh, ...s]);
      setPoolIndex((n) => n + 3);
      setSuggesting(false);
      setTab("suggested");
      toast({
        title: fresh.length ? `${fresh.length} new suggestions` : "You're all caught up",
        description: fresh.length ? "Based on your topics and competitor gaps." : "No new prompts found for your topics right now.",
      });
    }, 900);
  };

  const addPrompts = (texts: string[], opts: { engines: ModelId[]; location: string; topic: string }) => {
    const fresh = texts.map((t) =>
      makePrompt(t, opts.topic === "auto" ? topicList[0]?.[0] ?? "Product analytics" : opts.topic, guessIntent(t), 3, "active", {
        pending: true,
        engines: opts.engines,
        location: opts.location,
      }),
    );
    setItems((s) => [...fresh, ...s]);
    scheduleResolve(fresh.map((f) => f.id));
    setTab("active");
    setTopic("all");
    setParam("add", null);
    toast({
      title: `Tracking ${fresh.length} new ${fresh.length === 1 ? "prompt" : "prompts"}`,
      description: `Running across ${opts.engines.length} engines · first answers in ~3 min.`,
    });
  };

  const importKeywords = (kws: string[]) => {
    const existing = new Set(items.map((i) => i.text.toLowerCase()));
    const fresh = kws
      .map((k) => {
        const t = /^(how|what|which|why|is|best|lumen)/i.test(k) ? k[0].toUpperCase() + k.slice(1) : `What is the best tool for ${k}?`;
        return makePrompt(t, "Imported", guessIntent(t), 2 + (hash(k) % 4), "suggested", { tags: ["imported"] });
      })
      .filter((p) => !existing.has(p.text.toLowerCase()));
    setItems((s) => [...fresh, ...s]);
    if (!extraTopics.includes("Imported")) setExtraTopics((e) => [...e, "Imported"]);
    setImportOpen(false);
    setTab("suggested");
    toast({ title: `${fresh.length} keywords converted to prompts`, description: "Review them in Suggested and track the ones you want." });
  };

  /* ---------- Selection ---------- */
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = rows.some((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const selectedIds = [...selected].filter((id) => rows.some((r) => r.id === id));

  const sortProps = (key: SortKey) => ({
    sort: sort.key === key ? sort.dir : null,
    onSort: () => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "position" || key === "text" ? "asc" : "desc" })),
  });

  const step = (dir: 1 | -1) => {
    if (!drawerRow) return;
    const idx = rows.findIndex((r) => r.id === drawerRow.id);
    const next = rows[idx + dir];
    if (next) setParam("p", next.id);
  };

  const topicName = topic === "all" ? "All prompts" : topic;

  return (
    <>
      <PageHeader
        title="Your Prompts"
        actions={
          <>
            <QuotaMeter used={used} />
            <Button variant="outlined" tone="secondary" iconLeft={<UploadSimple className="size-4" />} onClick={() => setImportOpen(true)}>
              <span className="hidden sm:inline">Import keywords</span>
              <span className="sm:hidden">Import</span>
            </Button>
            <Button iconLeft={<Plus weight="bold" className="size-4" />} onClick={() => setParam("add", "1")}>
              Add prompt
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <PageSection>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Tracked prompts" icon={<ChatText weight="fill" />} tile="blue" prior={`${QUOTA - used} slots left`} value={`${used}`} unit={`/ ${QUOTA} quota`} />
          <KpiCard
            label="Avg. visibility"
            icon={<Eye weight="fill" />}
            tile="orange"
            prior="vs 38.1%"
            value={fmt.pct(avgVis)}
            unit="per prompt"
            delta={{ value: fmt.signed(avgVis - 38.1) + " pts", direction: avgVis >= 38.1 ? "up" : "down" }}
          />
          <KpiCard
            label="Avg. position"
            icon={<Medal weight="fill" />}
            tile="green"
            prior="vs #2.6"
            value={`#${avgPos.toFixed(1)}`}
            unit="when mentioned"
            delta={{ value: fmt.signed(avgPos - 2.6), direction: avgPos <= 2.6 ? "up" : "down", good: avgPos <= 2.6 }}
          />
          <KpiCard
            label="Not mentioned"
            icon={<EyeSlash weight="fill" />}
            tile="pink"
            prior="0% visibility"
            value={`${invisible}`}
            unit={invisible === 1 ? "prompt" : "prompts"}
            delta={{ value: "−1", direction: "down", good: true }}
          />
        </div>
      </PageSection>

      {/* Topics + table */}
      <PageSection className="grid flex-1 grid-cols-1 items-start gap-4 lg:grid-cols-[232px_minmax(0,1fr)]">
        {/* Topics */}
        <div className={cn("lg:sticky lg:top-5", topicsOpen ? "block" : "hidden lg:block")}>
          <TopicsPanel
            topics={topicList}
            total={inTab.length}
            value={topic}
            onChange={(t) => {
              setTopic(t);
              setTopicsOpen(false);
              setSelected(new Set());
            }}
            onAdd={(name) => {
              setExtraTopics((e) => [...e, name]);
              toast({ title: `Topic “${name}” created`, description: "Move prompts into it from the selection bar." });
            }}
          />
        </div>

        <div className="relative flex min-w-0 flex-col">
          <Card>
            <div className="px-3">
              <Tabs<Tab>
                className="border-b-0"
                value={tab}
                onChange={setTab}
                options={[
                  { value: "active", label: "Active", count: counts.active },
                  { value: "suggested", label: "Suggested", count: counts.suggested ? `+${counts.suggested}` : 0 },
                  { value: "inactive", label: "Inactive", count: counts.inactive },
                ]}
              />
            </div>
            <CardPanel flush className="flex flex-col">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
                <Button
                  variant="outlined"
                  tone="secondary"
                  className="lg:hidden"
                  iconLeft={<SidebarSimple className="size-4" />}
                  onClick={() => setTopicsOpen((o) => !o)}
                  aria-expanded={topicsOpen}
                >
                  <span className="max-w-[140px] truncate">{topicName}</span>
                </Button>
                <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search prompts, topics, tags…" wrapperClassName="min-w-[180px] flex-1 sm:max-w-[320px]" />
                <Select<"all" | Intent>
                  label="Intent"
                  value={intent}
                  onChange={setIntent}
                  options={[
                    { value: "all", label: "All intents" },
                    ...(["Informational", "Comparison", "Transactional", "Navigational"] as Intent[]).map((i) => ({ value: i, label: i })),
                  ]}
                />
                <div className="flex-1" />
                <span className="hidden t-caption text-ink-3 md:inline">
                  <span className="t-num-sm text-ink-2">{rows.length}</span> of {inTab.length}
                </span>
                <Button variant="outlined" tone="secondary" loading={suggesting} iconLeft={<Sparkle weight="fill" className="size-4 text-[var(--purple-500)]" />} onClick={suggestMore}>
                  Suggest more
                </Button>
              </div>

              {/* Body */}
              {rows.length === 0 ? (
                tab === "inactive" && inTab.length === 0 ? (
                  <EmptyState
                    icon={<Tray weight="duotone" />}
                    title="No inactive prompts"
                    description="All your prompts are active and running smoothly."
                    action={
                      <Button variant="outlined" tone="secondary" onClick={() => setTab("active")}>
                        View active prompts
                      </Button>
                    }
                  />
                ) : tab === "suggested" && inTab.length === 0 ? (
                  <EmptyState
                    icon={<Sparkle weight="duotone" />}
                    title="No suggestions waiting"
                    description="We'll suggest prompts as we discover new questions in your topics."
                    action={
                      <Button variant="outlined" tone="secondary" loading={suggesting} onClick={suggestMore}>
                        Suggest more
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={<Hash weight="duotone" />}
                    title="No prompts match"
                    description="Try a different search, intent or topic."
                    action={
                      <Button
                        variant="outlined"
                        tone="secondary"
                        onClick={() => {
                          setQ("");
                          setIntent("all");
                          setTopic("all");
                        }}
                      >
                        Clear filters
                      </Button>
                    }
                  />
                )
              ) : (
                <div className="p-2">
                  <Table className="min-w-[960px]">
                    <THead>
                      <tr>
                        <Th className="w-9 pr-0">
                          <Checkbox checked={allSelected} indeterminate={!allSelected && someSelected} onChange={toggleAll} />
                        </Th>
                        <Th {...sortProps("text")}>Prompt</Th>
                        <Th>Intent</Th>
                        {tab === "suggested" ? (
                          <>
                            <Th {...sortProps("volume")}>Volume</Th>
                            <Th>Topic</Th>
                          </>
                        ) : (
                          <>
                            <Th align="right" {...sortProps("visibility")}>
                              Visibility
                            </Th>
                            <Th align="right" {...sortProps("position")}>
                              Position
                            </Th>
                            <Th align="right" {...sortProps("sentiment")}>
                              Sentiment
                            </Th>
                            <Th>Models</Th>
                          </>
                        )}
                        <Th>Location</Th>
                        <Th>Added</Th>
                        <Th align="right" className="w-[92px]">
                          <span className="sr-only">Actions</span>
                        </Th>
                      </tr>
                    </THead>
                    <tbody>
                      {rows.map((r) => (
                        <PromptRow
                          key={r.id}
                          row={r}
                          tab={tab}
                          checked={selected.has(r.id)}
                          active={drawerId === r.id}
                          onCheck={() => toggle(r.id)}
                          onOpen={() => setParam("p", r.id)}
                          onAccept={() => activate([r.id], "track")}
                          onReject={() => remove([r.id], "rejected")}
                          onPause={() => pause([r.id])}
                          onResume={() => activate([r.id], "resume")}
                          onDelete={() => remove([r.id])}
                        />
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              {tab === "suggested" && inTab.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-t border-line bg-canvas px-4 py-3 [border-bottom-left-radius:12px] [border-bottom-right-radius:12px]">
                  <Sparkle weight="fill" className="size-4 text-[var(--purple-500)]" />
                  <span className="t-caption text-ink-2">
                    <span className="t-num-sm-medium text-ink">{inTab.length}</span> suggestions from your topics, competitor gaps and fan-out queries
                  </span>
                  <div className="flex-1" />
                  <Button variant="outlined" tone="secondary" size="xs" iconLeft={<X className="size-3.5" />} onClick={() => remove(inTab.map((i) => i.id), "rejected")}>
                    Reject all
                  </Button>
                  <Button variant="outlined" size="xs" iconLeft={<Check weight="bold" className="size-3.5" />} onClick={() => activate(inTab.map((i) => i.id), "track")}>
                    Track all
                  </Button>
                </div>
              )}
            </CardPanel>
          </Card>

          {/* Floating bulk bar */}
          {selectedIds.length > 0 && (
            <div className="pointer-events-none sticky bottom-4 z-20 mt-3 flex justify-center">
              <div className="pointer-events-auto flex max-w-full flex-wrap items-center gap-1 rounded-xl bg-surface p-1.5 shadow-popover animate-[sy-pop-in_180ms_var(--ease-out)]">
                <span className="flex items-center gap-2 px-2 t-caption-medium text-ink">
                  <CountChip className="!h-5 !min-w-5 !bg-inverse !text-on-inverse !shadow-none">{selectedIds.length}</CountChip>
                  selected
                </span>
                <span className="mx-1 h-5 w-px bg-line" />
                {tab === "suggested" ? (
                  <>
                    <Button size="xs" variant="link" tone="secondary" iconLeft={<Check weight="bold" className="size-3.5" />} onClick={() => activate(selectedIds, "track")}>
                      Track
                    </Button>
                    <Button size="xs" variant="link" tone="secondary" iconLeft={<X className="size-3.5" />} onClick={() => remove(selectedIds, "rejected")}>
                      Reject
                    </Button>
                  </>
                ) : tab === "inactive" ? (
                  <Button size="xs" variant="link" tone="secondary" iconLeft={<Play className="size-3.5" />} onClick={() => activate(selectedIds, "resume")}>
                    Resume
                  </Button>
                ) : (
                  <Button size="xs" variant="link" tone="secondary" iconLeft={<Pause className="size-3.5" />} onClick={() => pause(selectedIds)}>
                    Pause
                  </Button>
                )}
                <Popover
                  side="top"
                  align="start"
                  trigger={({ open, toggle }) => (
                    <Button size="xs" variant="link" tone="secondary" iconLeft={<FolderSimple className="size-3.5" />} iconRight={<CaretUp className={cn("size-3 transition-transform", !open && "rotate-180")} />} onClick={toggle}>
                      Move to topic
                    </Button>
                  )}
                >
                  {(close) => (
                    <div className="max-h-72 w-56 overflow-y-auto">
                      <MenuLabel>Move {selectedIds.length} to…</MenuLabel>
                      {topicList.map(([t]) => (
                        <MenuItem
                          key={t}
                          icon={<Hash />}
                          onClick={() => {
                            moveTo(selectedIds, t);
                            close();
                          }}
                        >
                          {t}
                        </MenuItem>
                      ))}
                    </div>
                  )}
                </Popover>
                {tab !== "suggested" && (
                  <Button size="xs" variant="link" tone="danger" iconLeft={<Trash className="size-3.5" />} onClick={() => remove(selectedIds)}>
                    Delete
                  </Button>
                )}
                <span className="mx-1 h-5 w-px bg-line" />
                <IconButton label="Clear selection" size="xs" variant="link" onClick={() => setSelected(new Set())}>
                  <X className="size-3.5" />
                </IconButton>
              </div>
            </div>
          )}
        </div>
      </PageSection>

      {drawerRow && (
        <PromptDrawer
          key={drawerRow.id}
          row={drawerRow}
          position={rows.findIndex((r) => r.id === drawerRow.id)}
          total={rows.length}
          onStep={step}
          onClose={() => setParam("p", null)}
          onPause={() => pause([drawerRow.id])}
          onResume={() => activate([drawerRow.id], drawerRow.status === "suggested" ? "track" : "resume")}
        />
      )}

      <AddPromptDialog
        key={addOpen ? "add-open" : "add-closed"}
        open={addOpen}
        used={used}
        topics={topicList.map(([t]) => t)}
        onClose={() => setParam("add", null)}
        onSubmit={addPrompts}
      />
      <ImportDialog key={importOpen ? "imp-open" : "imp-closed"} open={importOpen} onClose={() => setImportOpen(false)} onSubmit={importKeywords} />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Header quota                                                                */
/* -------------------------------------------------------------------------- */

function QuotaMeter({ used }: { used: number }) {
  const ratio = used / QUOTA;
  return (
    <div className="hidden h-8 items-center gap-2 rounded-lg bg-canvas px-2.5 shadow-control-soft md:flex" title={`${used} of ${QUOTA} prompts used`}>
      <Progress value={used} max={QUOTA} tone={ratio >= 0.95 ? "red" : ratio >= 0.8 ? "orange" : "green"} className="w-12" />
      <span className="t-num-sm-medium text-ink">
        {used} / {QUOTA}
      </span>
      <span className="t-caption text-ink-3">prompts</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Topics panel                                                                */
/* -------------------------------------------------------------------------- */

function TopicsPanel({
  topics,
  total,
  value,
  onChange,
  onAdd,
}: {
  topics: [string, number][];
  total: number;
  value: string;
  onChange: (t: string) => void;
  onAdd: (name: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const submit = () => {
    const n = name.trim();
    if (n && !topics.some(([t]) => t.toLowerCase() === n.toLowerCase())) onAdd(n);
    setName("");
    setAdding(false);
  };
  const item = (key: string, label: ReactNode, count: number, icon: ReactNode) => (
    <button
      key={key}
      type="button"
      onClick={() => onChange(key)}
      aria-pressed={value === key}
      className={cn(
        "flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left t-body transition-colors duration-100",
        value === key ? "bg-subtle text-ink t-body-medium" : "text-ink-2 hover:bg-canvas hover:text-ink",
      )}
    >
      <span className="text-icon-muted [&_svg]:size-4">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className={cn("t-num-sm", value === key ? "text-ink" : "text-ink-3")}>{count}</span>
    </button>
  );
  return (
    <Card>
      <CardHeader
        title="Topics"
        meta={`${topics.length}`}
        actions={
          <IconButton label="Add topic" size="xs" onClick={() => setAdding(true)}>
            <Plus className="size-3.5" />
          </IconButton>
        }
      />
      <CardPanel flush className="flex flex-col gap-0.5 p-1.5">
        {item("all", "All prompts", total, <ChatText />)}
        <div className="mx-2 my-1 h-px bg-line" />
        <div className="flex max-h-[420px] flex-col gap-0.5 overflow-y-auto">{topics.map(([t, c]) => item(t, t, c, <Hash />))}</div>
        <div className="mx-2 my-1 h-px bg-line" />
        {adding ? (
          <div className="p-1">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Topic name"
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") {
                  setName("");
                  setAdding(false);
                }
              }}
              onBlur={submit}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex h-8 items-center gap-2 rounded-lg px-2 t-body text-ink-2 transition-colors hover:bg-canvas hover:text-ink"
          >
            <Plus className="size-4 text-icon-muted" />
            Add topic
          </button>
        )}
      </CardPanel>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Row                                                                         */
/* -------------------------------------------------------------------------- */

function ModelStack({ ids, max = 4 }: { ids: ModelId[]; max?: number }) {
  if (!ids.length) return <span className="t-caption text-ink-3">Not mentioned</span>;
  return (
    <span className="flex items-center -space-x-1">
      {ids.slice(0, max).map((m) => (
        <ModelMark key={m} id={m} size={20} className="rounded-full ring-2 ring-surface" />
      ))}
      {ids.length > max && <span className="z-10 grid size-5 place-items-center rounded-full bg-subtle t-micro text-ink-2 ring-2 ring-surface">+{ids.length - max}</span>}
    </span>
  );
}

function PromptRow({
  row: r,
  tab,
  checked,
  active,
  onCheck,
  onOpen,
  onAccept,
  onReject,
  onPause,
  onResume,
  onDelete,
}: {
  row: Row;
  tab: Tab;
  checked: boolean;
  active: boolean;
  onCheck: () => void;
  onOpen: () => void;
  onAccept: () => void;
  onReject: () => void;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
}) {
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <Tr interactive selected={checked || active} onClick={onOpen} className={cn(tab === "inactive" && "[&>td]:text-ink-2")}>
      <Td className="w-9 pr-0" onClick={stop}>
        <Checkbox checked={checked} onChange={onCheck} />
      </Td>
      <Td className="max-w-[380px] py-2.5">
        <div className="truncate t-body-medium text-ink" title={r.text}>
          {r.text}
        </div>
        <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
          <span className="truncate t-caption text-ink-3">{r.topic}</span>
          {r.branded && <Badge tone="outline">Branded</Badge>}
          {r.tags
            .filter((t) => t !== "branded")
            .map((t) => (
              <Badge key={t} tone="neutral">
                {t}
              </Badge>
            ))}
        </div>
      </Td>
      <Td>
        <Badge tone={intentTone[r.intent]}>{r.intent}</Badge>
      </Td>
      {tab === "suggested" ? (
        <>
          <Td>
            <VolumeBars level={r.volume} />
          </Td>
          <Td className="t-caption text-ink-2">{r.topic}</Td>
        </>
      ) : (
        <>
          <Td align="right">
            {r.pending ? (
              <span className="inline-flex items-center gap-1.5 t-caption text-ink-3">
                <Spinner className="size-3" />
                Collecting
              </span>
            ) : (
              <span className="inline-flex items-center justify-end gap-2.5">
                {r.visibility > 0 && <Sparkline values={r.trend} width={52} height={20} color={r.visibility >= 50 ? "var(--status-success)" : "var(--data-1)"} />}
                <span className={cn("t-num w-12", r.visibility === 0 && "text-ink-3")}>{fmt.pct(r.visibility, 0)}</span>
              </span>
            )}
          </Td>
          <Td align="right" className="t-num text-ink-2">
            {r.position !== null ? `#${r.position.toFixed(1)}` : "—"}
          </Td>
          <Td align="right">{r.sentiment !== null ? <SentimentScore value={r.sentiment} /> : <span className="t-num-sm text-ink-3">—</span>}</Td>
          <Td>{r.pending ? <span className="t-caption text-ink-3">Running…</span> : <ModelStack ids={r.models} />}</Td>
        </>
      )}
      <Td>
        <span className="inline-flex items-center gap-1.5 t-caption text-ink-2">
          <span className="text-[14px] leading-none">{flagOf(r.location)}</span>
          {r.location}
        </span>
      </Td>
      <Td className="whitespace-nowrap t-caption text-ink-2">{r.added}</Td>
      <Td align="right" onClick={stop}>
        <span className="inline-flex items-center justify-end gap-1">
          {tab === "suggested" ? (
            <>
              <IconButton label="Reject suggestion" size="xs" onClick={onReject} className="hover:!text-danger">
                <X className="size-3.5" />
              </IconButton>
              <IconButton label="Track prompt" size="xs" tone="primary" variant="filled" onClick={onAccept}>
                <Check weight="bold" className="size-3.5" />
              </IconButton>
            </>
          ) : (
            <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              {tab === "inactive" ? (
                <IconButton label="Resume tracking" size="xs" variant="link" onClick={onResume}>
                  <Play className="size-3.5" />
                </IconButton>
              ) : (
                <IconButton label="Pause tracking" size="xs" variant="link" onClick={onPause}>
                  <Pause className="size-3.5" />
                </IconButton>
              )}
              <IconButton label="Delete prompt" size="xs" variant="link" tone="danger" onClick={onDelete}>
                <Trash className="size-3.5" />
              </IconButton>
            </span>
          )}
        </span>
      </Td>
    </Tr>
  );
}

function VolumeBars({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex items-end gap-[2px]" aria-label={`Volume ${level} of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="w-1 rounded-[1.5px]" style={{ height: 4 + i * 2, background: i <= level ? "var(--status-success)" : "var(--bg-muted)" }} />
        ))}
      </span>
      <span className="t-caption text-ink-3">{["Very low", "Low", "Medium", "High", "Very high"][level - 1]}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Drawer                                                                      */
/* -------------------------------------------------------------------------- */

function highlight(text: string) {
  return text.split(/(Lumen)/g).map((part, i) =>
    part === "Lumen" ? (
      <span key={i} className="rounded-[3px] bg-brand-subtle px-0.5 font-medium text-brand">
        Lumen
      </span>
    ) : (
      part
    ),
  );
}

function answersFor(p: Row) {
  const rivals = brands.filter((b) => !b.you);
  const engines = p.engines ?? ENGINES;
  return engines.map((m) => {
    const h = hash(p.id + m);
    const a = rivals[h % rivals.length].name;
    const b = rivals[(h + 3) % rivals.length].name;
    const mentioned = p.models.includes(m);
    const pos = mentioned ? Math.min(6, Math.max(1, Math.round(p.position ?? 2) + ((h % 3) - 1))) : null;
    const excerpt = !mentioned
      ? h % 2
        ? `Most answers point to ${a} and ${b}, citing G2 reviews and comparison guides. Lumen isn't mentioned in this answer.`
        : `${a} is the usual pick here, with ${b} as a cheaper option. The answer doesn't reference Lumen or lumen.so.`
      : pos === 1
        ? `Lumen is the most frequently recommended option, praised for no-code event tracking and account-level reporting. ${a} is a common alternative for larger data teams.`
        : `${a} is listed first, followed by Lumen, which reviewers highlight for fast setup and clear per-seat pricing. ${b} is suggested for warehouse-native teams.`;
    return { m, mentioned, pos, excerpt, cited: mentioned && h % 3 !== 0 };
  });
}

function competitorsFor(p: Row) {
  const total = (p.engines ?? ENGINES).length;
  return brands
    .filter((b) => !b.you)
    .map((b) => ({ b, n: Math.min(total, hash(p.id + b.id) % (total + 2)) }))
    .filter((c) => c.n > 0)
    .sort((x, y) => y.n - x.n)
    .slice(0, 5)
    .map((c) => ({ ...c, total }));
}

function PromptDrawer({
  row,
  position,
  total,
  onStep,
  onClose,
  onPause,
  onResume,
}: {
  row: Row;
  position: number;
  total: number;
  onStep: (dir: 1 | -1) => void;
  onClose: () => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const nav = useNavigate();
  const toast = useToast();
  const [shown, setShown] = useState(false);
  const [rerunning, setRerunning] = useState(false);

  const close = useCallback(() => {
    setShown(false);
    window.setTimeout(onClose, 180);
  }, [onClose]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    };
  }, [close]);

  const tracked = row.status !== "suggested" && !row.pending;
  const answers = useMemo(() => answersFor(row), [row]);
  const comps = useMemo(() => competitorsFor(row), [row]);
  const mentionedCount = answers.filter((a) => a.mentioned).length;
  const hasTrend = row.trend.some((v) => v > 0);

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className={cn("absolute inset-0 bg-scrim transition-opacity duration-200 ease-out", shown ? "opacity-100" : "opacity-0")}
        onClick={close}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Prompt details"
        className={cn(
          "absolute inset-y-2 right-2 flex w-[min(500px,calc(100vw-16px))] flex-col overflow-hidden rounded-2xl bg-surface shadow-popover transition-transform duration-[260ms] ease-[var(--ease-out)]",
          shown ? "translate-x-0" : "translate-x-[calc(100%+16px)]",
        )}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <Badge tone={intentTone[row.intent]}>{row.intent}</Badge>
            <span className="inline-flex items-center gap-1 t-caption text-ink-2">
              <Hash className="size-3.5 text-icon-muted" />
              {row.topic}
            </span>
            <span className="t-caption text-ink-3">·</span>
            <span className="t-caption text-ink-2">
              {flagOf(row.location)} {row.location}
            </span>
            <div className="flex-1" />
            {position >= 0 && (
              <span className="mr-1 hidden t-num-sm text-ink-3 sm:inline">
                {position + 1}/{total}
              </span>
            )}
            <IconButton label="Previous prompt" size="xs" disabled={position <= 0} onClick={() => onStep(-1)} className="disabled:opacity-40">
              <CaretUp className="size-3.5" />
            </IconButton>
            <IconButton label="Next prompt" size="xs" disabled={position < 0 || position >= total - 1} onClick={() => onStep(1)} className="disabled:opacity-40">
              <CaretDown className="size-3.5" />
            </IconButton>
            <IconButton label="Close" size="xs" variant="link" onClick={close}>
              <X className="size-4" />
            </IconButton>
          </div>
          <h2 className="t-title text-ink [text-wrap:balance]">{row.text}</h2>
          <div className="flex flex-wrap items-center gap-2">
            {row.status === "suggested" ? (
              <StatusPill tone="info">Suggested · not tracked yet</StatusPill>
            ) : row.status === "inactive" ? (
              <StatusPill tone="neutral">Paused</StatusPill>
            ) : row.pending ? (
              <StatusPill tone="warning">Collecting first answers</StatusPill>
            ) : (
              <StatusPill tone="success">Tracking daily · last run 06:30 UTC</StatusPill>
            )}
            <span className="t-caption text-ink-3">Added {row.added}</span>
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!tracked ? (
            <EmptyState
              icon={row.pending ? <Spinner className="!size-5" /> : <Sparkle weight="duotone" />}
              title={row.pending ? "Running across engines" : "Start tracking to see answers"}
              description={
                row.pending
                  ? `We're asking ${(row.engines ?? ENGINES).length} engines this prompt. Results usually land within a few minutes.`
                  : "Sonya will ask this prompt daily on every engine you track and report where Lumen appears."
              }
              action={
                row.status === "suggested" ? (
                  <Button iconLeft={<Check weight="bold" className="size-4" />} onClick={onResume}>
                    Track prompt
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="flex flex-col gap-5 p-5">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line shadow-card sm:grid-cols-4">
                {[
                  { label: "Visibility", value: fmt.pct(row.visibility, 0) },
                  { label: "Position", value: row.position !== null ? `#${row.position.toFixed(1)}` : "—" },
                  { label: "Sentiment", value: row.sentiment !== null ? `${row.sentiment}` : "—" },
                  { label: "Mentioned in", value: `${mentionedCount}/${answers.length}` },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col gap-1 bg-surface px-3 py-2.5">
                    <span className="t-caption text-ink-3">{s.label}</span>
                    <span className="t-num text-ink">{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Trend */}
              <section className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="t-heading text-ink">Visibility trend</h3>
                  <span className="t-caption text-ink-3">Last 10 days</span>
                </div>
                {hasTrend ? (
                  <LineChart
                    labels={days14.slice(4)}
                    series={[{ id: "v", label: "Visibility", values: row.trend, color: "var(--data-1)", emphasis: true }]}
                    height={136}
                    yTicks={3}
                    format={(v) => `${Math.round(v)}%`}
                  />
                ) : (
                  <div className="grid h-[96px] place-items-center rounded-xl bg-canvas t-caption text-ink-3">No mentions in the last 10 days</div>
                )}
              </section>

              {/* Per-model answers */}
              <section className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="t-heading text-ink">Answers by model</h3>
                  <span className="t-caption text-ink-3">Today · 06:30 UTC</span>
                </div>
                <div className="flex flex-col rounded-xl bg-surface shadow-card">
                  {answers.map((a) => (
                    <div key={a.m} className="flex gap-3 border-b border-line p-3 last:border-b-0">
                      <ModelMark id={a.m} size={28} className="mt-0.5 rounded-full" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="t-body-medium text-ink">{MODELS[a.m].name}</span>
                          {a.mentioned ? (
                            <Badge tone="green">
                              <Check weight="bold" className="size-2.5" />
                              Mentioned
                            </Badge>
                          ) : (
                            <Badge tone="neutral">Not mentioned</Badge>
                          )}
                          {a.cited && <Badge tone="outline">Cited lumen.so</Badge>}
                          <span className="flex-1" />
                          <span className="t-num-sm-medium text-ink-2">{a.pos ? `#${a.pos}` : "—"}</span>
                        </div>
                        <p className="mt-1.5 border-l-2 border-line pl-2.5 t-caption text-ink-2">{highlight(a.excerpt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Competitors */}
              <section className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="t-heading text-ink">Competitors mentioned</h3>
                  <span className="t-caption text-ink-3">Engines mentioning</span>
                </div>
                <div className="flex flex-col gap-2.5 rounded-xl bg-surface p-3 shadow-card">
                  {comps.map(({ b, n, total: t }) => (
                    <div key={b.id} className="flex items-center gap-2.5">
                      <BrandMark brand={b} size={20} />
                      <span className="w-20 truncate t-body-medium text-ink">{b.name}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle">
                        <div className="h-full rounded-full" style={{ width: `${(n / t) * 100}%`, background: b.color === "#141414" ? "var(--icon-subtle)" : b.color }} />
                      </div>
                      <span className="w-10 text-right t-num-sm-medium text-ink-2">
                        {n}/{t}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-canvas px-5 py-3">
          {row.status === "active" ? (
            <Button variant="outlined" tone="secondary" iconLeft={<Pause className="size-4" />} onClick={onPause}>
              Pause
            </Button>
          ) : row.status === "inactive" ? (
            <Button variant="outlined" tone="secondary" iconLeft={<Play className="size-4" />} onClick={onResume}>
              Resume
            </Button>
          ) : null}
          {tracked && (
            <Button
              variant="outlined"
              tone="secondary"
              loading={rerunning}
              iconLeft={<ArrowClockwise className="size-4" />}
              onClick={() => {
                setRerunning(true);
                window.setTimeout(() => {
                  setRerunning(false);
                  toast({ title: "Prompt re-run", description: `Fresh answers collected from ${answers.length} engines.` });
                }, 1100);
              }}
            >
              Re-run now
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="link" tone="secondary" iconRight={<ArrowUpRight className="size-4" />} onClick={() => nav("/insights/visibility")}>
            Open in AEO Insights
          </Button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */
/* Add prompt                                                                  */
/* -------------------------------------------------------------------------- */

function AddPromptDialog({
  open,
  used,
  topics,
  onClose,
  onSubmit,
}: {
  open: boolean;
  used: number;
  topics: string[];
  onClose: () => void;
  onSubmit: (texts: string[], opts: { engines: ModelId[]; location: string; topic: string }) => void;
}) {
  const [engines, setEngines] = useState<ModelId[]>(["chatgpt", "perplexity", "aio", "gemini"]);
  const [location, setLocation] = useState("US");
  const [language, setLanguage] = useState("English");
  const [topic, setTopic] = useState("auto");
  const [text, setText] = useState("");
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const unique = [...new Set(lines)];
  const total = used + unique.length;
  const over = total > QUOTA;
  const ratio = Math.min(1, total / QUOTA);

  const toggleEngine = (m: ModelId) => setEngines((e) => (e.includes(m) ? e.filter((x) => x !== m) : [...e, m]));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Add prompts"
      description="Sonya asks each prompt daily on the engines you choose and reports where Lumen shows up."
      footer={
        <>
          <span className="mr-auto hidden t-caption text-ink-3 sm:inline">
            <span className="t-num-sm text-ink-2">{unique.length * engines.length}</span> answers per day
          </span>
          <Button variant="outlined" tone="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!unique.length || !engines.length || over} onClick={() => onSubmit(unique, { engines, location, topic })}>
            Start tracking
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 p-5">
        <Field label="Engines" aside={<span className="t-caption text-ink-3">{engines.length} selected</span>}>
          <div className="flex flex-wrap gap-2">
            {ENGINES.map((m) => (
              <ChoiceChip key={m} selected={engines.includes(m)} onClick={() => toggleEngine(m)} icon={<ModelMark id={m} size={16} className="rounded-full" />}>
                {MODELS[m].name}
                {engines.includes(m) && <Check weight="bold" className="size-3 text-ink" />}
              </ChoiceChip>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Location">
            <Select
              label="Location"
              value={location}
              onChange={setLocation}
              className="w-full justify-between"
              options={locations.map((l) => ({ value: l.code, label: `${l.flag}  ${l.name}` }))}
            />
          </Field>
          <Field label="Language">
            <Select
              label="Language"
              value={language}
              onChange={setLanguage}
              className="w-full justify-between"
              options={LANGUAGES.map((l) => ({ value: l, label: l }))}
            />
          </Field>
          <Field label="Topic">
            <Select
              label="Topic"
              value={topic}
              onChange={setTopic}
              align="end"
              className="w-full justify-between"
              options={[{ value: "auto", label: "Auto-assign", description: "Sonya picks the closest topic" }, ...topics.map((t) => ({ value: t, label: t }))]}
            />
          </Field>
        </div>

        <Field
          label="Prompts"
          aside={<span className="t-caption text-ink-3">One prompt per line</span>}
          error={over ? `That's ${total - QUOTA} over your plan. Remove some lines or pause existing prompts.` : undefined}
          hint={unique.length < lines.length ? `${lines.length - unique.length} duplicate ${lines.length - unique.length === 1 ? "line" : "lines"} will be skipped.` : undefined}
        >
          <Textarea
            autoFocus
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"What is the best product analytics tool for startups?\nLumen vs Orbit for retention analysis\nHow do I measure feature adoption?"}
          />
        </Field>

        <div className="flex flex-col gap-2 rounded-xl bg-canvas p-3 shadow-card">
          <div className="flex items-center justify-between">
            <span className="t-caption-medium text-ink">Prompts used</span>
            <span className={cn("t-num-sm-medium", over ? "text-danger" : "text-ink")}>
              {total}/{QUOTA}
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-subtle">
            <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--icon-subtle)]" style={{ width: `${(Math.min(used, QUOTA) / QUOTA) * 100}%` }} />
            <div
              className="absolute inset-y-0 rounded-full transition-[width] duration-300 ease-out"
              style={{
                left: `${(Math.min(used, QUOTA) / QUOTA) * 100}%`,
                width: `${Math.max(0, ratio - used / QUOTA) * 100}%`,
                background: over ? "var(--status-danger)" : "var(--blue-500)",
              }}
            />
          </div>
          <span className="t-caption text-ink-3">
            {used} tracked · {unique.length} new · {language} answers from {flagOf(location)} {location}
          </span>
        </div>
      </div>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Import keywords                                                             */
/* -------------------------------------------------------------------------- */

function ImportDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (kws: string[]) => void }) {
  const [text, setText] = useState("");
  const kws = [
    ...new Set(
      text
        .split(/[\n,]/)
        .map((k) => k.trim())
        .filter(Boolean),
    ),
  ];
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Import keywords"
      description="Paste SEO keywords — Sonya rewrites each one as a natural-language prompt and adds it to Suggested."
      footer={
        <>
          <Button variant="outlined" tone="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!kws.length} onClick={() => onSubmit(kws)}>
            Convert {kws.length > 0 ? kws.length : ""} {kws.length === 1 ? "keyword" : "keywords"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 p-5">
        <Field label="Keywords" aside={<span className="t-caption text-ink-3">Comma or new line separated</span>}>
          <Textarea autoFocus rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={"funnel analysis\nproduct analytics pricing, cohort retention\nsaas activation metrics"} />
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="t-caption-medium text-ink">Preview</span>
          {kws.length === 0 ? (
            <div className="rounded-xl bg-canvas p-3 t-caption text-ink-3">Converted prompts appear here.</div>
          ) : (
            <div className="flex max-h-40 flex-col overflow-y-auto rounded-xl bg-canvas p-1">
              {kws.slice(0, 8).map((k) => (
                <div key={k} className="flex items-center gap-2 rounded-lg px-2 py-1.5 t-caption">
                  <span className="w-28 shrink-0 truncate text-ink-3">{k}</span>
                  <ArrowUpRight className="size-3 shrink-0 rotate-45 text-icon-muted" />
                  <span className="truncate text-ink">{/^(how|what|which|why|is|best|lumen)/i.test(k) ? k : `What is the best tool for ${k}?`}</span>
                </div>
              ))}
              {kws.length > 8 && <div className="px-2 py-1.5 t-caption text-ink-3">+{kws.length - 8} more</div>}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
