import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  CaretDown,
  CheckCircle,
  DownloadSimple,
  Info,
  MagnifyingGlass,
  Robot,
  Warning,
  WarningOctagon,
} from "@phosphor-icons/react";
import {
  Button,
  Card,
  CardHeader,
  CardPanel,
  CountChip,
  EmptyState,
  SearchInput,
  Segmented,
  StatusPill,
  useToast,
} from "@/components/ui";
import { PageHeader, PageSection } from "@/components/shell/PageHeader";
import { issues as seed } from "@/data/mock";
import { cn, fmt } from "@/lib/cn";
import { FixGuideBody, ImpactBadge, SeverityPill, severityMeta, type Issue, type IssueStatus, type Severity } from "./siteShared";

const categories = ["Structured data", "Crawlability", "Rendering", "Meta tags", "Content structure", "Links"] as const;

/** Prior-crawl counts so each severity card can show a change line. */
const prior: Record<Severity, number> = { critical: 3, warning: 4, notice: 1 };
const sevIcon: Record<Severity, JSX.Element> = {
  critical: <WarningOctagon weight="fill" />,
  warning: <Warning weight="fill" />,
  notice: <Info weight="fill" />,
};

type Row = Omit<Issue, "status"> & { status: IssueStatus };

export default function IssuesPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(seed);
  const [status, setStatus] = useState<IssueStatus>("open");
  const [cat, setCat] = useState<string>("all");
  const [sev, setSev] = useState<Severity | null>(null);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>("i2");
  const [rerun, setRerun] = useState(false);

  const active = rows.filter((r) => r.status !== "resolved");
  const bySev = (s: Severity) => active.filter((r) => r.severity === s);
  const totalPages = (list: Row[]) => list.reduce((a, r) => a + r.pages, 0);

  const statusCount = (s: IssueStatus) => rows.filter((r) => r.status === s).length;
  const scoped = rows.filter((r) => r.status === status);
  const catCount = (c: string) => scoped.filter((r) => c === "all" || r.category === c).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const order: Record<Severity, number> = { critical: 0, warning: 1, notice: 2 };
    return rows
      .filter((r) => r.status === status)
      .filter((r) => cat === "all" || r.category === cat)
      .filter((r) => !sev || r.severity === sev)
      .filter((r) => !q || r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q))
      .sort((a, b) => order[a.severity] - order[b.severity] || b.pages - a.pages);
  }, [rows, status, cat, sev, query]);

  const setRowStatus = (id: string, next: IssueStatus) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: next } : r)));

  const resolve = (r: Row) => {
    const before = r.status;
    setRowStatus(r.id, "resolved");
    setExpanded(null);
    toast({
      title: "Issue marked resolved",
      description: `${r.title} · ${r.pages} page${r.pages === 1 ? "" : "s"}`,
      action: { label: "Undo", onClick: () => setRowStatus(r.id, before) },
    });
  };

  const runAudit = () => {
    setRerun(true);
    setTimeout(() => {
      setRerun(false);
      toast({ title: "Audit complete", description: "1,000 pages re-checked · no new critical issues", tone: "info" });
    }, 1500);
  };

  const clear = () => {
    setCat("all");
    setSev(null);
    setQuery("");
  };

  return (
    <>
      <PageHeader
        title="Issues"
        actions={
          <>
            <StatusPill tone="neutral" className="hidden sm:inline-flex">
              Crawled Nov 4 · 1,000 pages
            </StatusPill>
            <Button
              variant="outlined"
              tone="secondary"
              iconLeft={<DownloadSimple className="size-4" />}
              onClick={() => toast({ title: "Export started", description: "issues-lumen-so-2026-11-06.csv will download shortly", tone: "info" })}
            >
              Export CSV
            </Button>
            <Button iconLeft={<ArrowClockwise className="size-4" />} loading={rerun} onClick={runAudit}>
              {rerun ? "Auditing…" : "Re-run audit"}
            </Button>
          </>
        }
      />

      {/* Severity summary */}
      <PageSection className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="t-caption text-ink-2">
            <span className="t-num-sm text-ink">{active.length}</span> active issues across{" "}
            <span className="t-num-sm text-ink">{fmt.int(totalPages(active))}</span> page instances
          </span>
          <span className="flex-1" />
          {sev && (
            <button type="button" onClick={() => setSev(null)} className="t-caption-medium text-ink-2 hover:text-ink">
              Clear severity filter
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {(["critical", "warning", "notice"] as Severity[]).map((s) => {
            const m = severityMeta[s];
            const list = bySev(s);
            const diff = list.length - prior[s];
            const selected = sev === s;
            const share = active.length ? (list.length / active.length) * 100 : 0;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={selected}
                onClick={() => setSev(selected ? null : s)}
                className={cn(
                  "group flex flex-col rounded-2xl bg-canvas p-1 text-left shadow-card transition-[box-shadow,transform] duration-150 active:scale-[0.99]",
                  selected && "shadow-[0_0_0_1.5px_var(--text-primary),var(--fx-card)]",
                )}
              >
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <span className="[&_svg]:size-4" style={{ color: m.color }}>
                    {sevIcon[s]}
                  </span>
                  <span className="flex-1 t-label text-ink">{m.plural}</span>
                  <span className="t-caption text-ink-3 transition-colors group-hover:text-ink-2">{selected ? "Filtering" : "Filter"}</span>
                </div>
                <div className="flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-card">
                  <div className="flex items-baseline gap-2">
                    <span className="t-num-xl" style={{ color: m.color }}>
                      {list.length}
                    </span>
                    <span className="t-caption text-ink-3">
                      on <span className="t-num-sm">{fmt.int(totalPages(list))}</span> pages
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-subtle">
                    <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${Math.max(4, share)}%`, background: m.color }} />
                  </div>
                  <div className="flex items-center justify-between t-caption">
                    <span className={cn(diff > 0 ? "text-danger" : diff < 0 ? "text-success" : "text-ink-3")}>
                      {diff === 0 ? "No change" : `${diff > 0 ? "+" : "−"}${Math.abs(diff)} ${diff > 0 ? "new" : "fixed"}`} since last crawl
                    </span>
                    <span className="t-num-sm text-ink-3">{Math.round(share)}%</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </PageSection>

      {/* Issue list */}
      <PageSection className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={status}
            onChange={(v) => {
              setStatus(v);
              setExpanded(null);
            }}
            options={[
              { value: "open", label: "Open", count: statusCount("open") },
              { value: "in_progress", label: "In progress", count: statusCount("in_progress") },
              { value: "resolved", label: "Resolved", count: statusCount("resolved") },
            ]}
          />
          <span className="flex-1" />
          <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search issues…" wrapperClassName="w-full sm:w-64" />
        </div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {["all", ...categories].map((c) => {
            const on = cat === c;
            const n = catCount(c);
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                onClick={() => setCat(c)}
                className={cn(
                  "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 t-caption-medium transition-colors duration-150",
                  on ? "bg-primary text-on-primary" : "bg-subtle text-ink-2 hover:bg-hover hover:text-ink",
                )}
              >
                {c === "all" ? "All categories" : c}
                <span className={cn("t-num-sm", on ? "opacity-70" : "text-ink-3")}>{n}</span>
              </button>
            );
          })}
        </div>

        <Card>
          <CardHeader
            title={
              <>
                {status === "open" ? "Open issues" : status === "in_progress" ? "In progress" : "Resolved"} <CountChip>{visible.length}</CountChip>
              </>
            }
            description="Ordered by severity, then pages affected"
          />
          <CardPanel flush>
            <div className="hidden items-center gap-3 border-b border-line bg-canvas px-4 py-2 t-caption text-ink-2 md:flex rounded-t-xl">
              <span className="w-[92px]">Severity</span>
              <span className="flex-1">Issue</span>
              <span className="w-24 text-right">Pages</span>
              <span className="w-24">Impact</span>
              <span className="w-24">Detected</span>
              <span className="w-[132px]" />
            </div>
            {visible.length === 0 ? (
              <EmptyState
                icon={status === "resolved" ? <CheckCircle /> : <MagnifyingGlass />}
                title={status === "resolved" && !query && cat === "all" && !sev ? "Nothing resolved yet" : "No issues match"}
                description={status === "open" ? "Nice — nothing open in this view. Try another category or severity." : "Adjust the filters to see more issues."}
                action={
                  <Button variant="outlined" tone="secondary" onClick={clear}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              visible.map((r) => {
                const isOpen = expanded === r.id;
                return (
                  <div key={r.id} className={cn("border-b border-line last:border-b-0", isOpen && "bg-canvas/50")}>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={isOpen}
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setExpanded(isOpen ? null : r.id);
                        }
                      }}
                      className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 transition-colors hover:bg-canvas md:flex-nowrap"
                    >
                      <span className="w-[92px] shrink-0">
                        <SeverityPill severity={r.severity} />
                      </span>
                      <span className="min-w-0 flex-1 basis-56">
                        <span className="block truncate t-body-medium text-ink">{r.title}</span>
                        <span className="block truncate t-caption text-ink-3">{r.category}</span>
                      </span>
                      <span className="w-24 text-right t-num text-ink">
                        {r.pages}
                        <span className="ml-1 font-sans t-caption text-ink-3">pages</span>
                      </span>
                      <span className="w-24">
                        <ImpactBadge impact={r.impact} />
                      </span>
                      <span className="w-24 t-caption text-ink-2">{r.detected}</span>
                      <span className="flex w-[132px] items-center justify-end gap-1">
                        {r.status === "resolved" ? (
                          <Button
                            size="xs"
                            variant="link"
                            tone="secondary"
                            iconLeft={<ArrowCounterClockwise className="size-3.5" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setRowStatus(r.id, "open");
                              toast({ title: "Issue reopened", description: r.title, tone: "info" });
                            }}
                          >
                            Reopen
                          </Button>
                        ) : (
                          <span className="inline-flex items-center gap-1 t-caption-medium text-ink-2">How to fix</span>
                        )}
                        <CaretDown className={cn("size-4 text-icon-subtle transition-transform duration-200", isOpen && "rotate-180")} />
                      </span>
                    </div>
                    {isOpen && (
                      <div className="animate-[sy-fade-in_160ms_ease-out] px-4 pb-4 md:pl-[124px]">
                        <FixGuideBody
                          issueId={r.id}
                          onOpenPage={(u) => nav(`/site-health/page?url=${encodeURIComponent(u)}`)}
                          extra={
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {r.status !== "resolved" && (
                                <Button size="xs" variant="outlined" iconLeft={<CheckCircle className="size-3.5" />} onClick={() => resolve(r)}>
                                  Mark resolved
                                </Button>
                              )}
                              {r.status === "open" && (
                                <Button
                                  size="xs"
                                  variant="outlined"
                                  tone="secondary"
                                  onClick={() => {
                                    setRowStatus(r.id, "in_progress");
                                    toast({ title: "Moved to In progress", description: r.title, tone: "info" });
                                  }}
                                >
                                  Start fixing
                                </Button>
                              )}
                              <Button size="xs" variant="link" tone="secondary" iconLeft={<Robot className="size-3.5" />} onClick={() => nav("/agent")}>
                                Ask agent
                              </Button>
                            </div>
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardPanel>
        </Card>
      </PageSection>
    </>
  );
}
