import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Browsers,
  CaretRight,
  ChartBar,
  ChartLine,
  FileMagnifyingGlass,
  Gauge,
  Lightning,
  MagnifyingGlass,
  PencilSimple,
  Robot,
  Sparkle,
  TreeStructure,
} from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardPanel,
  Checkbox,
  CountChip,
  DeltaText,
  Dialog,
  EmptyState,
  Field,
  Input,
  KpiCard,
  ModelMark,
  Progress,
  SearchInput,
  Segmented,
  Skeleton,
  StatusPill,
  Table,
  Td,
  Th,
  THead,
  Toggle,
  Tr,
  Textarea,
  useToast,
  type ModelId,
} from "@/components/ui";
import { BarChart, LineChart, Sparkline } from "@/components/charts";
import { PageHeader, PageSection } from "@/components/shell/PageHeader";
import { days14, sitePages } from "@/data/mock";
import { cn, fmt } from "@/lib/cn";
import { hashInt, ScoreCell, SITEMAP_TOTAL, type SitePage } from "./siteShared";

/* Crawler data ------------------------------------------------------------- */

const crawlers: { id: string; label: string; model: ModelId; color: string; values: number[]; delta: number }[] = [
  { id: "gpt", label: "GPTBot", model: "chatgpt", color: "#10a37f", values: [412, 438, 401, 466, 492, 455, 470, 518, 544, 531, 562, 590, 611, 648], delta: 18.4 },
  { id: "pplx", label: "PerplexityBot", model: "perplexity", color: "#7b42ff", values: [228, 241, 236, 260, 255, 279, 288, 284, 302, 318, 311, 336, 342, 361], delta: 12.1 },
  { id: "gext", label: "Google-Extended", model: "gemini", color: "#2e90fa", values: [180, 176, 188, 172, 190, 186, 179, 194, 188, 201, 196, 204, 199, 210], delta: 4.6 },
  { id: "claude", label: "ClaudeBot", model: "claude", color: "#ff8000", values: [64, 70, 61, 78, 82, 76, 88, 92, 86, 101, 108, 104, 117, 126], delta: 31.2 },
];
const totalVisits = crawlers.reduce((a, c) => a + c.values.reduce((x, y) => x + y, 0), 0);

type Row = SitePage & { auditing?: boolean };
type SortKey = "visitors" | "issues" | "technical" | "aeo";

export default function SiteHealthPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(sitePages);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"all" | "audited" | "never">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "visitors", dir: "desc" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<number | null>(null);
  const [chart, setChart] = useState<"line" | "bar">("line");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [sitemapOpen, setSitemapOpen] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearInterval(timer.current), []);

  const audited = rows.filter((r) => r.audited !== "Never");
  const neverCount = rows.length - audited.length;
  const avg = (k: "technical" | "aeo") => Math.round(audited.reduce((a, r) => a + r[k], 0) / Math.max(1, audited.length));
  const auditedTotal = 1000 + (audited.length - sitePages.filter((r) => r.audited !== "Never").length);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (view === "audited" && r.audited === "Never") return false;
      if (view === "never" && r.audited !== "Never") return false;
      return !q || r.url.toLowerCase().includes(q) || r.title.toLowerCase().includes(q);
    });
    const m = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => (a[sort.key] - b[sort.key]) * m);
  }, [rows, query, view, sort]);

  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }));
  const sortOf = (key: SortKey) => (sort.key === key ? sort.dir : null);

  const allChecked = visible.length > 0 && visible.every((r) => selected.has(r.url));
  const someChecked = visible.some((r) => selected.has(r.url));
  const toggleAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      if (allChecked) visible.forEach((r) => n.delete(r.url));
      else visible.forEach((r) => n.add(r.url));
      return n;
    });
  const toggleOne = (url: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(url)) n.delete(url);
      else n.add(url);
      return n;
    });

  const targets = selected.size ? [...selected] : rows.filter((r) => r.audited === "Never").map((r) => r.url);
  const auditLabel = selected.size
    ? `Audit ${selected.size} selected`
    : neverCount
      ? `Audit ${neverCount} of ${rows.length} pages`
      : `Re-audit ${rows.length} pages`;

  const runAudit = () => {
    const urls = targets.length ? targets : rows.map((r) => r.url);
    setRows((rs) => rs.map((r) => (urls.includes(r.url) ? { ...r, auditing: true } : r)));
    setProgress(0);
    const started = Date.now();
    timer.current = window.setInterval(() => {
      const p = Math.min(100, ((Date.now() - started) / 1500) * 100);
      setProgress(p);
      if (p >= 100) {
        window.clearInterval(timer.current);
        setRows((rs) =>
          rs.map((r) => {
            if (!urls.includes(r.url)) return r;
            const fresh = r.audited === "Never";
            return {
              ...r,
              auditing: false,
              audited: "Just now",
              technical: fresh ? hashInt(r.url, 58, 94) : Math.min(99, r.technical + hashInt(r.url, 0, 4)),
              aeo: fresh ? hashInt(r.url + "a", 38, 86) : Math.min(99, r.aeo + hashInt(r.url, 1, 5)),
              issues: fresh ? hashInt(r.url + "i", 1, 7) : Math.max(0, r.issues - 1),
              visitors: fresh ? hashInt(r.url + "v", 900, 7400) : r.visitors,
            };
          }),
        );
        setProgress(null);
        setSelected(new Set());
        toast({
          title: `Audit complete · ${urls.length} page${urls.length === 1 ? "" : "s"}`,
          description: "Technical and AEO scores updated. New issues were added to Issues.",
          action: { label: "View issues", onClick: () => nav("/issues") },
        });
      }
    }, 60);
  };

  const series = crawlers.filter((c) => !hidden.has(c.id));

  return (
    <>
      <PageHeader
        title="Site Health"
        badge={<Badge tone="outline">lumen.so</Badge>}
        actions={
          <>
            <StatusPill tone="success" className="hidden sm:inline-flex">
              Last crawl Nov 4 · 2,767 URLs
            </StatusPill>
            <Button variant="outlined" tone="secondary" iconLeft={<Lightning className="size-4" />} onClick={() => nav("/issues")}>
              View issues
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <PageSection>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Technical score" icon={<Gauge weight="fill" />} tile="blue" prior="vs 76" value={`${avg("technical")}`} unit="/ 100" delta={{ value: "+4", direction: "up" }} />
          <KpiCard label="AEO score" icon={<Sparkle weight="fill" />} tile="orange" prior="vs 61" value={`${avg("aeo")}`} unit="/ 100" delta={{ value: "+3", direction: "up" }} />
          <KpiCard
            label="Pages audited"
            icon={<FileMagnifyingGlass weight="fill" />}
            tile="green"
            prior={`of ${fmt.int(SITEMAP_TOTAL)}`}
            value={fmt.int(auditedTotal)}
            unit={`${Math.round((auditedTotal / SITEMAP_TOTAL) * 100)}% coverage`}
            footer={
              <div className="px-3 pb-2.5 pt-2">
                <Progress value={auditedTotal} max={SITEMAP_TOTAL} tone="green" />
              </div>
            }
          />
          <KpiCard label="AI crawler visits" icon={<Robot weight="fill" />} tile="pink" prior="last 14 days" value={fmt.compact(totalVisits)} unit="requests" delta={{ value: "+16.2%", direction: "up" }} />
        </div>
      </PageSection>

      {/* Crawler chart */}
      <PageSection className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,9fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader
            icon={<Robot weight="fill" />}
            tile="purple"
            title="AI crawler visits"
            description="Requests from answer-engine bots · Oct 24 – Nov 6"
            actions={
              <Segmented
                size="xs"
                value={chart}
                onChange={setChart}
                options={[
                  { value: "line", label: <span className="sr-only">Line</span>, icon: <ChartLine /> },
                  { value: "bar", label: <span className="sr-only">Bars</span>, icon: <ChartBar /> },
                ]}
              />
            }
          />
          <CardPanel className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="t-num-lg text-ink">{fmt.int(totalVisits)}</span>
              <span className="t-caption text-ink-2">bot requests</span>
              <span className="flex-1" />
              <StatusPill tone="success">ClaudeBot up 31% this period</StatusPill>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {crawlers.map((c) => {
                const off = hidden.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={!off}
                    onClick={() =>
                      setHidden((h) => {
                        const n = new Set(h);
                        if (n.has(c.id)) n.delete(c.id);
                        else if (n.size < crawlers.length - 1) n.add(c.id);
                        return n;
                      })
                    }
                    className={cn(
                      "inline-flex h-7 items-center gap-1.5 rounded-lg px-2 t-caption-medium transition-[color,background-color,box-shadow] duration-150",
                      off ? "text-ink-3 hover:text-ink-2" : "bg-surface text-ink shadow-control-soft",
                    )}
                  >
                    <span className="size-2.5 rounded-[3px]" style={{ background: off ? "var(--bg-muted)" : c.color }} />
                    {c.label}
                  </button>
                );
              })}
            </div>
            {chart === "line" ? (
              <LineChart
                labels={days14}
                series={series.map((c, i) => ({ id: c.id, label: c.label, values: c.values, color: c.color, emphasis: i === 0 }))}
                height={232}
                yMin={0}
              />
            ) : (
              <BarChart labels={days14} series={series.map((c) => ({ label: c.label, values: c.values, color: c.color }))} height={232} />
            )}
          </CardPanel>
        </Card>

        <Card>
          <CardHeader title="By crawler" description="Share of requests and robots.txt access" />
          <CardPanel flush className="px-4">
            {crawlers.map((c) => {
              const sum = c.values.reduce((a, b) => a + b, 0);
              return (
                <div key={c.id} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
                  <ModelMark id={c.model} size={28} className="rounded-full" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="t-body-medium text-ink">{c.label}</span>
                      {c.id === "gpt" ? <Badge tone="red">Partly blocked</Badge> : <Badge tone="green">Allowed</Badge>}
                    </div>
                    <div className="t-caption text-ink-3">
                      <span className="t-num-sm">{fmt.int(sum)}</span> requests · {Math.round((sum / totalVisits) * 100)}%
                    </div>
                  </div>
                  <Sparkline values={c.values} color={c.color} width={64} height={22} />
                  <DeltaText value={fmt.signedPct(c.delta)} good className="w-12 text-right" />
                </div>
              );
            })}
          </CardPanel>
          <CardFooter>
            <span>Blocked paths for GPTBot</span>
            <button type="button" onClick={() => nav("/issues")} className="inline-flex items-center gap-1 t-num text-danger hover:underline">
              12 pages <ArrowRight className="size-3.5" />
            </button>
          </CardFooter>
        </Card>
      </PageSection>

      {/* Pages table */}
      <PageSection>
        <Card>
          <CardHeader
            icon={<Browsers weight="fill" />}
            tile="ink"
            title={
              <>
                Pages <CountChip>{fmt.int(SITEMAP_TOTAL)}</CountChip>
              </>
            }
            description="Every URL in your sitemap, scored for crawlers and answer engines"
          />
          <CardPanel flush className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
              <SearchInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${fmt.int(SITEMAP_TOTAL)} pages…`}
                wrapperClassName="w-full sm:w-72"
              />
              <Segmented
                size="xs"
                value={view}
                onChange={setView}
                options={[
                  { value: "all", label: "All", count: rows.length },
                  { value: "audited", label: "Audited", count: audited.length },
                  { value: "never", label: "Not audited", count: neverCount },
                ]}
              />
              <span className="flex-1" />
              {selected.size > 0 && (
                <button type="button" onClick={() => setSelected(new Set())} className="t-caption-medium text-ink-2 hover:text-ink">
                  Clear selection
                </button>
              )}
              <Button variant="outlined" tone="secondary" iconLeft={<TreeStructure className="size-4" />} onClick={() => setSitemapOpen(true)}>
                Edit sitemap
              </Button>
              <Button iconLeft={<FileMagnifyingGlass className="size-4" />} loading={progress !== null} onClick={runAudit}>
                {progress !== null ? `Auditing… ${Math.round(progress)}%` : auditLabel}
              </Button>
            </div>
            {progress !== null && (
              <div className="flex items-center gap-3 border-b border-line bg-canvas px-4 py-2">
                <span className="t-caption text-ink-2">Crawling as GPTBot, PerplexityBot and ClaudeBot…</span>
                <Progress value={progress} tone="blue" className="flex-1" />
                <span className="w-10 text-right t-num-sm text-ink-2">{Math.round(progress)}%</span>
              </div>
            )}

            {visible.length === 0 ? (
              <EmptyState
                icon={<MagnifyingGlass />}
                title="No pages match"
                description={`Nothing in your sitemap matches “${query}”. Try a path like /blog or /docs.`}
                action={
                  <Button
                    variant="outlined"
                    tone="secondary"
                    onClick={() => {
                      setQuery("");
                      setView("all");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <div className="p-2">
                <Table className="min-w-[860px]">
                  <THead>
                    <tr>
                      <Th className="w-9 pr-0">
                        <Checkbox checked={allChecked} indeterminate={!allChecked && someChecked} onChange={toggleAll} />
                      </Th>
                      <Th className="w-10">#</Th>
                      <Th>Page URL</Th>
                      <Th align="right" sort={sortOf("issues")} onSort={() => toggleSort("issues")}>
                        Issues
                      </Th>
                      <Th align="right" sort={sortOf("visitors")} onSort={() => toggleSort("visitors")}>
                        Visitors
                      </Th>
                      <Th sort={sortOf("technical")} onSort={() => toggleSort("technical")}>
                        Technical
                      </Th>
                      <Th sort={sortOf("aeo")} onSort={() => toggleSort("aeo")}>
                        AEO
                      </Th>
                      <Th>Last audited</Th>
                      <Th className="w-8" />
                    </tr>
                  </THead>
                  <tbody>
                    {visible.map((r, i) => {
                      const never = r.audited === "Never";
                      return (
                        <Tr
                          key={r.url}
                          interactive
                          selected={selected.has(r.url)}
                          onClick={() => nav(`/site-health/page?url=${encodeURIComponent(r.url)}`)}
                        >
                          <Td className="pr-0" onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={selected.has(r.url)} onChange={() => toggleOne(r.url)} />
                          </Td>
                          <Td className="t-num-sm text-ink-3">{i + 1}</Td>
                          <Td className="max-w-[340px]">
                            <div className="flex items-center gap-2">
                              <span className="truncate t-body-medium">{r.title}</span>
                              {r.tag && <Badge tone={r.tag === "Homepage" ? "blue" : "neutral"}>{r.tag}</Badge>}
                            </div>
                            <div className="truncate font-mono text-[12px] text-ink-3">lumen.so{r.url}</div>
                          </Td>
                          <Td align="right">
                            {r.auditing ? (
                              <Skeleton className="ml-auto h-5 w-8" />
                            ) : never ? (
                              <span className="t-num text-ink-3">—</span>
                            ) : r.issues > 0 ? (
                              <span className="inline-grid h-5 min-w-6 place-items-center rounded-md bg-danger-subtle px-1.5 t-num-sm-medium text-danger">{r.issues}</span>
                            ) : (
                              <span className="inline-grid h-5 min-w-6 place-items-center rounded-md bg-success-subtle px-1.5 t-num-sm-medium text-success">0</span>
                            )}
                          </Td>
                          <Td align="right" className={cn("t-num", never && "text-ink-3")}>
                            {r.auditing ? <Skeleton className="ml-auto h-4 w-14" /> : never ? "—" : fmt.int(r.visitors)}
                          </Td>
                          <Td>{r.auditing ? <Skeleton className="h-4 w-14" /> : <ScoreCell value={r.technical} audited={!never} />}</Td>
                          <Td>{r.auditing ? <Skeleton className="h-4 w-14" /> : <ScoreCell value={r.aeo} audited={!never} />}</Td>
                          <Td className={cn("whitespace-nowrap t-caption", never ? "text-ink-3" : r.audited === "Just now" ? "text-success" : "text-ink-2")}>
                            {r.auditing ? (
                              <span className="inline-flex items-center gap-1.5 text-brand">
                                <span className="size-1.5 animate-[sy-pulse_1s_ease-in-out_infinite] rounded-full bg-[var(--blue-500)]" />
                                Auditing
                              </span>
                            ) : (
                              r.audited
                            )}
                          </Td>
                          <Td className="pl-0 text-icon-subtle">
                            <CaretRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                          </Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </CardPanel>
          <CardFooter className="t-caption font-normal text-ink-2">
            <span>
              Showing <span className="t-num-sm text-ink">{visible.length}</span> of <span className="t-num-sm text-ink">{fmt.int(SITEMAP_TOTAL)}</span> pages · sorted by {sort.key}
            </span>
            <span className="hidden sm:inline">Scores refresh after every audit</span>
          </CardFooter>
        </Card>
      </PageSection>

      <SitemapDialog open={sitemapOpen} onClose={() => setSitemapOpen(false)} />
    </>
  );
}

function SitemapDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [url, setUrl] = useState("https://lumen.so/sitemap.xml");
  const [exclude, setExclude] = useState("/app/*\n/admin/*\n/legal/*");
  const [auto, setAuto] = useState(true);
  const [js, setJs] = useState(false);
  const [saving, setSaving] = useState(false);
  const invalid = !/^https?:\/\/.+\.xml$/.test(url.trim());
  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onClose();
      toast({ title: "Sitemap updated", description: `${exclude.split("\n").filter(Boolean).length} exclusion rules · next crawl tonight at 02:00 UTC` });
    }, 700);
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit sitemap"
      description="Choose which URLs Sonya crawls and scores."
      footer={
        <>
          <Button variant="outlined" tone="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} disabled={invalid}>
            Save sitemap
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 p-5">
        <Field label="Sitemap URL" error={invalid ? "Enter a full URL ending in .xml" : undefined} hint={`${fmt.int(SITEMAP_TOTAL)} URLs found in the last crawl`}>
          <Input size="md" value={url} onChange={(e) => setUrl(e.target.value)} invalid={invalid} iconLeft={<TreeStructure />} />
        </Field>
        <Field label="Exclude paths" hint="One pattern per line. Wildcards (*) supported.">
          <Textarea rows={4} value={exclude} onChange={(e) => setExclude(e.target.value)} className="font-mono text-[13px]" />
        </Field>
        <div className="flex flex-col gap-3 rounded-xl bg-canvas p-3 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="t-body-medium text-ink">Discover new URLs automatically</div>
              <div className="t-caption text-ink-3">Add pages that appear in the sitemap between crawls.</div>
            </div>
            <Toggle checked={auto} onChange={setAuto} />
          </div>
          <div className="h-px bg-line" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 t-body-medium text-ink">
                Render JavaScript <Badge tone="purple">Beta</Badge>
              </div>
              <div className="t-caption text-ink-3">Slower. Most AI crawlers don’t execute JS, so scores use raw HTML.</div>
            </div>
            <Toggle checked={js} onChange={setJs} />
          </div>
        </div>
        <div className="flex items-start gap-2 t-caption text-ink-2">
          <PencilSimple className="mt-0.5 size-3.5 shrink-0 text-icon" />
          Changes apply from the next scheduled crawl. Run an audit from the Pages table to score pages right away.
        </div>
      </div>
    </Dialog>
  );
}
