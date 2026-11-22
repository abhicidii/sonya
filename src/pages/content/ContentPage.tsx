import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle,
  Copy,
  Exam,
  FileText,
  Kanban,
  MagnifyingGlass,
  Plus,
  Quotes,
  Sparkle,
  Target,
  Trash,
} from "@phosphor-icons/react";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  CardPanel,
  CountChip,
  Dialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  KpiCard,
  LevelBars,
  ScoreRing,
  SearchInput,
  Segmented,
  Select,
  StatusPill,
  Table,
  Td,
  Th,
  THead,
  Tile,
  Tr,
  useToast,
} from "@/components/ui";
import { PageHeader, PageSection } from "@/components/shell/PageHeader";
import { contentItems, prompts, team } from "@/data/mock";
import { cn, fmt } from "@/lib/cn";
import { ContentStatusPill, contentStatuses, contentTypes, TypeBadge, type ContentItem, type ContentStatus } from "./contentShared";

type Row = Omit<ContentItem, "status"> & { status: ContentStatus };
type Filter = "all" | ContentStatus;
type SortKey = "score" | "words";

const suggestions = prompts.filter((p) => p.status === "suggested" || p.visibility === 0).slice(0, 3);

export default function ContentPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(contentItems);
  const [filter, setFilter] = useState<Filter>("all");
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; prompt?: string; type?: string }>({ open: false });

  const count = (s: Filter) => (s === "all" ? rows.length : rows.filter((r) => r.status === s).length);
  const scored = rows.filter((r) => r.score > 0);
  const avgScore = Math.round(scored.reduce((a, r) => a + r.score, 0) / Math.max(1, scored.length));
  const pipeline = rows.filter((r) => r.status !== "Published").length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter(
      (r) =>
        (filter === "all" || r.status === filter) &&
        (type === "all" || r.type === type) &&
        (!q || r.title.toLowerCase().includes(q) || r.target.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q)),
    );
    if (!sort) return list;
    const m = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => (a[sort.key] - b[sort.key]) * m);
  }, [rows, filter, type, query, sort]);

  const toggleSort = (key: SortKey) => setSort((s) => (s?.key === key ? (s.dir === "desc" ? { key, dir: "asc" } : null) : { key, dir: "desc" }));
  const sortOf = (key: SortKey) => (sort?.key === key ? sort.dir : null);

  const duplicate = (r: Row) => {
    const copy: Row = { ...r, id: `${r.id}-copy-${Date.now()}`, title: `${r.title} (copy)`, status: "Draft", updated: "Just now", owner: "Maya Chen" };
    setRows((rs) => {
      const i = rs.findIndex((x) => x.id === r.id);
      return [...rs.slice(0, i + 1), copy, ...rs.slice(i + 1)];
    });
    toast({ title: "Draft duplicated", description: copy.title });
  };
  const remove = (r: Row) => {
    const snapshot = rows;
    setRows((rs) => rs.filter((x) => x.id !== r.id));
    toast({ title: "Moved to trash", description: r.title, tone: "warning", action: { label: "Undo", onClick: () => setRows(snapshot) } });
  };
  const setStatus = (r: Row, s: ContentStatus) => {
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status: s, updated: "Just now" } : x)));
    toast({ title: `Status set to ${s}`, description: r.title });
  };

  return (
    <>
      <PageHeader
        title="Content"
        actions={
          <>
            <Button variant="outlined" tone="secondary" iconLeft={<Kanban className="size-4" />} onClick={() => nav("/opportunities")}>
              Opportunities
            </Button>
            <Button iconLeft={<Plus weight="bold" className="size-4" />} onClick={() => setDialog({ open: true })}>
              New content
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <PageSection className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="success">Citations synced Nov 6 · 06:30 UTC</StatusPill>
          <span className="t-caption text-ink-3">Tracking 52 published pages on lumen.so</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Published pages cited" icon={<Quotes weight="fill" />} tile="blue" prior="vs 32" value="38" unit="of 52 pages" delta={{ value: "+6", direction: "up" }} />
          <KpiCard label="Avg. AEO score" icon={<Sparkle weight="fill" />} tile="orange" prior="vs 74" value={`${avgScore}`} unit="/ 100" delta={{ value: `+${avgScore - 74}`, direction: "up" }} />
          <KpiCard label="Citations from content" icon={<Target weight="fill" />} tile="green" prior="vs 659" value={fmt.int(751)} unit="last 30 days" delta={{ value: "+14.0%", direction: "up" }} />
          <KpiCard label="In pipeline" icon={<Kanban weight="fill" />} tile="pink" prior="2 due this week" value={`${pipeline}`} unit="briefs & drafts" />
        </div>
      </PageSection>

      {/* Suggested briefs */}
      <PageSection className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="t-heading text-ink">Suggested briefs</h2>
          <span className="t-caption text-ink-3">Prompts where no page of yours is cited yet</span>
          <span className="flex-1" />
          <Button size="xs" variant="link" tone="secondary" iconRight={<ArrowRight className="size-3.5" />} onClick={() => nav("/prompts")}>
            All prompts
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {suggestions.map((p) => (
            <Card key={p.id}>
              <CardHeader
                title={<span className="t-caption-medium text-ink-2">{p.topic}</span>}
                meta={
                  <span className="inline-flex items-center gap-1.5">
                    Volume <LevelBars level={p.volume} tone="blue" />
                  </span>
                }
                className="min-h-0 py-2"
              />
              <CardPanel className="flex flex-1 flex-col gap-3">
                <p className="t-body-medium text-ink">“{p.text}”</p>
                <div className="mt-auto flex items-center gap-2">
                  <StatusPill tone="danger">Not cited</StatusPill>
                  <span className="t-caption text-ink-3">{p.intent}</span>
                  <span className="flex-1" />
                  <Button
                    size="xs"
                    variant="outlined"
                    tone="secondary"
                    iconLeft={<Sparkle className="size-3.5" />}
                    onClick={() => setDialog({ open: true, prompt: p.text, type: p.intent === "Comparison" ? "Comparison" : "Guide" })}
                  >
                    Create brief
                  </Button>
                </div>
              </CardPanel>
            </Card>
          ))}
        </div>
      </PageSection>

      {/* Library */}
      <PageSection>
        <Card>
          <CardHeader
            icon={<FileText weight="fill" />}
            tile="ink"
            title={
              <>
                All content <CountChip>{rows.length}</CountChip>
              </>
            }
            description="Briefs, drafts and published pages scored for AI answers"
          />
          <CardPanel flush className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
              <Segmented
                size="xs"
                value={filter}
                onChange={setFilter}
                className="max-w-full overflow-x-auto"
                options={[{ value: "all" as Filter, label: "All", count: count("all") }, ...contentStatuses.map((s) => ({ value: s as Filter, label: s, count: count(s) }))]}
              />
              <span className="flex-1" />
              <Select
                size="sm"
                value={type}
                onChange={setType}
                align="end"
                label="Content type"
                options={[{ value: "all", label: "All types" }, ...contentTypes.map((t) => ({ value: t.id, label: t.label }))]}
              />
              <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search content…" wrapperClassName="w-full sm:w-60" />
            </div>

            {visible.length === 0 ? (
              <EmptyState
                icon={<MagnifyingGlass />}
                title="No content matches"
                description="Try another status or type, or start a new brief from a prompt you want to win."
                action={
                  <>
                    <Button
                      variant="outlined"
                      tone="secondary"
                      onClick={() => {
                        setFilter("all");
                        setType("all");
                        setQuery("");
                      }}
                    >
                      Clear filters
                    </Button>
                  </>
                }
              />
            ) : (
              <div className="p-2">
                <Table className="min-w-[880px]">
                  <THead>
                    <tr>
                      <Th>Title</Th>
                      <Th>Type</Th>
                      <Th>Status</Th>
                      <Th sort={sortOf("score")} onSort={() => toggleSort("score")}>
                        AEO score
                      </Th>
                      <Th align="right" sort={sortOf("words")} onSort={() => toggleSort("words")}>
                        Words
                      </Th>
                      <Th>Owner</Th>
                      <Th>Updated</Th>
                      <Th className="w-[100px]" />
                    </tr>
                  </THead>
                  <tbody>
                    {visible.map((r) => (
                      <Tr key={r.id} interactive onClick={() => nav(`/content/${r.id.split("-copy")[0]}`)}>
                        <Td className="max-w-[360px]">
                          <div className="truncate t-body-medium">{r.title}</div>
                          <div className="flex items-center gap-1 truncate t-caption text-ink-3">
                            <Target className="size-3 shrink-0" />
                            {r.target}
                          </div>
                        </Td>
                        <Td>
                          <TypeBadge type={r.type} />
                        </Td>
                        <Td>
                          <ContentStatusPill status={r.status} />
                        </Td>
                        <Td>
                          {r.score > 0 ? (
                            <span className="inline-flex items-center gap-2">
                              <ScoreRing value={r.score} size={18} stroke={2.5} />
                              <span className="t-num">{r.score}</span>
                            </span>
                          ) : (
                            <span className="t-caption text-ink-3">Not scored</span>
                          )}
                        </Td>
                        <Td align="right" className={cn("t-num", !r.words && "text-ink-3")}>
                          {r.words ? fmt.int(r.words) : "—"}
                        </Td>
                        <Td>
                          <span className="inline-flex items-center gap-2 whitespace-nowrap">
                            <Avatar name={r.owner} size={22} />
                            <span className="t-caption text-ink-2">{r.owner}</span>
                          </span>
                        </Td>
                        <Td className={cn("whitespace-nowrap t-caption", r.updated === "Just now" ? "text-success" : "text-ink-2")}>{r.updated}</Td>
                        <Td className="pl-0" onClick={(e) => e.stopPropagation()}>
                          <span className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                            {r.status !== "Published" && (
                              <IconButton
                                size="xs"
                                variant="link"
                                label={r.status === "In review" ? "Publish" : r.status === "Draft" ? "Send for review" : "Start draft"}
                                onClick={() => setStatus(r, r.status === "In review" ? "Published" : r.status === "Draft" ? "In review" : "Draft")}
                              >
                                <CheckCircle className="size-4" />
                              </IconButton>
                            )}
                            <IconButton size="xs" variant="link" label="Duplicate" onClick={() => duplicate(r)}>
                              <Copy className="size-4" />
                            </IconButton>
                            <IconButton size="xs" variant="link" tone="danger" label="Move to trash" onClick={() => remove(r)}>
                              <Trash className="size-4" />
                            </IconButton>
                          </span>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </CardPanel>
        </Card>
      </PageSection>

      <NewContentDialog
        key={dialog.open ? `${dialog.prompt ?? ""}-${dialog.type ?? ""}` : "closed"}
        open={dialog.open}
        initialPrompt={dialog.prompt}
        initialType={dialog.type}
        onClose={() => setDialog({ open: false })}
      />
    </>
  );
}

/* New content dialog ---------------------------------------------------------- */

const tones = [
  { value: "expert", label: "Expert" },
  { value: "neutral", label: "Neutral" },
  { value: "friendly", label: "Friendly" },
];

const genSteps = ["Expanding prompt into 31 fan-out queries", "Reading 6 competitor pages that win today", "Outlining sections, table and FAQ"];

function NewContentDialog({ open, onClose, initialPrompt, initialType }: { open: boolean; onClose: () => void; initialPrompt?: string; initialType?: string }) {
  const nav = useNavigate();
  const toast = useToast();
  const [prompt, setPrompt] = useState(initialPrompt ?? "");
  const [type, setType] = useState(initialType ?? "Comparison");
  const [tone, setTone] = useState("expert");
  const [owner, setOwner] = useState("Maya Chen");
  const [step, setStep] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const invalid = prompt.trim().length < 3;
  const quick = ["Lumen vs Tidal", "best product analytics for B2B SaaS", "session replay privacy"];

  const generate = () => {
    setTouched(true);
    if (invalid) return;
    setStep(0);
    timers.current = [
      window.setTimeout(() => setStep(1), 500),
      window.setTimeout(() => setStep(2), 1000),
      window.setTimeout(() => {
        onClose();
        nav("/content/c1");
        toast({ title: "Brief generated", description: `${type} · “${prompt.trim()}”` });
      }, 1500),
    ];
  };

  return (
    <Dialog
      open={open}
      onClose={step === null ? onClose : () => {}}
      size="lg"
      title="New content"
      description="Sonya drafts a brief from the prompts and pages answer engines use today."
      footer={
        <>
          <span className="mr-auto hidden t-caption text-ink-3 sm:block">Uses 1 of 40 briefs this month</span>
          <Button variant="outlined" tone="secondary" onClick={onClose} disabled={step !== null}>
            Cancel
          </Button>
          <Button iconLeft={<Sparkle weight="fill" className="size-4" />} loading={step !== null} onClick={generate}>
            {step !== null ? "Generating…" : "Generate brief"}
          </Button>
        </>
      }
    >
      {step !== null ? (
        <div className="flex flex-col gap-3 p-6">
          <div className="flex items-center gap-3">
            <Tile color="ink" size="lg">
              <Exam weight="fill" />
            </Tile>
            <div className="min-w-0">
              <div className="t-heading text-ink">Building your brief</div>
              <div className="truncate t-caption text-ink-2">“{prompt.trim()}”</div>
            </div>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {genSteps.map((s, i) => (
              <div key={s} className={cn("flex items-center gap-2.5 rounded-lg bg-canvas px-3 py-2.5 transition-opacity", i > step && "opacity-40")}>
                {i < step ? (
                  <CheckCircle weight="fill" className="size-4 text-success" />
                ) : i === step ? (
                  <span className="size-4 animate-[sy-spin_0.8s_linear_infinite] rounded-full border-2 border-line border-t-[var(--text-primary)]" />
                ) : (
                  <span className="size-4 rounded-full border-2 border-line" />
                )}
                <span className="t-body text-ink">{s}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5 p-5">
          <Field
            label="Target prompt or keyword"
            error={touched && invalid ? "Add the prompt you want this page to win" : undefined}
            hint="The question people ask ChatGPT, Perplexity or AI Overviews."
          >
            <Input
              size="md"
              autoFocus
              value={prompt}
              invalid={touched && invalid}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              iconLeft={<Target />}
              placeholder="e.g. Lumen vs Tidal for B2B analytics"
            />
          </Field>
          <div className="-mt-3 flex flex-wrap items-center gap-1.5">
            <span className="t-caption text-ink-3">Try</span>
            {quick.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setPrompt(q)}
                className="inline-flex h-6 items-center rounded-md bg-subtle px-2 t-caption-medium text-ink-2 transition-colors hover:bg-hover hover:text-ink"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <span className="t-caption-medium text-ink">Content type</span>
            <div role="radiogroup" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {contentTypes.map((t) => {
                const on = type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setType(t.id)}
                    className={cn(
                      "flex flex-col items-start gap-2.5 rounded-xl bg-surface p-3 text-left transition-[box-shadow,background-color] duration-150",
                      on ? "shadow-[0_0_0_1.5px_var(--text-primary),0_1px_2px_rgb(40_40_40/0.08)]" : "shadow-control hover:bg-canvas",
                    )}
                  >
                    <Tile color={t.tile} size="md">
                      {t.icon}
                    </Tile>
                    <span>
                      <span className="block t-label text-ink">{t.label}</span>
                      <span className="mt-1 block t-caption text-ink-3">{t.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tone of voice">
              <Segmented stretch value={tone} onChange={setTone} options={tones} />
            </Field>
            <Field label="Owner">
              <Select
                value={owner}
                onChange={setOwner}
                options={team.map((m) => ({ value: m.name, label: m.name, icon: <Avatar name={m.name} size={16} /> }))}
              />
            </Field>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-canvas p-3">
            <Sparkle weight="fill" className="mt-0.5 size-4 shrink-0 text-[var(--accent-orange)]" />
            <p className="t-caption text-ink-2">
              Briefs include a direct-answer intro, a {type === "Comparison" ? "comparison table" : "summary table"}, an FAQ block with schema and the sources engines already
              trust for this prompt.
            </p>
          </div>
        </div>
      )}
    </Dialog>
  );
}
