import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ArrowDown,
  ArrowSquareOut,
  ArrowUp,
  CheckCircle,
  Eye,
  LinkSimple,
  ListNumbers,
  Plus,
  Question,
  Robot,
  Sparkle,
  Table as TableIcon,
  TextB,
  TextHTwo,
  TextItalic,
  TextT,
  Trash,
  Trophy,
  XCircle,
} from "@phosphor-icons/react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  CardPanel,
  DomainMark,
  IconButton,
  MenuItem,
  ModelMark,
  Popover,
  ScoreRing,
  Select,
  Spinner,
  StatusDot,
  StatusPill,
  useToast,
  type StatusTone,
} from "@/components/ui";
import { PageHeader } from "@/components/shell/PageHeader";
import { contentItems, prompts } from "@/data/mock";
import { cn } from "@/lib/cn";
import { contentStatuses, TypeBadge, type ContentStatus } from "./contentShared";

/* Blocks ----------------------------------------------------------------------- */

type Block =
  | { id: string; kind: "h2" | "p"; text: string }
  | { id: string; kind: "table"; rows: string[][] }
  | { id: string; kind: "faq"; items: { q: string; a: string }[] }
  | { id: string; kind: "sources"; items: { title: string; url: string }[] };

let uid = 0;
const nid = () => `b${++uid}`;

/** Same shape for every template: table at index 2, FAQ at index 7 (the checklist fixes rely on it). */
function template(target: string, title: string): Block[] {
  if (!/\bvs\b/i.test(target)) return guideTemplate(target);
  const [a, b] = target.split(/\s+vs\.?\s+/i);
  return [
    {
      id: nid(),
      kind: "p",
      text: `Short answer: ${a} is the better fit for B2B teams that need account-level analytics and no-code event tracking, while ${b} suits developer-led teams that want to self-host. Both cover funnels and retention; ${a}'s per-seat pricing is easier to forecast as you grow.`,
    },
    { id: nid(), kind: "h2", text: `${a} vs ${b} at a glance` },
    {
      id: nid(),
      kind: "table",
      rows: [
        ["", a, b],
        ["Best for", "B2B SaaS, account-level reporting", "Developer-led product teams"],
        ["Event tracking", "No-code tagging + SDK", "SDK only"],
        ["Session replay", "Included on Growth", "Paid add-on"],
        ["Warehouse sync", "Snowflake, BigQuery", "BigQuery"],
        ["Pricing", "From $49/mo for 5 seats", "Free self-host · cloud usage-based"],
      ],
    },
    { id: nid(), kind: "h2", text: `When to choose ${a}` },
    {
      id: nid(),
      kind: "p",
      text: `Pick ${a} if product managers need to answer questions without waiting on engineering. Visual event tagging means you can define “activated account” after the fact and backfill it across historical data — the reason most teams searching for “${title.split(":")[0]}” end up shortlisting it.`,
    },
    { id: nid(), kind: "h2", text: `When to choose ${b}` },
    {
      id: nid(),
      kind: "p",
      text: `${b} makes sense when you already run your own infrastructure and want full control of raw events. Expect to invest engineering time in instrumentation and dashboard upkeep.`,
    },
    {
      id: nid(),
      kind: "faq",
      items: [
        { q: `Is ${a} cheaper than ${b}?`, a: `For teams under 20 seats, usually yes: ${a} is priced per seat with unlimited events, while ${b}'s cloud plan bills per event.` },
        { q: `Can I migrate from ${b} to ${a}?`, a: `Yes. ${a} imports historical events from ${b} via its warehouse connector in about a day.` },
      ],
    },
  ];
}

function guideTemplate(target: string): Block[] {
  const t = target.charAt(0).toUpperCase() + target.slice(1);
  return [
    {
      id: nid(),
      kind: "p",
      text: `Short answer: ${t} comes down to three steps — define the event that matters, pick a time window, and compare cohorts week over week. Lumen does this without SQL; a spreadsheet works for a first pass but breaks past a few thousand users.`,
    },
    { id: nid(), kind: "h2", text: "Ways to do it, compared" },
    {
      id: nid(),
      kind: "table",
      rows: [
        ["", "Lumen", "Spreadsheet", "Warehouse SQL"],
        ["Setup time", "Minutes", "Hours", "Days"],
        ["Needs engineers", "No", "No", "Yes"],
        ["Updates automatically", "Yes", "No", "Scheduled"],
        ["Account-level view", "Built in", "Manual", "Custom model"],
      ],
    },
    { id: nid(), kind: "h2", text: `${t}: step by step` },
    {
      id: nid(),
      kind: "p",
      text: "Start with the event that signals real value — for most B2B products that is a second session with a key action inside seven days. Then segment by signup week so you can see whether onboarding changes move the number.",
    },
    { id: nid(), kind: "h2", text: "Benchmarks for 2026" },
    {
      id: nid(),
      kind: "p",
      text: "Across 1,200 B2B SaaS workspaces on Lumen, the median is 34%, with top-quartile products above 52%. Self-serve tools skew higher than sales-led ones.",
    },
    {
      id: nid(),
      kind: "faq",
      items: [
        { q: `What is a good benchmark for ${target}?`, a: "For B2B SaaS, 30–40% is typical and anything above 50% is top quartile." },
        { q: "How often should I review it?", a: "Weekly, by signup cohort, so you can tie changes to specific releases." },
      ],
    },
  ];
}

/* Side-panel data ---------------------------------------------------------------- */

const winners = [
  { domain: "tidal.dev", path: "/compare/lumen", title: "Tidal vs Lumen: an honest comparison", cited: 6 },
  { domain: "g2.com", path: "/compare/lumen-vs-tidal", title: "Lumen vs Tidal — G2 comparison", cited: 4 },
  { domain: "reddit.com", path: "/r/ProductManagement/…", title: "“Anyone switched from Tidal to Lumen?”", cited: 3 },
];

const WEIGHTS = { answer: 14, table: 12, faq: 14, cites: 16, target: 10 } as const;
type CheckId = keyof typeof WEIGHTS;
const BASE = 28;

const statusTone: Record<ContentStatus, StatusTone> = { Brief: "neutral", Draft: "warning", "In review": "info", Published: "success" };

export default function ContentEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const item = contentItems.find((c) => c.id === id) ?? contentItems[0];

  const [title, setTitle] = useState(item.title);
  const [status, setStatus] = useState<ContentStatus>(item.status);
  const [blocks, setBlocks] = useState<Block[]>(() => template(item.target, item.title));
  const [schema, setSchema] = useState(false);
  const [words, setWords] = useState(0);
  const [mentions, setMentions] = useState(true);
  const [saved, setSaved] = useState<"saved" | "saving">("saved");
  const [fixing, setFixing] = useState<CheckId | null>(null);
  const [agent, setAgent] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [marks, setMarks] = useState({ bold: false, italic: false });
  const docRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<number>();

  // Reset when navigating between items
  useEffect(() => {
    setTitle(item.title);
    setStatus(item.status);
    setBlocks(template(item.target, item.title));
    setSchema(false);
  }, [item]);

  const measure = useCallback(() => {
    const text = docRef.current?.innerText ?? "";
    setWords(text.trim() ? text.trim().split(/\s+/).length : 0);
    setMentions(text.toLowerCase().includes(item.target.toLowerCase()));
  }, [item.target]);

  const touch = useCallback(() => {
    measure();
    setSaved("saving");
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaved("saved"), 700);
  }, [measure]);

  useEffect(() => {
    measure();
  }, [blocks, measure]);

  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  useEffect(() => {
    const onSel = () => {
      try {
        setMarks({ bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic") });
      } catch {
        /* not supported */
      }
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  useEffect(() => {
    if (!focusId) return;
    const el = docRef.current?.querySelector<HTMLElement>(`[data-block="${focusId}"] [contenteditable]`);
    if (el) {
      el.focus();
      const r = document.createRange();
      r.selectNodeContents(el);
      r.collapse(false);
      const s = window.getSelection();
      s?.removeAllRanges();
      s?.addRange(r);
    }
    setFocusId(null);
  }, [focusId, blocks]);

  /* Checklist ------------------------------------------------------------------ */

  const hasTable = blocks.some((b) => b.kind === "table");
  const hasFaq = blocks.some((b) => b.kind === "faq");
  const sourcesCount = blocks.reduce((a, b) => a + (b.kind === "sources" ? b.items.length : 0), 0);
  const firstIsAnswer = blocks[0]?.kind === "p";

  const checks: { id: CheckId; label: string; hint: string; ok: boolean; fix: string }[] = [
    { id: "answer", label: "Answer in first 100 words", hint: "Engines quote the opening paragraph most", ok: firstIsAnswer, fix: "Add intro" },
    { id: "table", label: "Comparison table", hint: hasTable ? "Feature table found" : "Tables are lifted into answers verbatim", ok: hasTable, fix: "Insert" },
    { id: "faq", label: "FAQ schema", hint: hasFaq ? (schema ? "FAQPage JSON-LD attached" : "FAQ block has no FAQPage markup") : "No FAQ block yet", ok: hasFaq && schema, fix: "Add schema" },
    { id: "cites", label: "Cites 3+ sources", hint: `${sourcesCount} external source${sourcesCount === 1 ? "" : "s"} linked`, ok: sourcesCount >= 3, fix: "Add sources" },
    { id: "target", label: "Mentions target prompt", hint: `“${item.target}”`, ok: mentions, fix: "Add mention" },
  ];
  const offset = item.score > 0 ? item.score - 64 : 0;
  const raw = BASE + checks.reduce((a, c) => a + (c.ok ? WEIGHTS[c.id] : 0), 0);
  const score = Math.max(0, Math.min(99, raw + offset));
  const passed = checks.filter((c) => c.ok).length;
  const verdict = score >= 80 ? { t: "Likely to be cited", tone: "success" as const } : score >= 50 ? { t: "Needs work", tone: "warning" as const } : { t: "Unlikely to be cited", tone: "danger" as const };

  const applyFix = (cid: CheckId) => {
    setBlocks((bs) => {
      switch (cid) {
        case "answer":
          return [{ id: nid(), kind: "p", text: `Short answer: ${item.target} — Lumen is the stronger choice for B2B SaaS teams that need account-level analytics without engineering help.` }, ...bs];
        case "table":
          return [...bs.slice(0, 2), template(item.target, item.title)[2], ...bs.slice(2)];
        case "faq":
          return bs.some((b) => b.kind === "faq") ? bs : [...bs, template(item.target, item.title)[7]];
        case "cites":
          return [
            ...bs.filter((b) => b.kind !== "sources"),
            {
              id: nid(),
              kind: "sources",
              items: [
                { title: "G2 Fall 2026 Product Analytics Grid", url: "g2.com/categories/product-analytics" },
                { title: "Tidal pricing page", url: "tidal.dev/pricing" },
                { title: "Lumen security & GDPR overview", url: "lumen.so/security" },
              ],
            },
          ];
        case "target":
          return bs.map((b, i) => (i === 0 && b.kind === "p" ? { ...b, id: nid(), text: `${b.text} If you're comparing ${item.target}, start with the table below.` } : b));
      }
    });
    if (cid === "faq") setSchema(true);
    if (cid === "target") setMentions(true);
  };

  const fix = (cid: CheckId) => {
    setFixing(cid);
    setTimeout(() => {
      applyFix(cid);
      setFixing(null);
      touch();
      toast({ title: "Fix applied", description: `${checks.find((c) => c.id === cid)?.label} · +${WEIGHTS[cid]} pts` });
    }, 700);
  };

  const askAgent = () => {
    const todo = checks.filter((c) => !c.ok);
    setAgent(true);
    setTimeout(() => {
      todo.forEach((c) => applyFix(c.id));
      setAgent(false);
      touch();
      toast(
        todo.length
          ? { title: `Agent applied ${todo.length} improvement${todo.length === 1 ? "" : "s"}`, description: todo.map((c) => c.label).join(" · ") }
          : { title: "Nothing left to fix", description: "Every AEO check passes. Publish when ready.", tone: "info" },
      );
    }, 1600);
  };

  const publish = () => {
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      setStatus("Published");
      toast({ title: status === "Published" ? "Changes published" : "Published", description: `lumen.so/${item.type === "Comparison" ? "compare" : item.type === "Docs" ? "docs" : "blog"}/${item.target.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` });
    }, 900);
  };

  /* Block ops ------------------------------------------------------------------- */

  const insert = (kind: Block["kind"], after?: string) => {
    const b: Block =
      kind === "table"
        ? { id: nid(), kind, rows: [["", "Lumen", "Competitor"], ["Feature", "", ""], ["Pricing", "", ""]] }
        : kind === "faq"
          ? { id: nid(), kind, items: [{ q: "New question?", a: "Answer in one or two sentences." }] }
          : kind === "sources"
            ? { id: nid(), kind, items: [{ title: "Source title", url: "example.com" }] }
            : { id: nid(), kind, text: "" };
    setBlocks((bs) => {
      const i = after ? bs.findIndex((x) => x.id === after) : bs.length - 1;
      return [...bs.slice(0, i + 1), b, ...bs.slice(i + 1)];
    });
    if (kind === "p" || kind === "h2") setFocusId(b.id);
    touch();
  };
  const move = (bid: string, dir: -1 | 1) =>
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b.id === bid);
      const j = i + dir;
      if (j < 0 || j >= bs.length) return bs;
      const n = [...bs];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  const removeBlock = (bid: string) => {
    setBlocks((bs) => bs.filter((b) => b.id !== bid));
    touch();
  };
  const updateBlock = (bid: string, fn: (b: Block) => Block) => {
    setBlocks((bs) => bs.map((b) => (b.id === bid ? fn(b) : b)));
    touch();
  };

  const onTextKey = (e: KeyboardEvent<HTMLElement>, b: Block) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      insert("p", b.id);
    } else if (e.key === "Backspace" && !(e.currentTarget.textContent ?? "").length && blocks.length > 1) {
      e.preventDefault();
      const i = blocks.findIndex((x) => x.id === b.id);
      const prev = blocks[i - 1];
      removeBlock(b.id);
      if (prev && (prev.kind === "p" || prev.kind === "h2")) setFocusId(prev.id);
    }
  };

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    touch();
  };

  const targetPrompts = useMemo(
    () => [
      { text: item.target, primary: true, models: ["chatgpt", "perplexity", "aio"] as const, vis: item.score > 80 ? 46 : 0 },
      ...[prompts[0], prompts[3]].map((p) => ({ text: p.text, primary: false, models: p.models.slice(0, 3), vis: p.visibility })),
    ],
    [item],
  );

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Content", to: "/content" }]}
        title={<span className="block max-w-[46ch] truncate">{title || "Untitled"}</span>}
        badge={
          <span className="hidden items-center gap-1.5 t-caption text-ink-3 md:inline-flex">
            {saved === "saving" ? <Spinner className="size-3" /> : <CheckCircle weight="fill" className="size-3.5 text-success" />}
            {saved === "saving" ? "Saving…" : "Saved"}
          </span>
        }
        actions={
          <>
            <Select
              value={status}
              onChange={(v) => {
                setStatus(v);
                toast({ title: `Status set to ${v}`, tone: "info" });
              }}
              label="Status"
              align="end"
              options={contentStatuses.map((s) => ({ value: s, label: s, icon: <StatusDot tone={statusTone[s]} className="!size-1.5" /> }))}
            />
            <Button variant="outlined" tone="secondary" iconLeft={<Eye className="size-4" />} onClick={() => toast({ title: "Preview link copied", description: "Anyone at lumen.so can view this draft.", tone: "info" })}>
              Preview
            </Button>
            <Button loading={publishing} onClick={publish}>
              {status === "Published" ? "Update" : "Publish"}
            </Button>
          </>
        }
      />

      <div className="grid flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Document ------------------------------------------------------------ */}
        <div className="min-w-0 xl:border-r xl:border-line">
          <div className="sticky top-0 z-10 flex items-center gap-1 overflow-x-auto border-b border-line bg-surface/95 px-3 py-2 backdrop-blur [scrollbar-width:none] sm:px-5">
            <ToolBtn label="Undo" onClick={() => exec("undo")}>
              <ArrowCounterClockwise />
            </ToolBtn>
            <ToolBtn label="Redo" onClick={() => exec("redo")}>
              <ArrowClockwise />
            </ToolBtn>
            <Sep />
            <ToolBtn label="Bold" active={marks.bold} onClick={() => exec("bold")}>
              <TextB weight="bold" />
            </ToolBtn>
            <ToolBtn label="Italic" active={marks.italic} onClick={() => exec("italic")}>
              <TextItalic />
            </ToolBtn>
            <ToolBtn label="Link" onClick={() => exec("createLink", "https://lumen.so")}>
              <LinkSimple />
            </ToolBtn>
            <Sep />
            <ToolBtn label="Add heading" onClick={() => insert("h2")}>
              <TextHTwo />
            </ToolBtn>
            <ToolBtn label="Add paragraph" onClick={() => insert("p")}>
              <TextT />
            </ToolBtn>
            <ToolBtn label="Add table" onClick={() => insert("table")}>
              <TableIcon />
            </ToolBtn>
            <ToolBtn label="Add FAQ" onClick={() => insert("faq")}>
              <Question />
            </ToolBtn>
            <ToolBtn label="Add sources" onClick={() => insert("sources")}>
              <ListNumbers />
            </ToolBtn>
            <span className="flex-1" />
            <span className="shrink-0 whitespace-nowrap t-caption text-ink-3">
              <span className="t-num-sm text-ink-2">{words.toLocaleString()}</span> words · <span className="t-num-sm text-ink-2">{Math.max(1, Math.round(words / 230))}</span> min read
            </span>
          </div>

          <div ref={docRef} onInput={touch} className="mx-auto flex max-w-[760px] flex-col gap-4 px-5 pb-24 pt-8 md:px-14">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={item.type} />
              <span className="inline-flex h-5 items-center gap-1 rounded bg-subtle px-1.5 t-micro text-ink-2">
                Target · {item.target}
              </span>
              <span className="flex-1" />
              <span className="inline-flex items-center gap-1.5 t-caption text-ink-3">
                <Avatar name={item.owner} size={18} />
                {item.owner}
              </span>
            </div>
            <h1
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              onInput={(e) => setTitle(e.currentTarget.textContent ?? "")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const first = blocks[0];
                  if (first) setFocusId(first.id);
                }
              }}
              className="rounded-md text-[28px] font-semibold leading-[1.2] tracking-[-0.03em] text-ink outline-none empty:before:text-ink-3 empty:before:content-['Untitled'] focus-visible:shadow-none"
            >
              {item.title}
            </h1>

            {blocks.map((b, i) => (
              <BlockShell
                key={b.id}
                id={b.id}
                first={i === 0}
                last={i === blocks.length - 1}
                onUp={() => move(b.id, -1)}
                onDown={() => move(b.id, 1)}
                onRemove={() => removeBlock(b.id)}
                onInsert={(k) => insert(k, b.id)}
              >
                {b.kind === "h2" && (
                  <h2
                    contentEditable
                    suppressContentEditableWarning
                    onKeyDown={(e) => onTextKey(e, b)}
                    data-placeholder="Heading"
                    className="mt-3 text-[20px] font-semibold leading-[1.3] tracking-[-0.02em] text-ink outline-none empty:before:text-ink-3 empty:before:content-[attr(data-placeholder)] focus-visible:shadow-none"
                  >
                    {b.text}
                  </h2>
                )}
                {b.kind === "p" && (
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onKeyDown={(e) => onTextKey(e, b)}
                    data-placeholder="Write, or press the + to insert a block…"
                    className={cn(
                      "text-[15px] leading-[1.7] text-ink outline-none empty:before:text-ink-3 empty:before:content-[attr(data-placeholder)] focus-visible:shadow-none [&_a]:text-brand [&_a]:underline",
                      i === 0 && "rounded-xl bg-brand-subtle/60 px-4 py-3",
                    )}
                  >
                    {b.text}
                  </p>
                )}
                {b.kind === "table" && (
                  <TableBlock
                    rows={b.rows}
                    onAddRow={() => updateBlock(b.id, (x) => (x.kind === "table" ? { ...x, rows: [...x.rows, x.rows[0].map(() => "")] } : x))}
                  />
                )}
                {b.kind === "faq" && (
                  <FaqBlock
                    items={b.items}
                    schema={schema}
                    onSchema={() => {
                      setSchema((s) => !s);
                      touch();
                    }}
                    onAdd={() => updateBlock(b.id, (x) => (x.kind === "faq" ? { ...x, items: [...x.items, { q: "", a: "" }] } : x))}
                  />
                )}
                {b.kind === "sources" && <SourcesBlock items={b.items} />}
              </BlockShell>
            ))}

            <button
              type="button"
              onClick={() => insert("p")}
              className="mt-2 flex h-10 items-center gap-2 rounded-xl px-3 t-body text-ink-3 shadow-[inset_0_0_0_1px_var(--border-default)] transition-colors hover:bg-canvas hover:text-ink-2"
            >
              <Plus className="size-4" />
              Add a block
            </button>
          </div>
        </div>

        {/* AEO panel ----------------------------------------------------------- */}
        <aside className="flex min-w-0 flex-col gap-4 border-t border-line bg-canvas/40 p-4 xl:border-t-0">
          <Card>
            <CardHeader
              icon={<Sparkle weight="fill" />}
              tile="orange"
              title="AEO score"
              meta={
                <span>
                  <span className="t-num-sm text-ink-2">{passed}</span>/5 checks
                </span>
              }
            />
            <CardPanel className="flex flex-col items-center gap-3">
              <div className="relative grid place-items-center">
                <ScoreRing value={score} size={128} stroke={10} />
                <div className="absolute text-center">
                  <div className="t-num-xl text-ink">{score}</div>
                  <div className="t-caption text-ink-3">/ 100</div>
                </div>
              </div>
              <StatusPill tone={verdict.tone}>{verdict.t}</StatusPill>
              <div className="grid w-full grid-cols-3 divide-x divide-line rounded-xl bg-canvas py-2.5 text-center">
                <Stat label="Words" value={words.toLocaleString()} />
                <Stat label="Headings" value={`${blocks.filter((b) => b.kind === "h2").length}`} />
                <Stat label="Sources" value={`${sourcesCount}`} />
              </div>
            </CardPanel>
          </Card>

          <Card>
            <CardHeader title="Checklist" description="What answer engines look for" />
            <CardPanel flush className="px-3">
              {checks.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 border-b border-line py-2.5 last:border-b-0">
                  {fixing === c.id ? (
                    <Spinner className="size-[18px] text-ink-2" />
                  ) : c.ok ? (
                    <CheckCircle weight="fill" className="size-[18px] shrink-0 text-[var(--status-success)]" />
                  ) : (
                    <XCircle weight="fill" className="size-[18px] shrink-0 text-[var(--status-danger)]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className={cn("t-body-medium", c.ok ? "text-ink" : "text-ink")}>{c.label}</div>
                    <div className="truncate t-caption text-ink-3">{c.hint}</div>
                  </div>
                  {c.ok ? (
                    <span className="t-num-sm text-success">+{WEIGHTS[c.id]}</span>
                  ) : (
                    <Button size="xs" variant="outlined" tone="secondary" disabled={fixing !== null || agent} onClick={() => fix(c.id)}>
                      {c.fix}
                    </Button>
                  )}
                </div>
              ))}
            </CardPanel>
            <div className="p-1 pt-2">
              <Button variant="outlined" className="w-full" iconLeft={<Robot weight="duotone" className="size-4" />} loading={agent} onClick={askAgent}>
                {agent ? "Agent is improving your draft…" : "Ask agent to improve"}
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Target prompts" description="Where this page should appear" />
            <CardPanel flush className="px-3">
              {targetPrompts.map((p) => (
                <div key={p.text} className="flex items-start gap-2.5 border-b border-line py-2.5 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="line-clamp-2 t-body text-ink">{p.text}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {p.primary && <Badge tone="inverse">Primary</Badge>}
                      <span className="flex -space-x-1">
                        {p.models.map((m) => (
                          <ModelMark key={m} id={m} size={16} className="rounded-full ring-2 ring-surface" />
                        ))}
                      </span>
                    </div>
                  </div>
                  {p.vis > 0 ? (
                    <span className="t-num-sm-medium text-ink">{p.vis}%</span>
                  ) : (
                    <StatusPill tone="danger" className="shrink-0">
                      Not cited
                    </StatusPill>
                  )}
                </div>
              ))}
            </CardPanel>
          </Card>

          <Card>
            <CardHeader icon={<Trophy weight="fill" />} tile="pink" title="Pages that win today" description="Cited instead of you for the primary prompt" />
            <CardPanel flush className="px-3">
              {winners.map((w) => (
                <a
                  key={w.domain}
                  href={`https://${w.domain}${w.path.replace("…", "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group -mx-3 flex items-center gap-2.5 border-b border-line px-3 py-2.5 transition-colors last:border-b-0 hover:bg-canvas"
                >
                  <DomainMark domain={w.domain} size={20} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate t-body-medium text-ink">{w.title}</div>
                    <div className="truncate font-mono text-[11.5px] text-ink-3">
                      {w.domain}
                      {w.path}
                    </div>
                  </div>
                  <span className="shrink-0 text-right">
                    <span className="block t-num-sm-medium text-ink">{w.cited}/8</span>
                    <span className="block t-micro text-ink-3">answers</span>
                  </span>
                  <ArrowSquareOut className="size-3.5 shrink-0 text-icon-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
              ))}
            </CardPanel>
          </Card>

          <Button variant="link" tone="secondary" size="xs" className="self-start" onClick={() => nav("/content")}>
            ← Back to all content
          </Button>
        </aside>
      </div>
    </>
  );
}

/* Editor pieces ------------------------------------------------------------------- */

function ToolBtn({ label, onClick, children, active }: { label: string; onClick: () => void; children: ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-grid size-7 shrink-0 place-items-center rounded-md transition-colors [&_svg]:size-4",
        active ? "bg-subtle text-ink" : "text-icon hover:bg-subtle hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-1 h-4 w-px shrink-0 bg-line" />;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="t-num text-ink">{value}</div>
      <div className="t-caption text-ink-3">{label}</div>
    </div>
  );
}

function BlockShell({
  id,
  first,
  last,
  children,
  onUp,
  onDown,
  onRemove,
  onInsert,
}: {
  id: string;
  first: boolean;
  last: boolean;
  children: ReactNode;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  onInsert: (k: Block["kind"]) => void;
}) {
  return (
    <div data-block={id} className="group/block relative">
      <div className="absolute -left-11 top-0.5 hidden items-center gap-0.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover/block:opacity-100 md:flex">
        <Popover
          trigger={({ toggle }) => (
            <IconButton label="Insert block below" size="xs" variant="link" onMouseDown={(e) => e.preventDefault()} onClick={toggle} className="!size-5">
              <Plus className="size-3.5" />
            </IconButton>
          )}
        >
          {(close) =>
            (
              [
                ["h2", "Heading", <TextHTwo key="h" />],
                ["p", "Paragraph", <TextT key="p" />],
                ["table", "Comparison table", <TableIcon key="t" />],
                ["faq", "FAQ", <Question key="f" />],
                ["sources", "Sources", <ListNumbers key="s" />],
              ] as [Block["kind"], string, JSX.Element][]
            ).map(([k, l, ic]) => (
              <MenuItem
                key={k}
                icon={ic}
                onClick={() => {
                  onInsert(k);
                  close();
                }}
              >
                {l}
              </MenuItem>
            ))
          }
        </Popover>
        <span className="flex flex-col">
          <button type="button" aria-label="Move up" disabled={first} onClick={onUp} className="grid h-2.5 w-4 place-items-center text-icon-muted hover:text-ink disabled:opacity-30">
            <ArrowUp className="size-2.5" />
          </button>
          <button type="button" aria-label="Move down" disabled={last} onClick={onDown} className="grid h-2.5 w-4 place-items-center text-icon-muted hover:text-ink disabled:opacity-30">
            <ArrowDown className="size-2.5" />
          </button>
        </span>
      </div>
      <div className="absolute -right-9 top-0.5 hidden opacity-0 transition-opacity duration-150 group-hover/block:opacity-100 md:block">
        <IconButton label="Delete block" size="xs" variant="link" tone="danger" onClick={onRemove} className="!size-6">
          <Trash className="size-3.5" />
        </IconButton>
      </div>
      {children}
    </div>
  );
}

function TableBlock({ rows, onAddRow }: { rows: string[][]; onAddRow: () => void }) {
  return (
    <div className="my-1 overflow-hidden rounded-xl bg-surface shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              {rows[0].map((h, i) => (
                <th key={i} className="h-9 border-b border-line bg-canvas px-3 t-caption-medium text-ink-2">
                  <span contentEditable suppressContentEditableWarning className="block outline-none focus-visible:shadow-none">
                    {h}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((r, ri) => (
              <tr key={ri} className="[&>td]:border-b [&>td]:border-line last:[&>td]:border-b-0">
                {r.map((c, ci) => (
                  <td key={ci} className={cn("px-3 py-2.5 align-top text-[14px] leading-[1.5]", ci === 0 ? "font-medium text-ink" : "text-ink-2")}>
                    <span contentEditable suppressContentEditableWarning data-placeholder="—" className="block min-h-5 outline-none empty:before:text-ink-3 empty:before:content-[attr(data-placeholder)] focus-visible:shadow-none">
                      {c}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={onAddRow} className="flex w-full items-center gap-1.5 border-t border-line px-3 py-2 t-caption-medium text-ink-3 transition-colors hover:bg-canvas hover:text-ink">
        <Plus className="size-3.5" />
        Add row
      </button>
    </div>
  );
}

function FaqBlock({ items, schema, onSchema, onAdd }: { items: { q: string; a: string }[]; schema: boolean; onSchema: () => void; onAdd: () => void }) {
  return (
    <div className="my-1 rounded-xl bg-canvas p-1 shadow-card">
      <div className="flex items-center gap-2 px-3 py-2">
        <Question weight="fill" className="size-4 text-icon" />
        <span className="flex-1 t-label text-ink">Frequently asked questions</span>
        <button
          type="button"
          onClick={onSchema}
          className={cn(
            "inline-flex h-6 items-center gap-1 rounded-md px-1.5 t-caption-medium transition-colors",
            schema ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger hover:opacity-80",
          )}
        >
          {schema ? <CheckCircle weight="fill" className="size-3.5" /> : <XCircle weight="fill" className="size-3.5" />}
          FAQPage schema
        </button>
      </div>
      <div className="flex flex-col rounded-[10px] bg-surface shadow-card">
        {items.map((it, i) => (
          <div key={i} className="border-b border-line px-4 py-3 last:border-b-0">
            <div contentEditable suppressContentEditableWarning data-placeholder="Question" className="t-body-medium text-ink outline-none empty:before:text-ink-3 empty:before:content-[attr(data-placeholder)] focus-visible:shadow-none">
              {it.q}
            </div>
            <div
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Answer in under 60 words"
              className="mt-1 text-[14px] leading-[1.6] text-ink-2 outline-none empty:before:text-ink-3 empty:before:content-[attr(data-placeholder)] focus-visible:shadow-none"
            >
              {it.a}
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={onAdd} className="flex items-center gap-1.5 px-3 py-2 t-caption-medium text-ink-3 transition-colors hover:text-ink">
        <Plus className="size-3.5" />
        Add question
      </button>
    </div>
  );
}

function SourcesBlock({ items }: { items: { title: string; url: string }[] }) {
  return (
    <div className="mt-2 border-t border-line pt-4">
      <div className="mb-2 t-caption-medium uppercase tracking-[0.04em] text-ink-3">Sources</div>
      <ol className="flex flex-col gap-1.5">
        {items.map((s, i) => (
          <li key={i} className="flex items-baseline gap-2 text-[14px]">
            <span className="t-num-sm text-ink-3">{i + 1}.</span>
            <span contentEditable suppressContentEditableWarning className="text-ink outline-none focus-visible:shadow-none">
              {s.title}
            </span>
            <span className="truncate font-mono text-[12px] text-brand">{s.url}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
