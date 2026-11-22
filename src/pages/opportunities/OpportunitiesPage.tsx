import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ArrowsClockwise,
  Article,
  ChatText,
  CheckCircle,
  CircleDashed,
  DotsThree,
  Kanban,
  Lightning,
  ListBullets,
  PencilSimple,
  Play,
  Quotes,
  Robot,
  Smiley,
  Sparkle,
  Target,
  TrendUp,
  Wrench,
  X,
} from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardPanel,
  CountChip,
  EmptyState,
  GroupRow,
  IconButton,
  KpiCard,
  MenuDivider,
  MenuItem,
  ModelMark,
  MODELS,
  Popover,
  Segmented,
  Select,
  StatusDot,
  Table,
  Td,
  Th,
  THead,
  Tile,
  Tr,
  useToast,
  type BadgeTone,
  type TileColor,
} from "@/components/ui";
import { SplitBar } from "@/components/charts";
import { PageHeader, PageSection } from "@/components/shell/PageHeader";
import { opportunities as seed } from "@/data/mock";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/* Model                                                                       */
/* -------------------------------------------------------------------------- */

type Opp = (typeof seed)[number] extends infer O ? Omit<O, "status"> & { status: Status } : never;
type Status = "open" | "in_progress" | "done";
type Level = "High" | "Medium" | "Low";

const STATUSES: { id: Status; label: string; tone: "neutral" | "warning" | "success"; icon: ReactNode }[] = [
  { id: "open", label: "Open", tone: "neutral", icon: <CircleDashed className="size-4" /> },
  { id: "in_progress", label: "In progress", tone: "warning", icon: <Play weight="fill" className="size-3.5" /> },
  { id: "done", label: "Done", tone: "success", icon: <CheckCircle weight="fill" className="size-4" /> },
];

const typeMeta: Record<string, { icon: ReactNode; tile: TileColor; color: string }> = {
  "Content gap": { icon: <Article weight="fill" />, tile: "blue", color: "var(--blue-500)" },
  Citation: { icon: <Quotes weight="fill" />, tile: "purple", color: "var(--purple-500)" },
  Technical: { icon: <Wrench weight="fill" />, tile: "orange", color: "var(--orange-500)" },
  Sentiment: { icon: <Smiley weight="fill" />, tile: "pink", color: "var(--pink-600)" },
  "Content refresh": { icon: <ArrowsClockwise weight="fill" />, tile: "green", color: "var(--green-500)" },
};
const TYPES = Object.keys(typeMeta);

const levelTone: Record<Level, BadgeTone> = { High: "red", Medium: "orange", Low: "neutral" };
const effortTone: Record<Level, BadgeTone> = { Low: "green", Medium: "orange", High: "red" };

const liftOf = (o: Opp) => parseFloat(o.lift.replace(/[^\d.]/g, "")) || 0;

const scanPool: Omit<Opp, "id" | "status">[] = [
  {
    title: "Add an FAQ block to /docs/retention",
    type: "Technical",
    impact: "Medium",
    effort: "Low",
    prompts: 3,
    lift: "+1.2 pts",
    model: "aio",
    detail: "AI Overviews quote competitor FAQs for retention questions. Extractable Q&A markup on your docs would compete directly.",
  },
  {
    title: "Pitch Lumen to the G2 'Top analytics' editorial",
    type: "Citation",
    impact: "High",
    effort: "Medium",
    prompts: 7,
    lift: "+2.6 pts",
    model: "chatgpt",
    detail: "g2.com is cited in 49% of answers for your topics. The editorial roundup lists Orbit and Tidal but not Lumen.",
  },
];

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function OpportunitiesPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState<Opp[]>(() => seed.map((o) => ({ ...o, status: o.status as Status })));
  const [type, setType] = useState("all");
  const [impact, setImpact] = useState<"all" | Level>("all");
  const [view, setView] = useState<"board" | "list">("board");
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(0);

  const filtered = useMemo(() => items.filter((o) => (type === "all" || o.type === type) && (impact === "all" || o.impact === impact)), [items, type, impact]);
  const by = (s: Status, list = items) => list.filter((o) => o.status === s);
  const openLift = by("open").reduce((a, o) => a + liftOf(o), 0);
  const doneLift = by("done").reduce((a, o) => a + liftOf(o), 0);

  const snapshot = () => {
    const prev = items;
    return () => setItems(prev);
  };

  const move = (o: Opp, status: Status) => {
    const undo = snapshot();
    setItems((s) => s.map((x) => (x.id === o.id ? { ...x, status } : x)));
    const msgs: Record<Status, string> = {
      done: "Marked as done",
      in_progress: "Moved to In progress",
      open: "Reopened",
    };
    toast({
      title: msgs[status],
      description: status === "done" ? `${o.lift} expected once engines re-crawl · we'll re-check in 7 days.` : o.title,
      action: { label: "Undo", onClick: undo },
    });
  };

  const dismiss = (o: Opp) => {
    const undo = snapshot();
    setItems((s) => s.filter((x) => x.id !== o.id));
    toast({ tone: "info", title: "Opportunity dismissed", description: "We won't suggest it again for these prompts.", action: { label: "Undo", onClick: undo } });
  };

  const scan = () => {
    setScanning(true);
    window.setTimeout(() => {
      setScanning(false);
      const next = scanPool[scanned];
      if (next) {
        setItems((s) => [{ ...next, id: `o-new-${scanned}`, status: "open" }, ...s]);
        setScanned((n) => n + 1);
        toast({ title: "1 new opportunity found", description: next.title });
      } else {
        toast({ tone: "info", title: "No new opportunities", description: "Scanned 22 prompts across 6 engines." });
      }
    }, 1000);
  };

  const actions = {
    onCreate: () => nav("/content/c1"),
    onAgent: () => nav("/agent"),
    onMove: move,
    onDismiss: dismiss,
  };

  return (
    <>
      <PageHeader
        title="Opportunities"
        actions={
          <>
            <Button variant="outlined" tone="secondary" loading={scanning} iconLeft={!scanning ? <ArrowClockwise className="size-4" /> : undefined} onClick={scan}>
              {scanning ? "Scanning…" : "Rescan"}
            </Button>
            <Button iconLeft={<Robot weight="fill" className="size-4" />} onClick={() => nav("/agent")}>
              Ask agent
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <PageSection className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Open" icon={<Target weight="fill" />} tile="blue" prior={`${by("open").filter((o) => o.impact === "High").length} high impact`} value={`${by("open").length}`} unit="opportunities" />
          <KpiCard
            label="Est. visibility lift"
            icon={<TrendUp weight="fill" />}
            tile="green"
            prior="if all open ship"
            value={`+${openLift.toFixed(1)}`}
            unit="pts"
            delta={{ value: `→ ${(41.8 + openLift).toFixed(1)}%`, direction: "up" }}
          />
          <KpiCard label="In progress" icon={<Lightning weight="fill" />} tile="orange" prior="assigned" value={`${by("in_progress").length}`} unit="underway" />
          <KpiCard label="Done" icon={<CheckCircle weight="fill" />} tile="pink" prior="last 30 days" value={`${by("done").length}`} unit={`+${doneLift.toFixed(1)} pts won`} />
        </div>
        <div className="flex flex-col gap-2 rounded-xl bg-canvas p-3 shadow-card sm:flex-row sm:items-center sm:gap-4">
          <span className="shrink-0 t-caption-medium text-ink">Open lift by type</span>
          <SplitBar
            className="flex-1"
            parts={TYPES.map((t) => ({ value: by("open").filter((o) => o.type === t).reduce((a, o) => a + liftOf(o), 0), color: typeMeta[t].color, label: t })).filter((p) => p.value > 0)}
          />
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {TYPES.map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 t-caption text-ink-2">
                <span className="size-2 rounded-[2px]" style={{ background: typeMeta[t].color }} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </PageSection>

      {/* Filters + board */}
      <PageSection className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="-mx-1 max-w-full overflow-x-auto px-1 py-0.5 [scrollbar-width:none]">
            <Segmented
              value={type}
              onChange={setType}
              options={[
                { value: "all", label: "All", count: items.length },
                ...TYPES.map((t) => ({ value: t, label: t, count: items.filter((o) => o.type === t).length })),
              ]}
            />
          </div>
          <div className="flex-1" />
          <Select<"all" | Level>
            label="Impact"
            value={impact}
            onChange={setImpact}
            icon={<Lightning />}
            align="end"
            options={[
              { value: "all", label: "Any impact" },
              { value: "High", label: "High impact" },
              { value: "Medium", label: "Medium impact" },
              { value: "Low", label: "Low impact" },
            ]}
          />
          <Segmented<"board" | "list">
            value={view}
            onChange={setView}
            options={[
              { value: "board", label: <span className="sr-only sm:not-sr-only">Board</span>, icon: <Kanban /> },
              { value: "list", label: <span className="sr-only sm:not-sr-only">List</span>, icon: <ListBullets /> },
            ]}
          />
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardPanel>
              <EmptyState
                icon={<Sparkle weight="duotone" />}
                title="No opportunities match"
                description="Try another type or impact level."
                action={
                  <Button
                    variant="outlined"
                    tone="secondary"
                    onClick={() => {
                      setType("all");
                      setImpact("all");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            </CardPanel>
          </Card>
        ) : view === "board" ? (
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
            {STATUSES.map((s) => {
              const col = by(s.id, filtered);
              const lift = col.reduce((a, o) => a + liftOf(o), 0);
              return (
                <Card key={s.id}>
                  <CardHeader
                    icon={<span className={cn(s.id === "done" ? "text-success" : s.id === "in_progress" ? "text-warning" : "text-icon-muted")}>{s.icon}</span>}
                    title={
                      <>
                        {s.label} <CountChip>{col.length}</CountChip>
                      </>
                    }
                    meta={lift > 0 ? <span className="t-num-sm text-success">+{lift.toFixed(1)} pts</span> : undefined}
                  />
                  <div className="flex flex-col gap-1">
                    {col.length === 0 ? (
                      <div className="grid h-28 place-items-center rounded-xl border border-dashed border-line-strong t-caption text-ink-3">
                        {s.id === "done" ? "Nothing shipped yet" : s.id === "in_progress" ? "Start an opportunity to see it here" : "All clear"}
                      </div>
                    ) : (
                      col.map((o) => <OppCard key={o.id} opp={o} {...actions} />)
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardPanel flush className="p-2">
              <Table className="min-w-[880px]">
                <THead>
                  <tr>
                    <Th>Opportunity</Th>
                    <Th>Impact</Th>
                    <Th>Effort</Th>
                    <Th align="right">Prompts</Th>
                    <Th>Model</Th>
                    <Th align="right">Est. lift</Th>
                    <Th align="right">
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </THead>
                <tbody>
                  {STATUSES.map((s) => {
                    const col = by(s.id, filtered);
                    if (!col.length) return null;
                    return [
                      <GroupRow key={`g-${s.id}`} colSpan={7}>
                        <span className="inline-flex items-center gap-2">
                          <StatusDot tone={s.tone} />
                          {s.label}
                          <span className="t-num-sm text-ink-3">{col.length}</span>
                        </span>
                      </GroupRow>,
                      ...col.map((o) => (
                        <Tr key={o.id} className={cn(o.status === "done" && "[&>td]:text-ink-2")}>
                          <Td className="max-w-[420px] py-2.5">
                            <div className="flex items-center gap-2.5">
                              <Tile color={typeMeta[o.type]?.tile ?? "ink"} size="lg">
                                {typeMeta[o.type]?.icon}
                              </Tile>
                              <div className="min-w-0">
                                <div className={cn("truncate t-body-medium", o.status === "done" && "text-ink-2 line-through decoration-line-strong")}>{o.title}</div>
                                <div className="truncate t-caption text-ink-3">{o.type}</div>
                              </div>
                            </div>
                          </Td>
                          <Td>
                            <Badge tone={levelTone[o.impact as Level]}>{o.impact}</Badge>
                          </Td>
                          <Td>
                            <Badge tone={effortTone[o.effort as Level]}>{o.effort}</Badge>
                          </Td>
                          <Td align="right" className="t-num">
                            {o.prompts}
                          </Td>
                          <Td>
                            <span className="inline-flex items-center gap-1.5 t-caption text-ink-2">
                              <ModelMark id={o.model} size={18} className="rounded-full" />
                              {MODELS[o.model].name}
                            </span>
                          </Td>
                          <Td align="right" className="t-num text-success">
                            {o.lift}
                          </Td>
                          <Td align="right">
                            <span className="inline-flex items-center gap-1">
                              {o.status === "done" ? (
                                <Button size="xs" variant="link" tone="secondary" iconLeft={<ArrowCounterClockwise className="size-3.5" />} onClick={() => move(o, "open")}>
                                  Reopen
                                </Button>
                              ) : (
                                <>
                                  <IconButton label="Create content" size="xs" variant="link" onClick={actions.onCreate}>
                                    <PencilSimple className="size-3.5" />
                                  </IconButton>
                                  <IconButton label="Ask agent" size="xs" variant="link" onClick={actions.onAgent}>
                                    <Robot className="size-3.5" />
                                  </IconButton>
                                  <IconButton label="Mark done" size="xs" variant="link" onClick={() => move(o, "done")}>
                                    <CheckCircle className="size-3.5" />
                                  </IconButton>
                                  <IconButton label="Dismiss" size="xs" variant="link" onClick={() => dismiss(o)}>
                                    <X className="size-3.5" />
                                  </IconButton>
                                </>
                              )}
                            </span>
                          </Td>
                        </Tr>
                      )),
                    ];
                  })}
                </tbody>
              </Table>
            </CardPanel>
          </Card>
        )}
      </PageSection>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Card                                                                        */
/* -------------------------------------------------------------------------- */

function OppCard({
  opp: o,
  onCreate,
  onAgent,
  onMove,
  onDismiss,
}: {
  opp: Opp;
  onCreate: () => void;
  onAgent: () => void;
  onMove: (o: Opp, s: Status) => void;
  onDismiss: (o: Opp) => void;
}) {
  const meta = typeMeta[o.type] ?? { icon: <Sparkle weight="fill" />, tile: "ink" as TileColor };
  const done = o.status === "done";
  return (
    <article className="group flex flex-col gap-3 rounded-xl bg-surface p-3.5 shadow-card transition-shadow animate-[sy-pop-in_200ms_var(--ease-out)] hover:shadow-control">
      <div className="flex items-center gap-2">
        <Tile color={meta.tile} size="md">
          {meta.icon}
        </Tile>
        <span className="t-caption-medium text-ink-2">{o.type}</span>
        <span className="flex-1" />
        <span title={`Biggest effect on ${MODELS[o.model].name}`}>
          <ModelMark id={o.model} size={20} className="rounded-full" />
        </span>
        <Popover
          align="end"
          trigger={({ open, toggle }) => (
            <IconButton label="More actions" size="xs" variant="link" onClick={toggle} className={cn(open && "bg-subtle text-ink")}>
              <DotsThree weight="bold" className="size-4" />
            </IconButton>
          )}
        >
          {(close) => {
            const act = (fn: () => void) => () => {
              fn();
              close();
            };
            return (
              <div className="w-48">
                {o.status !== "in_progress" && !done && (
                  <MenuItem icon={<Play />} onClick={act(() => onMove(o, "in_progress"))}>
                    Start working
                  </MenuItem>
                )}
                {o.status !== "open" && (
                  <MenuItem icon={<ArrowCounterClockwise />} onClick={act(() => onMove(o, "open"))}>
                    Move to Open
                  </MenuItem>
                )}
                {!done && (
                  <MenuItem icon={<CheckCircle />} onClick={act(() => onMove(o, "done"))}>
                    Mark done
                  </MenuItem>
                )}
                <MenuDivider />
                <MenuItem icon={<X />} danger onClick={act(() => onDismiss(o))}>
                  Dismiss
                </MenuItem>
              </div>
            );
          }}
        </Popover>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className={cn("t-body-medium text-ink [text-wrap:pretty]", done && "text-ink-2 line-through decoration-line-strong")}>{o.title}</h3>
        <p className="line-clamp-3 t-caption text-ink-2">{o.detail}</p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={levelTone[o.impact as Level]}>
          <Lightning weight="fill" className="size-2.5" />
          {o.impact} impact
        </Badge>
        <Badge tone={effortTone[o.effort as Level]}>{o.effort} effort</Badge>
        <span className="flex-1" />
        <span className="inline-flex items-center gap-1 t-caption text-ink-2">
          <ChatText className="size-3.5 text-icon-muted" />
          <span className="t-num-sm">{o.prompts}</span> prompts
        </span>
      </div>

      <div className="flex items-center gap-2 border-t border-line pt-3">
        <span className="flex flex-col">
          <span className="t-micro text-ink-3">Est. lift</span>
          <span className={cn("t-num", done ? "text-ink-2" : "text-success")}>{o.lift}</span>
        </span>
        <span className="flex-1" />
        {done ? (
          <>
            <span className="inline-flex items-center gap-1 t-caption-medium text-success">
              <CheckCircle weight="fill" className="size-3.5" />
              Shipped
            </span>
            <Button size="xs" variant="link" tone="secondary" onClick={() => onMove(o, "open")}>
              Reopen
            </Button>
          </>
        ) : (
          <>
            <IconButton label="Ask agent" size="xs" onClick={onAgent}>
              <Robot className="size-3.5" />
            </IconButton>
            <IconButton label="Mark done" size="xs" onClick={() => onMove(o, "done")}>
              <CheckCircle className="size-3.5" />
            </IconButton>
            <Button size="xs" variant="outlined" iconLeft={<PencilSimple className="size-3.5" />} onClick={onCreate}>
              Create content
            </Button>
          </>
        )}
      </div>
    </article>
  );
}
