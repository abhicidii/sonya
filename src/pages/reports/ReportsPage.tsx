import { useMemo, useState, type ReactNode } from "react";
import {
  CalendarBlank,
  ChartBar,
  ChatCircleDots,
  Copy,
  DotsThree,
  DownloadSimple,
  Envelope,
  Eye,
  FileCsv,
  FilePdf,
  FileText,
  Medal,
  Newspaper,
  Pause,
  PaperPlaneTilt,
  Play,
  Plus,
  PresentationChart,
  SlidersHorizontal,
  Trash,
  Users,
  X,
} from "@phosphor-icons/react";
import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardPanel,
  CountChip,
  DeltaPill,
  Dialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  KpiCard,
  MenuDivider,
  MenuItem,
  Popover,
  Segmented,
  Select,
  SonyaLogo,
  StatusPill,
  Tile,
  useToast,
  type TileColor,
} from "@/components/ui";
import { BarChart, Legend, LineChart } from "@/components/charts";
import { PageHeader, PageSection } from "@/components/shell/PageHeader";
import { brands, days14, reports as seedReports, team } from "@/data/mock";
import { cn, fmt } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/* Model                                                                       */
/* -------------------------------------------------------------------------- */

type Status = "active" | "paused" | "draft";
type Format = "PDF" | "Slides" | "CSV";
type Template = "weekly" | "competitor" | "board" | "custom";

interface Report {
  id: string;
  name: string;
  schedule: string;
  format: Format;
  recipients: string[];
  last: string;
  status: Status;
  template: Template;
}

const templateDefs: Record<Template, { title: string; description: string; includes: string; icon: ReactNode; tile: TileColor; schedule: string; format: Format }> = {
  weekly: {
    title: "Weekly digest",
    description: "Visibility, mentions and top movers every week.",
    includes: "4 KPIs · trend · top prompts",
    icon: <Newspaper weight="fill" />,
    tile: "blue",
    schedule: "Every Monday · 09:00",
    format: "PDF",
  },
  competitor: {
    title: "Competitor SOV",
    description: "Share of voice against the brands you track.",
    includes: "SOV split · rankings · gaps",
    icon: <ChartBar weight="fill" />,
    tile: "orange",
    schedule: "Monthly · 1st",
    format: "Slides",
  },
  board: {
    title: "Board update",
    description: "A one-page executive summary of AI search.",
    includes: "Headline KPIs · narrative · outlook",
    icon: <PresentationChart weight="fill" />,
    tile: "purple",
    schedule: "One-off",
    format: "PDF",
  },
  custom: {
    title: "Custom",
    description: "Pick the metrics, filters and sections yourself.",
    includes: "Any widget from AEO Insights",
    icon: <SlidersHorizontal weight="fill" />,
    tile: "green",
    schedule: "Every Friday · 16:00",
    format: "CSV",
  },
};

const seedTemplates: Template[] = ["weekly", "competitor", "board", "custom"];
const scheduleOptions = ["Every Monday · 09:00", "Every Friday · 16:00", "Monthly · 1st", "Quarterly · 1st", "One-off"];

const formatMeta: Record<Format, { icon: ReactNode; tile: TileColor }> = {
  PDF: { icon: <FilePdf weight="fill" />, tile: "pink" },
  Slides: { icon: <PresentationChart weight="fill" />, tile: "orange" },
  CSV: { icon: <FileCsv weight="fill" />, tile: "green" },
};

const statusMeta: Record<Status, { tone: "success" | "warning" | "neutral"; label: string }> = {
  active: { tone: "success", label: "Active" },
  paused: { tone: "warning", label: "Paused" },
  draft: { tone: "neutral", label: "Draft" },
};

const nextSend = (schedule: string) =>
  schedule.startsWith("Every Monday") ? "Mon, Nov 9 · 09:00" : schedule.startsWith("Every Friday") ? "Fri, Nov 13 · 16:00" : schedule.startsWith("Monthly") ? "Tue, Dec 1 · 09:00" : schedule.startsWith("Quarterly") ? "Fri, Jan 1 · 09:00" : "Send manually";

const brandColor = (c: string, you?: boolean) => (you ? "var(--data-1)" : c === "#141414" ? "#737373" : c);

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function ReportsPage() {
  const toast = useToast();
  const [items, setItems] = useState<Report[]>(() =>
    seedReports.map((r, i) => ({ ...r, format: r.format as Format, status: r.status as Status, template: seedTemplates[i % 4] })),
  );
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [selectedId, setSelectedId] = useState(seedReports[0].id);
  const [createOpen, setCreateOpen] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const rows = items.filter((r) => filter === "all" || r.status === filter);
  const selected = items.find((r) => r.id === selectedId) ?? items[0] ?? null;
  const count = (s: Status) => items.filter((r) => r.status === s).length;
  const recipients = new Set(items.flatMap((r) => r.recipients)).size;

  const snapshot = () => {
    const prev = items;
    return () => setItems(prev);
  };

  const sendNow = (r: Report) => {
    setSending(r.id);
    window.setTimeout(() => {
      setSending(null);
      setItems((s) => s.map((x) => (x.id === r.id ? { ...x, last: "Just now" } : x)));
      toast({ title: "Report sent", description: `${r.name} → ${r.recipients.length} ${r.recipients.length === 1 ? "recipient" : "recipients"}` });
    }, 900);
  };

  const togglePause = (r: Report) => {
    const next: Status = r.status === "paused" ? "active" : "paused";
    setItems((s) => s.map((x) => (x.id === r.id ? { ...x, status: next } : x)));
    toast({
      tone: next === "paused" ? "info" : "success",
      title: next === "paused" ? "Schedule paused" : "Schedule resumed",
      description: next === "paused" ? `${r.name} won't send until resumed.` : `Next send: ${nextSend(r.schedule)}`,
    });
  };

  const duplicate = (r: Report) => {
    const copy: Report = { ...r, id: `r${Date.now()}`, name: `${r.name} (copy)`, status: "draft", last: "Never" };
    setItems((s) => {
      const i = s.findIndex((x) => x.id === r.id);
      return [...s.slice(0, i + 1), copy, ...s.slice(i + 1)];
    });
    setSelectedId(copy.id);
    toast({ title: "Report duplicated", description: "The copy is saved as a draft." });
  };

  const remove = (r: Report) => {
    const undo = snapshot();
    setItems((s) => s.filter((x) => x.id !== r.id));
    if (selectedId === r.id) setSelectedId(items.find((x) => x.id !== r.id)?.id ?? "");
    toast({ tone: "info", title: "Report deleted", description: r.name, action: { label: "Undo", onClick: undo } });
  };

  const create = (r: Omit<Report, "id" | "last" | "status">) => {
    const report: Report = { ...r, id: `r${Date.now()}`, last: "Never", status: r.schedule === "One-off" ? "draft" : "active" };
    setItems((s) => [report, ...s]);
    setSelectedId(report.id);
    setFilter("all");
    setCreateOpen(false);
    toast({
      title: "Report created",
      description: report.status === "active" ? `First send: ${nextSend(report.schedule)}` : "Saved as a draft — send it whenever you're ready.",
    });
  };

  return (
    <>
      <PageHeader
        title="Reports"
        badge={<Badge tone="blue">Beta</Badge>}
        actions={
          <Button iconLeft={<Plus weight="bold" className="size-4" />} onClick={() => setCreateOpen(true)}>
            New report
          </Button>
        }
      />

      <PageSection>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Active schedules" icon={<CalendarBlank weight="fill" />} tile="blue" prior={`${items.length} reports`} value={`${count("active")}`} unit="sending" />
          <KpiCard label="Sent this month" icon={<PaperPlaneTilt weight="fill" />} tile="orange" prior="vs 11" value="14" unit="deliveries" delta={{ value: "+3", direction: "up" }} />
          <KpiCard label="Recipients" icon={<Users weight="fill" />} tile="green" prior="across reports" value={`${recipients}`} unit="people" />
          <KpiCard label="Avg. open rate" icon={<Envelope weight="fill" />} tile="pink" prior="vs 61%" value="68%" unit="last 30 days" delta={{ value: "+7 pts", direction: "up" }} />
        </div>
      </PageSection>

      <PageSection className="grid flex-1 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* List */}
        <Card>
          <CardHeader
            title={
              <>
                All reports <CountChip>{items.length}</CountChip>
              </>
            }
            actions={
              <Segmented<"all" | Status>
                size="xs"
                value={filter}
                onChange={setFilter}
                className="hidden sm:inline-flex"
                options={[
                  { value: "all", label: "All" },
                  { value: "active", label: "Active", count: count("active") },
                  { value: "paused", label: "Paused", count: count("paused") },
                  { value: "draft", label: "Draft", count: count("draft") },
                ]}
              />
            }
          />
          <CardPanel flush className="p-2">
            <div className="hidden grid-cols-[minmax(0,2.4fr)_minmax(0,1.5fr)_64px_84px_minmax(0,1fr)_84px_32px] items-center gap-3 rounded-lg bg-canvas px-3 py-2.5 t-caption text-ink-2 md:grid">
              <span>Report</span>
              <span>Schedule</span>
              <span>Format</span>
              <span>Recipients</span>
              <span>Last sent</span>
              <span>Status</span>
              <span className="sr-only">Actions</span>
            </div>
            {rows.length === 0 ? (
              <EmptyState
                icon={<FileText weight="duotone" />}
                title={`No ${filter} reports`}
                description="Change the filter or create a new report."
                action={
                  <Button variant="outlined" tone="secondary" onClick={() => setFilter("all")}>
                    Show all reports
                  </Button>
                }
              />
            ) : (
              <div className="flex flex-col">
                {rows.map((r) => (
                  <ReportRow
                    key={r.id}
                    report={r}
                    selected={selected?.id === r.id}
                    sending={sending === r.id}
                    onSelect={() => setSelectedId(r.id)}
                    onSend={() => sendNow(r)}
                    onTogglePause={() => togglePause(r)}
                    onDuplicate={() => duplicate(r)}
                    onDelete={() => remove(r)}
                  />
                ))}
              </div>
            )}
          </CardPanel>
          <CardFooter>
            <span className="t-caption text-ink-2">Reports are delivered from reports@sonya.ai</span>
            <Button size="xs" variant="link" tone="secondary" iconLeft={<Plus className="size-3.5" />} onClick={() => setCreateOpen(true)}>
              New report
            </Button>
          </CardFooter>
        </Card>

        {/* Preview */}
        <div className="xl:sticky xl:top-5">
          {selected ? (
            <ReportPreview
              report={selected}
              sending={sending === selected.id}
              onSend={() => sendNow(selected)}
              onDownload={() => toast({ title: `Preparing ${selected.format}`, description: `${selected.name}.${selected.format === "Slides" ? "pptx" : selected.format.toLowerCase()} will download shortly.` })}
            />
          ) : (
            <Card>
              <CardPanel>
                <EmptyState icon={<Eye weight="duotone" />} title="Nothing to preview" description="Create a report to see a preview here." />
              </CardPanel>
            </Card>
          )}
        </div>
      </PageSection>

      <NewReportDialog key={createOpen ? "open" : "closed"} open={createOpen} onClose={() => setCreateOpen(false)} onCreate={create} />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Row                                                                         */
/* -------------------------------------------------------------------------- */

function ReportRow({
  report: r,
  selected,
  sending,
  onSelect,
  onSend,
  onTogglePause,
  onDuplicate,
  onDelete,
}: {
  report: Report;
  selected: boolean;
  sending: boolean;
  onSelect: () => void;
  onSend: () => void;
  onTogglePause: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const fm = formatMeta[r.format];
  const st = statusMeta[r.status];
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-lg border-b border-line px-3 py-3 transition-colors last:border-b-0 md:grid-cols-[minmax(0,2.4fr)_minmax(0,1.5fr)_64px_84px_minmax(0,1fr)_84px_32px] md:py-2.5",
        selected ? "bg-brand-subtle" : "hover:bg-canvas",
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Tile color={fm.tile} size="lg">
          {fm.icon}
        </Tile>
        <div className="min-w-0">
          <div className="truncate t-body-medium text-ink">{r.name}</div>
          <div className="truncate t-caption text-ink-3">{templateDefs[r.template].title}</div>
        </div>
      </div>

      {/* Mobile: status + menu on the right */}
      <div className="flex items-center gap-1 md:hidden">
        <StatusPill tone={st.tone}>{st.label}</StatusPill>
      </div>

      <div className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-1 t-caption text-ink-2 md:hidden">
        <span className="inline-flex items-center gap-1">
          <CalendarBlank className="size-3.5 text-icon-muted" />
          {r.schedule}
        </span>
        <Badge tone="outline">{r.format}</Badge>
        <AvatarStack names={r.recipients} size={18} />
        <span>Last sent {r.last}</span>
        <span className="flex-1" />
        <RowMenu report={r} onSend={onSend} onTogglePause={onTogglePause} onDuplicate={onDuplicate} onDelete={onDelete} />
      </div>

      <span className="hidden min-w-0 items-center gap-1.5 t-caption text-ink-2 md:flex">
        <CalendarBlank className="size-3.5 shrink-0 text-icon-muted" />
        <span className="truncate">{r.schedule}</span>
      </span>
      <span className="hidden md:block">
        <Badge tone="outline">{r.format}</Badge>
      </span>
      <span className="hidden md:block">
        <AvatarStack names={r.recipients} size={22} />
      </span>
      <span className="hidden truncate t-caption text-ink-2 md:block">{sending ? "Sending…" : r.last}</span>
      <span className="hidden md:block">
        <StatusPill tone={st.tone}>{st.label}</StatusPill>
      </span>
      <span className="hidden justify-end md:flex">
        <RowMenu report={r} onSend={onSend} onTogglePause={onTogglePause} onDuplicate={onDuplicate} onDelete={onDelete} />
      </span>
    </div>
  );
}

function RowMenu({
  report: r,
  onSend,
  onTogglePause,
  onDuplicate,
  onDelete,
}: {
  report: Report;
  onSend: () => void;
  onTogglePause: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Popover
        align="end"
        trigger={({ open, toggle }) => (
          <IconButton label={`Actions for ${r.name}`} size="xs" variant="link" onClick={toggle} className={cn(open && "bg-subtle text-ink")}>
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
              <MenuItem icon={<PaperPlaneTilt />} onClick={act(onSend)}>
                Send now
              </MenuItem>
              {r.status !== "draft" && (
                <MenuItem icon={r.status === "paused" ? <Play /> : <Pause />} onClick={act(onTogglePause)}>
                  {r.status === "paused" ? "Resume schedule" : "Pause schedule"}
                </MenuItem>
              )}
              <MenuItem icon={<Copy />} onClick={act(onDuplicate)}>
                Duplicate
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<Trash />} danger onClick={act(onDelete)}>
                Delete
              </MenuItem>
            </div>
          );
        }}
      </Popover>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Preview                                                                     */
/* -------------------------------------------------------------------------- */

function ReportPreview({ report, sending, onSend, onDownload }: { report: Report; sending: boolean; onSend: () => void; onDownload: () => void }) {
  const t = report.template;
  const top = brands.slice(0, 3);
  const kpis =
    t === "competitor"
      ? [
          { label: "Your SOV", value: "18.4%", delta: "+1.3", icon: <ChatCircleDots weight="fill" />, tile: "orange" as TileColor },
          { label: "Orbit SOV", value: "16.1%", delta: "−0.8", down: true, icon: <ChartBar weight="fill" />, tile: "blue" as TileColor },
          { label: "Rank", value: "#1", delta: "+1", icon: <Medal weight="fill" />, tile: "green" as TileColor },
          { label: "Gap prompts", value: "6", delta: "−2", down: true, good: true, icon: <Eye weight="fill" />, tile: "pink" as TileColor },
        ]
      : [
          { label: "Visibility", value: "41.8%", delta: "+3.2", icon: <Eye weight="fill" />, tile: "blue" as TileColor },
          { label: "Share of voice", value: "18.4%", delta: "+1.3", icon: <ChatCircleDots weight="fill" />, tile: "orange" as TileColor },
          { label: "Avg. position", value: "#1.6", delta: "−0.3", down: true, good: true, icon: <Medal weight="fill" />, tile: "green" as TileColor },
          { label: "Mentions", value: fmt.compact(1284), delta: "+12%", icon: <ChatCircleDots weight="fill" />, tile: "pink" as TileColor },
        ];

  const highlights =
    t === "board"
      ? ["Lumen leads AI answers for B2B product analytics for the 3rd month.", "Perplexity is the fastest-growing source of AI referral traffic (+31%).", "Next quarter: close the session-replay gap flagged by AI Overviews."]
      : t === "competitor"
        ? ["Lumen overtook Orbit on share of voice in ChatGPT answers.", "Quanta gained +4.1 pts — watch its comparison pages.", "Tidal is cited in 6 comparison prompts where Lumen is missing."]
        : ["Visibility up +3.2 pts, driven by the activation-rate guide.", "Perplexity now mentions Lumen in 53% of answers.", "2 prompts dropped out of the top 3 in AI Overviews."];

  return (
    <Card>
      <CardHeader
        icon={<Eye weight="fill" />}
        tile="ink"
        title="Preview"
        description={report.name}
        actions={
          <>
            <IconButton label="Download" size="xs" onClick={onDownload}>
              <DownloadSimple className="size-3.5" />
            </IconButton>
            <Button size="xs" variant="outlined" loading={sending} iconLeft={!sending ? <PaperPlaneTilt className="size-3.5" /> : undefined} onClick={onSend}>
              Send now
            </Button>
          </>
        }
      />
      <CardPanel className="flex flex-col gap-4">
        {/* Doc header */}
        <div key={report.id} className="flex flex-col gap-4 animate-[sy-fade-in_200ms_ease-out]">
          <div className="flex items-center gap-2">
            <SonyaLogo size={20} wordmark={false} />
            <span className="t-caption-medium text-ink">Lumen · AI visibility</span>
            <span className="flex-1" />
            <span className="t-num-sm text-ink-3">Oct 31 – Nov 6</span>
          </div>
          <div>
            <div className="t-caption text-ink-3">{templateDefs[t].title}</div>
            <div className="t-heading text-ink [text-wrap:balance]">{report.name}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {kpis.map((k) => (
              <div key={k.label} className="flex flex-col gap-1.5 rounded-xl bg-canvas p-2.5">
                <span className="flex items-center gap-1.5 t-caption text-ink-2">
                  <Tile color={k.tile} size="xs">
                    {k.icon}
                  </Tile>
                  {k.label}
                </span>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="t-num text-ink">{k.value}</span>
                  <DeltaPill size="xs" value={k.delta} direction={k.down ? "down" : "up"} good={k.good ?? !k.down} />
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 rounded-xl bg-surface p-3 shadow-card">
            <div className="flex items-center justify-between">
              <span className="t-caption-medium text-ink">{t === "competitor" ? "Share of voice by brand" : "Visibility trend"}</span>
              <Legend items={top.map((b) => ({ label: b.name, color: brandColor(b.color, b.you) }))} className="gap-x-2.5" />
            </div>
            {t === "competitor" ? (
              <BarChart
                height={120}
                labels={days14.slice(-7)}
                stacked
                series={top.map((b) => ({ label: b.name, values: b.trend.slice(-7).map((v) => Math.round(v / 2.3)), color: brandColor(b.color, b.you) }))}
                format={(v) => `${v}%`}
              />
            ) : (
              <LineChart
                labels={days14}
                height={140}
                yTicks={3}
                series={top.map((b) => ({ id: b.id, label: b.name, values: b.trend, color: brandColor(b.color, b.you), emphasis: b.you }))}
                format={(v) => `${Math.round(v)}%`}
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="t-caption-medium text-ink">Highlights</span>
            <ul className="flex flex-col gap-1.5">
              {highlights.map((h, i) => (
                <li key={i} className="flex gap-2 t-caption text-ink-2">
                  <span className="mt-[5px] size-1.5 shrink-0 rounded-full bg-[var(--data-1)]" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardPanel>
      <CardFooter className="gap-3">
        <span className="flex min-w-0 items-center gap-1.5 t-caption text-ink-2">
          <CalendarBlank className="size-3.5 shrink-0 text-icon-muted" />
          <span className="truncate">{report.status === "paused" ? "Paused" : report.status === "draft" ? "Draft · not scheduled" : `Next: ${nextSend(report.schedule)}`}</span>
        </span>
        <AvatarStack names={report.recipients} size={20} />
      </CardFooter>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* New report                                                                  */
/* -------------------------------------------------------------------------- */

function NewReportDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (r: Omit<Report, "id" | "last" | "status">) => void }) {
  const [template, setTemplate] = useState<Template>("weekly");
  const [name, setName] = useState(templateDefs.weekly.title);
  const [nameTouched, setNameTouched] = useState(false);
  const [schedule, setSchedule] = useState(templateDefs.weekly.schedule);
  const [format, setFormat] = useState<Format>("PDF");
  const [recipients, setRecipients] = useState<string[]>(["Maya Chen"]);
  const [email, setEmail] = useState("");

  const pick = (t: Template) => {
    setTemplate(t);
    setSchedule(templateDefs[t].schedule);
    setFormat(templateDefs[t].format);
    if (!nameTouched) setName(templateDefs[t].title);
  };

  const toggle = (n: string) => setRecipients((r) => (r.includes(n) ? r.filter((x) => x !== n) : [...r, n]));
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const addEmail = () => {
    if (!emailValid) return;
    const e = email.trim().toLowerCase();
    if (!recipients.includes(e)) setRecipients((r) => [...r, e]);
    setEmail("");
  };
  const externals = useMemo(() => recipients.filter((r) => !team.some((m) => m.name === r)), [recipients]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="New report"
      description="Schedule a branded AI-visibility report for your team or stakeholders."
      footer={
        <>
          <span className="mr-auto hidden t-caption text-ink-3 sm:inline">{schedule === "One-off" ? "Saved as a draft" : `First send: ${nextSend(schedule)}`}</span>
          <Button variant="outlined" tone="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || recipients.length === 0} onClick={() => onCreate({ name: name.trim(), template, schedule, format, recipients })}>
            Create report
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 p-5">
        <Field label="Template">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(Object.keys(templateDefs) as Template[]).map((k) => {
              const d = templateDefs[k];
              const on = template === k;
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pick(k)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl bg-surface p-3 text-left transition-[box-shadow,background-color] duration-150",
                    on ? "shadow-[0_0_0_1.5px_var(--text-primary),0_1px_2px_rgb(40_40_40/0.08)]" : "shadow-control hover:bg-canvas",
                  )}
                >
                  <Tile color={d.tile} size="lg">
                    {d.icon}
                  </Tile>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="t-body-medium text-ink">{d.title}</span>
                      {k === "weekly" && <Badge tone="green">Popular</Badge>}
                    </div>
                    <div className="mt-0.5 t-caption text-ink-2">{d.description}</div>
                    <div className="mt-1.5 t-caption text-ink-3">{d.includes}</div>
                  </div>
                  <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full transition-shadow", on ? "shadow-[inset_0_0_0_5px_var(--text-primary)]" : "shadow-control")} />
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Report name">
          <Input
            size="md"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameTouched(true);
            }}
            placeholder="e.g. Weekly AI visibility digest"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Schedule">
            <Select
              label="Schedule"
              value={schedule}
              onChange={setSchedule}
              icon={<CalendarBlank />}
              className="w-full justify-between"
              options={scheduleOptions.map((s) => ({ value: s, label: s }))}
            />
          </Field>
          <Field label="Format">
            <Segmented<Format>
              stretch
              value={format}
              onChange={setFormat}
              options={(["PDF", "Slides", "CSV"] as Format[]).map((f) => ({ value: f, label: f }))}
            />
          </Field>
        </div>

        <Field label="Recipients" aside={<span className="t-caption text-ink-3">{recipients.length} selected</span>}>
          <div className="flex flex-wrap gap-2">
            {team.map((m) => {
              const on = recipients.includes(m.name);
              return (
                <button
                  key={m.email}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(m.name)}
                  className={cn(
                    "inline-flex h-8 items-center gap-2 rounded-full bg-surface pl-1 pr-3 t-caption-medium transition-[box-shadow,color] duration-150",
                    on ? "text-ink shadow-[0_0_0_1.5px_var(--text-primary)]" : "text-ink-2 shadow-control hover:text-ink",
                  )}
                >
                  <Avatar name={m.name} size={24} />
                  {m.name}
                </button>
              );
            })}
            {externals.map((e) => (
              <span key={e} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-subtle pl-3 pr-1.5 t-caption-medium text-ink">
                <Envelope className="size-3.5 text-icon-muted" />
                {e}
                <button type="button" aria-label={`Remove ${e}`} onClick={() => toggle(e)} className="grid size-5 place-items-center rounded-full text-icon-muted hover:bg-hover hover:text-ink">
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-1 flex gap-2">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addEmail();
                }
              }}
              iconLeft={<Envelope />}
              placeholder="Add an email outside your workspace"
              wrapperClassName="flex-1"
            />
            <Button variant="outlined" tone="secondary" disabled={!emailValid} onClick={addEmail}>
              Add
            </Button>
          </div>
        </Field>
      </div>
    </Dialog>
  );
}
