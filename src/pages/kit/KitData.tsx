import { useMemo, useState } from "react";
import {
  ArrowsClockwise,
  ChatCircleDots,
  ChatText,
  Copy,
  DotsThree,
  DownloadSimple,
  Eye,
  Info,
  Medal,
  PencilSimple,
  Plus,
  ShareNetwork,
  Smiley,
  Trash,
} from "@phosphor-icons/react";
import {
  Avatar,
  AvatarStack,
  Badge,
  BrandMark,
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardPanel,
  DeltaText,
  Dialog,
  DivergingMeter,
  DomainMark,
  DotMarker,
  EmptyState,
  Field,
  IconButton,
  Input,
  KpiCard,
  LevelBars,
  MenuDivider,
  MenuItem,
  MenuLabel,
  ModelMark,
  MODELS,
  Popover,
  Progress,
  ScoreRing,
  SentimentScore,
  Skeleton,
  SonyaLogo,
  Spinner,
  Table,
  Td,
  Th,
  THead,
  TickMeter,
  Toggle,
  Tooltip,
  Tr,
  useToast,
  type ModelId,
  type TileColor,
} from "@/components/ui";
import { BarChart, Donut, DotMatrix, HeatCell, Legend, LineChart, Sparkline, SplitBar } from "@/components/charts";
import { brands, days14, locations, models, months, sources, team, traffic } from "@/data/mock";
import { fmt } from "@/lib/cn";
import { Block, Caption, Demo, KitSection, MonoLabel } from "./KitParts";

const brandColor = (b: (typeof brands)[number]) => (b.you ? "var(--data-1)" : b.color === "#141414" ? "#737373" : b.color);

/* ========================================================================== */
/* Data display                                                                */
/* ========================================================================== */

type SortKey = "visibility" | "sov" | "sentiment" | "position";

export function DataSection() {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "visibility", dir: "desc" });
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<string[]>([]);

  const rows = useMemo(() => {
    const r = [...brands].slice(0, 6);
    r.sort((a, b) => (sort.dir === "asc" ? a[sort.key] - b[sort.key] : b[sort.key] - a[sort.key]));
    return r;
  }, [sort]);
  const sortBy = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));
  const sortState = (key: SortKey) => (sort.key === key ? sort.dir : null);

  return (
    <KitSection id="data" title="Data display" description="Cards, tables and meters for dense numbers. All values use Geist Mono; colour is reserved for change and status.">
      <Block title="KpiCard" usage="Label and prior in the shell, value + unit + delta in the panel. Tile colours: blue, orange, green, pink." code='<KpiCard label="Visibility score" icon={<Eye weight="fill" />} tile="blue" value="41.8%" delta={…} />' panelClassName="p-2">
        <div className="grid grid-cols-1 gap-3 rounded-[10px] bg-canvas p-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Visibility score" icon={<Eye weight="fill" />} tile="blue" prior="vs 38.6%" value="41.8%" unit="of answers" delta={{ value: "+3.2 pts", direction: "up" }} />
          <KpiCard label="Share of voice" icon={<ChatCircleDots weight="fill" />} tile="orange" prior="vs 17.1%" value="18.4%" unit="of mentions" delta={{ value: "+1.3 pts", direction: "up" }} />
          <KpiCard label="Avg. position" icon={<Medal weight="fill" />} tile="green" prior="vs #1.9" value="#1.6" unit="when mentioned" delta={{ value: "−0.3", direction: "down", good: true }} />
          <KpiCard label="Sentiment" icon={<Smiley weight="fill" />} tile="pink" prior="vs 74" value="72" unit="/ 100" delta={{ value: "2", direction: "down" }} />
        </div>
      </Block>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,9fr)]">
        <Block title="Card with list rows" usage="Rows divided by border-line; CardFooter carries the total." code='<Card><CardHeader /><CardPanel flush className="px-4">…</CardPanel><CardFooter /></Card>' panelClassName="p-2">
          <Card className="h-full">
            <CardHeader title="Visibility by model" description="Last 7 days" />
            <CardPanel flush className="px-4">
              {models.slice(0, 4).map((m) => (
                <div key={m.id} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
                  <ModelMark id={m.id} size={28} className="rounded-full" />
                  <div className="min-w-0 flex-1">
                    <div className="t-body-medium text-ink">{MODELS[m.id].name}</div>
                    <div className="truncate t-caption text-ink-3">
                      {m.mentions} mentions · #{m.position.toFixed(1)}
                    </div>
                  </div>
                  <span className="t-num-sm-medium text-ink">{fmt.pct(m.visibility)}</span>
                  <DeltaText value={fmt.signed(m.delta)} good={m.delta >= 0} className="w-9 text-right" />
                </div>
              ))}
            </CardPanel>
            <CardFooter>
              <span>Blended</span>
              <span className="t-num text-success">41.8%</span>
            </CardFooter>
          </Card>
        </Block>

        <Block title="Table" usage="Header on bg-canvas, 48px rows, numbers right-aligned. Click a numeric header to sort." code='<Th align="right" sort={dir} onSort={…}>Visibility</Th>' flush panelClassName="p-2">
          <Table>
            <THead>
              <tr>
                <Th>Brand</Th>
                <Th align="right" sort={sortState("visibility")} onSort={() => sortBy("visibility")}>
                  Visibility
                </Th>
                <Th align="right" sort={sortState("sov")} onSort={() => sortBy("sov")}>
                  SOV
                </Th>
                <Th align="right" sort={sortState("sentiment")} onSort={() => sortBy("sentiment")}>
                  Sentiment
                </Th>
                <Th align="right" sort={sortState("position")} onSort={() => sortBy("position")}>
                  Avg. pos.
                </Th>
                <Th className="w-28">Trend</Th>
              </tr>
            </THead>
            <tbody>
              {rows.map((b) => (
                <Tr key={b.id} selected={b.you}>
                  <Td>
                    <span className="flex items-center gap-2">
                      <BrandMark brand={b} size={20} />
                      <span className="t-body-medium">{b.name}</span>
                      {b.you && <Badge tone="inverse">You</Badge>}
                    </span>
                  </Td>
                  <Td align="right">
                    <span className="inline-flex items-center gap-2">
                      <span className="t-num">{fmt.pct(b.visibility)}</span>
                      <DeltaText value={fmt.signed(b.visDelta)} good={b.visDelta >= 0} className="w-9 text-right" />
                    </span>
                  </Td>
                  <Td align="right" className="t-num">
                    {fmt.pct(b.sov)}
                  </Td>
                  <Td align="right">
                    <SentimentScore value={b.sentiment} />
                  </Td>
                  <Td align="right" className="t-num text-ink-2">
                    #{b.position.toFixed(1)}
                  </Td>
                  <Td>
                    <Sparkline values={b.trend} color={brandColor(b)} width={88} height={22} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Block>
      </div>

      <Block title="Meters & scores" usage="TickMeter for share, DivergingMeter for change around zero, ScoreRing for 0–100 health, LevelBars for 1–5 scales." code='<TickMeter value={54} />  <ScoreRing value={92} size={40} showValue />  <LevelBars level={4} />'>
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-3">
            {sources.slice(0, 4).map((s) => (
              <div key={s.domain} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 t-caption">
                  <DomainMark domain={s.domain} size={14} />
                  <span className="flex-1 text-ink-2">{s.domain}</span>
                  <span className="t-num-sm-medium text-ink">{s.used}%</span>
                </div>
                <TickMeter value={s.used} />
              </div>
            ))}
            <Caption>TickMeter</Caption>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { l: "Orbit", v: -4.2 },
              { l: "Tidal", v: 2.1 },
              { l: "Parcel", v: 6.4 },
              { l: "Quanta", v: -1.3 },
            ].map((d) => (
              <div key={d.l} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between t-caption">
                  <span className="text-ink-2">{d.l}</span>
                  <DeltaText value={fmt.signedPct(d.v)} good={d.v <= 0} />
                </div>
                <DivergingMeter value={d.v} max={8} />
              </div>
            ))}
            <Caption>DivergingMeter · lower is better</Caption>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <ScoreRing value={92} size={44} stroke={4} showValue />
              <ScoreRing value={64} size={44} stroke={4} showValue />
              <ScoreRing value={31} size={44} stroke={4} showValue />
              <span className="flex flex-col gap-1.5">
                <ScoreRing value={86} />
                <ScoreRing value={48} />
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {(["ink", "blue", "green", "orange", "red"] as const).map((t, i) => (
                <Progress key={t} tone={t} value={88 - i * 16} />
              ))}
            </div>
            <Caption>ScoreRing · Progress</Caption>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { l: "Volume", lv: 5, t: "green" as const },
              { l: "Difficulty", lv: 4, t: "red" as const },
              { l: "Opportunity", lv: 3, t: "orange" as const },
              { l: "Coverage", lv: 2, t: "blue" as const },
            ].map((r) => (
              <div key={r.l} className="flex items-center justify-between t-caption text-ink-2">
                {r.l}
                <LevelBars level={r.lv} tone={r.t} />
              </div>
            ))}
            <div className="flex items-center justify-between t-caption text-ink-2">
              Sentiment
              <span className="flex gap-3">
                <SentimentScore value={78} />
                <SentimentScore value={52} />
                <SentimentScore value={34} />
              </span>
            </div>
            <Caption>LevelBars · SentimentScore</Caption>
          </div>
        </div>
      </Block>

      <div className="grid gap-4 xl:grid-cols-3">
        <Block title="Avatar · AvatarStack" usage="Initials on a stable colour when there’s no photo. Stack collapses past `max`." code='<AvatarStack names={team} max={3} />'>
          <div className="flex flex-col gap-5">
            <div className="flex items-end gap-3">
              {[40, 32, 24, 20].map((s) => (
                <Avatar key={s} name="Maya Chen" size={s} />
              ))}
            </div>
            <div className="flex items-center gap-4">
              <AvatarStack names={team.map((t) => t.name)} max={3} size={28} />
              <AvatarStack names={team.map((t) => t.name).concat(["Ivy Lane", "Tom Reyes"])} max={4} size={22} />
            </div>
          </div>
        </Block>

        <Block
          title="Skeleton"
          usage="Shimmer placeholders that match the final layout — no spinners for content."
          code='<Skeleton className="h-3 w-40" />'
          actions={<Toggle size="xs" checked={loading} onChange={setLoading} label="Loading" />}
        >
          <div className="flex flex-col gap-3">
            {brands.slice(0, 3).map((b) => (
              <div key={b.id} className="flex h-6 items-center gap-2.5">
                {loading ? (
                  <>
                    <Skeleton className="size-5 rounded-[6px]" />
                    <Skeleton className="h-2.5 w-28" />
                    <span className="flex-1" />
                    <Skeleton className="h-2.5 w-10" />
                  </>
                ) : (
                  <>
                    <BrandMark brand={b} size={20} />
                    <span className="t-body-medium text-ink">{b.name}</span>
                    <span className="flex-1" />
                    <span className="t-num-sm-medium text-ink">{fmt.pct(b.visibility)}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </Block>

        <Block title="EmptyState" usage="Icon, one-line title, what to do next and a single action." code='<EmptyState icon={<ChatText />} title="No prompts yet" action={<Button />} />' flush>
          {prompts.length === 0 ? (
            <EmptyState
              className="py-8"
              icon={<ChatText weight="duotone" />}
              title="No prompts yet"
              description="Add the questions buyers ask AI to start tracking."
              action={
                <Button size="xs" iconLeft={<Plus className="size-3.5" />} onClick={() => setPrompts(["Best product analytics tool for B2B SaaS?", "Lumen vs Orbit for funnels"])}>
                  Add prompts
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col p-4">
              {prompts.map((p) => (
                <div key={p} className="flex items-center gap-2 border-b border-line py-2.5 t-body text-ink last:border-b-0 animate-[sy-pop-in_200ms_var(--ease-out)]">
                  <ChatText className="size-4 text-icon" />
                  <span className="flex-1 truncate">{p}</span>
                </div>
              ))}
              <Button tone="secondary" variant="link" size="xs" className="mt-2 self-start" onClick={() => setPrompts([])}>
                Reset demo
              </Button>
            </div>
          )}
        </Block>
      </div>
    </KitSection>
  );
}

/* ========================================================================== */
/* Feedback                                                                    */
/* ========================================================================== */

export function FeedbackSection() {
  const toast = useToast();
  const [dialog, setDialog] = useState<null | "form" | "danger">(null);
  const [domain, setDomain] = useState("");

  return (
    <KitSection id="feedback" title="Feedback" description="Overlays confirm and inform: dialogs for decisions, toasts for results, tooltips and popovers for detail on demand.">
      <div className="grid gap-4 xl:grid-cols-2">
        <Block title="Dialog" usage="Title, description, body, and a footer with at most one primary. Esc and scrim click close it." code='<Dialog open={open} onClose={…} title="Add competitor" footer={…}>…</Dialog>'>
          <div className="flex flex-wrap gap-2">
            <Button iconLeft={<Plus className="size-4" />} onClick={() => setDialog("form")}>
              Add competitor
            </Button>
            <Button tone="danger" variant="outlined" iconLeft={<Trash className="size-4" />} onClick={() => setDialog("danger")}>
              Delete report
            </Button>
          </div>
        </Block>

        <Block title="Toast" usage="Results of an action, top-right, auto-dismiss after ~4s. Optional single action." code='const toast = useToast(); toast({ tone: "success", title: "Report exported" })'>
          <div className="flex flex-wrap gap-2">
            <Button variant="outlined" onClick={() => toast({ tone: "success", title: "Report exported", description: "visibility-nov-2026.csv is downloading." })}>
              Success
            </Button>
            <Button variant="outlined" onClick={() => toast({ tone: "info", title: "Prompts are running", description: "22 prompts × 6 models — about 2 minutes." })}>
              Info
            </Button>
            <Button variant="outlined" onClick={() => toast({ tone: "warning", title: "Visibility dropped 4 pts", description: "Perplexity stopped citing /pricing." })}>
              Warning
            </Button>
            <Button
              variant="outlined"
              onClick={() =>
                toast({
                  title: "Prompt archived",
                  action: { label: "Undo", onClick: () => toast({ tone: "info", title: "Prompt restored" }) },
                })
              }
            >
              With action
            </Button>
          </div>
        </Block>

        <Block title="Tooltip" usage="Short, non-essential hints on hover or focus. Pair icon buttons with their label." code='<Tooltip content="Export CSV"><IconButton label="Export" /></Tooltip>'>
          <div className="flex flex-wrap items-center gap-3">
            <Tooltip content="Export CSV">
              <IconButton label="Export">
                <DownloadSimple className="size-4" />
              </IconButton>
            </Tooltip>
            <Tooltip content="Share a read-only link">
              <IconButton label="Share">
                <ShareNetwork className="size-4" />
              </IconButton>
            </Tooltip>
            <Tooltip content="Refreshes daily at 06:30 UTC" side="bottom">
              <span className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 t-caption-medium text-ink-2 transition-colors hover:bg-subtle" tabIndex={0}>
                <Info className="size-4" /> Bottom tooltip
              </span>
            </Tooltip>
            <span className="inline-flex items-center gap-2 t-caption text-ink-2">
              <Spinner className="text-icon" /> Spinner
            </span>
          </div>
        </Block>

        <Block title="Popover menu" usage="Anchored menus with labels, icons, shortcuts and a destructive item at the end." code="<Popover trigger={…}>{(close) => <MenuItem onClick={close}>…</MenuItem>}</Popover>">
          <div className="flex flex-wrap items-center gap-3">
            <Popover
              trigger={({ open, toggle }) => (
                <Button tone="secondary" variant="outlined" onClick={toggle} iconRight={<DotsThree weight="bold" className="size-4" />} aria-expanded={open}>
                  Prompt actions
                </Button>
              )}
            >
              {(close) => {
                const pick = (title: string) => () => {
                  close();
                  toast({ title });
                };
                return (
                  <>
                    <MenuLabel>Prompt</MenuLabel>
                    <MenuItem icon={<PencilSimple />} shortcut="E" onClick={pick("Editing prompt")}>
                      Edit
                    </MenuItem>
                    <MenuItem icon={<Copy />} shortcut="⌘D" onClick={pick("Prompt duplicated")}>
                      Duplicate
                    </MenuItem>
                    <MenuItem icon={<ArrowsClockwise />} description="Runs on all 6 models" onClick={pick("Run queued")}>
                      Run now
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem danger icon={<Trash />} onClick={pick("Prompt deleted")}>
                      Delete
                    </MenuItem>
                  </>
                );
              }}
            </Popover>
            <Caption>Click outside or press Esc to close.</Caption>
          </div>
        </Block>
      </div>

      <Dialog
        open={dialog === "form"}
        onClose={() => setDialog(null)}
        title="Add competitor"
        description="We’ll start tracking their visibility on your prompts from the next run."
        footer={
          <>
            <Button tone="secondary" variant="outlined" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              disabled={!/\.[a-z]{2,}$/i.test(domain.trim())}
              onClick={() => {
                setDialog(null);
                toast({ title: "Competitor added", description: `${domain.trim()} will appear after the next run.` });
                setDomain("");
              }}
            >
              Add competitor
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 p-5">
          <Field label="Domain" hint="e.g. orbit.io">
            <Input size="md" autoFocus placeholder="competitor.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={dialog === "danger"}
        onClose={() => setDialog(null)}
        size="sm"
        title="Delete “Weekly visibility”?"
        description="This removes the report and its schedule for everyone in Lumen. This can’t be undone."
        footer={
          <>
            <Button tone="secondary" variant="outlined" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              tone="danger"
              onClick={() => {
                setDialog(null);
                toast({ tone: "warning", title: "Report deleted" });
              }}
            >
              Delete report
            </Button>
          </>
        }
      />
    </KitSection>
  );
}

/* ========================================================================== */
/* Charts                                                                      */
/* ========================================================================== */

const owned = [620, 680, 710, 760, 820, 880, 940, 1010, 1080, 1160, null, null];
const earned = [210, 230, 250, 240, 270, 300, 310, 330, 360, 390, null, null];
const goal = [800, 850, 900, 950, 1000, 1080, 1160, 1240, 1320, 1400, 1480, 1560];
const HEAT_MODELS: ModelId[] = ["chatgpt", "perplexity", "aio", "gemini", "claude"];

export function ChartsSection() {
  const [month, setMonth] = useState(9);
  const trend = brands.slice(0, 4).map((b) => ({ id: b.id, label: b.name, values: b.trend, color: brandColor(b), emphasis: b.you }));
  const barSeries = (["chatgpt", "perplexity", "gemini", "claude"] as ModelId[]).map((m) => ({
    label: MODELS[m].name,
    values: traffic.byModel[m] ?? [],
    color: MODELS[m].color,
  }));

  return (
    <KitSection id="charts" title="Charts" description="Dependency-free SVG charts sized 1:1 to their container. Brand series uses --data-1; competitors use their brand colour.">
      <Block title="DotMatrix" usage="Monthly totals as stacked dots with a dashed goal. Click a column to select it." code='<DotMatrix labels={months} series={[…]} target={goal} selected={i} onSelect={setI} />'>
        <div className="flex flex-col gap-4">
          <Legend
            items={[
              { label: "Owned", color: "var(--data-1)" },
              { label: "Earned", color: "var(--data-2)" },
              { label: "Monthly goal", color: "var(--data-target)", dashed: true },
            ]}
          />
          <DotMatrix
            labels={months}
            series={[
              { values: owned, color: "var(--data-1)", highlight: "var(--data-1-highlight)" },
              { values: earned, color: "var(--data-2)" },
            ]}
            target={goal}
            max={1800}
            rows={12}
            height={170}
            selected={month}
            onSelect={setMonth}
            formatTip={(i) => (
              <div className="t-num-sm-medium">
                {fmt.int((owned[i] ?? 0) + (earned[i] ?? 0))} <span className="opacity-60">/ {fmt.int(goal[i])}</span>
              </div>
            )}
          />
        </div>
      </Block>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,9fr)_minmax(0,5fr)]">
        <Block title="LineChart" usage="Multi-series trend with a hover crosshair. `emphasis` thickens a line and adds an area fill." code='<LineChart labels={days} series={[{ id, label, values, color, emphasis }]} />'>
          <div className="flex flex-col gap-3">
            <Legend items={trend.map((s) => ({ label: s.label, color: s.color }))} />
            <LineChart labels={days14} series={trend} height={220} format={(v) => `${Math.round(v)}%`} />
          </div>
        </Block>
        <Block title="Donut" usage="Share of a whole. Hover a segment to read it in the centre." code='<Donut data={[{ label, value, color }]} center={…} />'>
          <div className="flex flex-col items-center gap-4">
            <Donut
              size={180}
              data={models.map((m) => ({ label: MODELS[m.id].name, value: m.share, color: MODELS[m.id].color }))}
              center={
                <div>
                  <div className="t-num-lg text-ink">1,284</div>
                  <div className="t-caption text-ink-2">mentions</div>
                </div>
              }
            />
            <Legend className="justify-center" items={models.map((m) => ({ label: MODELS[m.id].name, color: MODELS[m.id].color }))} />
          </div>
        </Block>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Block title="BarChart" usage="Stacked by default. Hover a bar for the breakdown." code='<BarChart labels={days} series={[{ label, values, color }]} stacked />'>
          <div className="flex flex-col gap-3">
            <Legend items={barSeries.map((s) => ({ label: s.label, color: s.color }))} />
            <BarChart labels={days14.map((d) => d.split(" ")[1])} series={barSeries} height={170} format={(v) => fmt.int(v)} />
          </div>
        </Block>

        <Block title="SplitBar · Sparkline" usage="SplitBar for 100% composition, Sparkline for inline trends in rows." code='<SplitBar parts={[{ value, color, label }]} />  <Sparkline values={trend} />'>
          <div className="flex flex-col gap-5">
            {[
              { label: "Lumen", p: [62, 26, 12] },
              { label: "Orbit", p: [48, 34, 18] },
              { label: "Tidal", p: [41, 38, 21] },
            ].map((r) => (
              <div key={r.label} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between t-caption">
                  <span className="text-ink-2">{r.label}</span>
                  <span className="t-num-sm text-ink-3">
                    {r.p[0]} / {r.p[1]} / {r.p[2]}
                  </span>
                </div>
                <SplitBar
                  parts={[
                    { value: r.p[0], color: "var(--status-success)", label: "Positive" },
                    { value: r.p[1], color: "var(--bg-muted)", label: "Neutral" },
                    { value: r.p[2], color: "var(--status-danger)", label: "Negative" },
                  ]}
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {brands.slice(0, 4).map((b) => (
                <div key={b.id} className="flex flex-col gap-1.5 rounded-lg bg-canvas p-2.5">
                  <span className="flex items-center justify-between t-caption text-ink-2">
                    {b.name}
                    <DeltaText value={fmt.signed(b.visDelta)} good={b.visDelta >= 0} />
                  </span>
                  <Sparkline values={b.trend} color={brandColor(b)} width={96} height={26} />
                </div>
              ))}
            </div>
          </div>
        </Block>
      </div>

      <Block title="HeatCell" usage="Location × model grid. Intensity mixes --blue-500 into the canvas; text flips past 50%." code="<HeatCell value={44} />" flush panelClassName="p-2">
        <Table>
          <THead>
            <tr>
              <Th>Location</Th>
              {HEAT_MODELS.map((m) => (
                <Th key={m} align="center">
                  <span className="inline-flex items-center gap-1.5">
                    <ModelMark id={m} size={14} />
                    {MODELS[m].name}
                  </span>
                </Th>
              ))}
            </tr>
          </THead>
          <tbody>
            {locations.slice(0, 5).map((l, li) => (
              <Tr key={l.code}>
                <Td className="whitespace-nowrap">
                  <span className="t-body-medium">{l.name}</span>
                </Td>
                {HEAT_MODELS.map((m, mi) => {
                  const v = Math.max(4, Math.min(92, Math.round(l.visibility + ((mi * 13 + li * 7) % 23) - 9)));
                  return (
                    <Td key={m} className="min-w-[84px] px-1.5">
                      <HeatCell value={v} />
                    </Td>
                  );
                })}
              </Tr>
            ))}
          </tbody>
        </Table>
      </Block>
    </KitSection>
  );
}

/* ========================================================================== */
/* Marks                                                                       */
/* ========================================================================== */

export function MarksSection() {
  const ids = Object.keys(MODELS) as ModelId[];
  return (
    <KitSection
      id="marks"
      title="Marks"
      description="Neutral placeholder glyphs for AI engines and fictional brands — not vendor trademarks. Swap in real logos in your product."
    >
      <Block title="ModelMark" usage="One per answer engine. Use rounded-full in lists, default squircle in chips and tables." code='<ModelMark id="perplexity" size={24} />'>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
            {ids.map((id) => (
              <div key={id} className="flex flex-col items-center gap-2.5 rounded-xl bg-canvas px-2 py-4">
                <ModelMark id={id} size={40} />
                <div className="text-center">
                  <div className="t-caption-medium text-ink">{MODELS[id].name}</div>
                  <MonoLabel className="text-ink-3">{id}</MonoLabel>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-4">
            {[16, 20, 24, 32].map((s) => (
              <Demo key={s} label={`${s}px`}>
                <ModelMark id="chatgpt" size={s} />
                <ModelMark id="claude" size={s} className="rounded-full" />
              </Demo>
            ))}
          </div>
        </div>
      </Block>

      <div className="grid gap-4 xl:grid-cols-2">
        <Block title="BrandMark" usage="Fictional competitor marks from mock data — colour + shape." code="<BrandMark brand={brand} size={24} />">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            {brands.map((b) => (
              <div key={b.id} className="flex items-center gap-2.5">
                <BrandMark brand={b} size={28} />
                <div className="min-w-0">
                  <div className="truncate t-caption-medium text-ink">{b.name}</div>
                  <div className="truncate t-caption text-ink-3">{b.domain}</div>
                </div>
              </div>
            ))}
          </div>
        </Block>

        <Block title="DomainMark" usage="Favicon placeholder for cited sources — first letter on a stable colour." code='<DomainMark domain="reddit.com" size={18} />'>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            {sources.slice(0, 9).map((s) => (
              <div key={s.domain} className="flex items-center gap-2">
                <DomainMark domain={s.domain} size={20} />
                <span className="truncate t-caption text-ink-2">{s.domain}</span>
              </div>
            ))}
          </div>
        </Block>

        <Block title="SonyaLogo" usage="Ink tile with an orange spark. Hide the wordmark under 24px or in tight rails." code="<SonyaLogo size={28} wordmark />">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid h-28 place-items-center rounded-xl bg-canvas">
              <SonyaLogo size={32} />
            </div>
            <div className="flex h-28 items-center justify-center gap-4 rounded-xl bg-inverse">
              <SonyaLogo size={40} wordmark={false} />
              <SonyaLogo size={28} wordmark={false} />
              <SonyaLogo size={20} wordmark={false} />
            </div>
          </div>
        </Block>

        <Block title="DotMarker" usage="Site and workspace markers — a tile with 1–4 dots." code='<DotMarker color="blue" dots={2} size="md" />'>
          <div className="flex flex-col gap-3">
            {(["blue", "orange", "green", "purple"] as TileColor[]).map((c) => (
              <div key={c} className="flex items-center gap-3">
                <MonoLabel className="w-14">{c}</MonoLabel>
                {([1, 2, 3, 4] as const).map((d) => (
                  <DotMarker key={d} color={c} dots={d} size="md" />
                ))}
              </div>
            ))}
          </div>
        </Block>
      </div>
    </KitSection>
  );
}
