import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowClockwise,
  ArrowSquareOut,
  BracketsCurly,
  CaretDown,
  CheckCircle,
  Eye,
  FileMagnifyingGlass,
  Gauge,
  Quotes,
  Robot,
  Sparkle,
  XCircle,
} from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardPanel,
  CountChip,
  EmptyState,
  ModelMark,
  ScoreRing,
  Segmented,
  StatusPill,
  useToast,
  type ModelId,
  type TileColor,
} from "@/components/ui";
import { PageHeader, PageSection } from "@/components/shell/PageHeader";
import { sitePages } from "@/data/mock";
import { cn, fmt } from "@/lib/cn";
import { FixGuideBody, hashInt, ImpactBadge, issuesForPage, SeverityPill, severityMeta, type Severity } from "./siteShared";

const summaries: Record<string, string> = {
  "/": "Lumen is a product analytics platform for B2B SaaS teams. It offers funnels, retention cohorts and account-level reporting, with no-code event tracking so product managers can define events without engineering help.",
  "/pricing":
    "Lumen offers three plans: Free (up to 10k monthly tracked users), Growth and Enterprise. Pricing details are loaded by a script, so the plan prices were not visible in the raw HTML the crawler received.",
  "/compare/orbit": "A side-by-side comparison of Lumen and Orbit covering funnels, session replay, pricing per seat and data warehouse support. It concludes Lumen is better suited to account-based B2B analytics.",
  "/blog/activation-rate": "Activation rate is the share of new users who reach a defined ‘aha’ moment within a time window. The guide gives the formula, 2026 benchmarks by category and examples of activation events.",
  "/docs/retention": "Documentation for building retention cohorts in Lumen: choosing a start event, return event and interval, and reading N-day versus unbounded retention charts.",
  "/security": "Lumen is SOC 2 Type II certified and GDPR compliant. EU customer data is hosted in Frankfurt; a DPA is available on request.",
};

const entitySets: Record<string, { name: string; type: string }[]> = {
  "/pricing": [
    { name: "Lumen", type: "Organization" },
    { name: "Growth plan", type: "Product" },
    { name: "Enterprise plan", type: "Product" },
    { name: "Monthly tracked users", type: "Concept" },
    { name: "SSO", type: "Feature" },
  ],
};
const defaultEntities = [
  { name: "Lumen", type: "Organization" },
  { name: "Product analytics", type: "Category" },
  { name: "Orbit", type: "Competitor" },
  { name: "Retention cohort", type: "Concept" },
  { name: "B2B SaaS", type: "Audience" },
];

const bots: { label: string; model: ModelId }[] = [
  { label: "GPTBot", model: "chatgpt" },
  { label: "PerplexityBot", model: "perplexity" },
  { label: "Google-Extended", model: "gemini" },
  { label: "ClaudeBot", model: "claude" },
];

export default function PageDetail() {
  const nav = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const base = sitePages.find((p) => p.url === params.get("url")) ?? sitePages[1];

  const [page, setPage] = useState(base);
  const [auditing, setAuditing] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [sev, setSev] = useState<"all" | Severity>("all");
  const [fixed, setFixed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPage(base);
    setFixed(new Set());
    setOpen(null);
  }, [base]);

  const never = page.audited === "Never";
  const pageIssues = useMemo(() => issuesForPage(page), [page]);
  const openIssues = pageIssues.filter((i) => !fixed.has(i.key));
  const shown = openIssues.filter((i) => sev === "all" || i.severity === sev);
  const counts = (s: Severity) => openIssues.filter((i) => i.severity === s).length;
  const crawl = never ? 0 : Math.min(98, Math.round((page.technical + page.aeo) / 2) + hashInt(page.url, 4, 14));
  const gptBlocked = pageIssues.some((i) => i.issueId === "i2") && !fixed.has(pageIssues.find((i) => i.issueId === "i2")!.key);

  const reaudit = () => {
    setAuditing(true);
    setTimeout(() => {
      setAuditing(false);
      setPage((p) =>
        p.audited === "Never"
          ? { ...p, audited: "Just now", technical: hashInt(p.url, 58, 92), aeo: hashInt(p.url + "a", 40, 84), issues: hashInt(p.url + "i", 2, 6), visitors: hashInt(p.url + "v", 900, 7400) }
          : { ...p, audited: "Just now", technical: Math.min(99, p.technical + 2), aeo: Math.min(99, p.aeo + fixed.size * 3 + 1), issues: Math.max(0, p.issues - fixed.size) },
      );
      setFixed(new Set());
      toast({ title: never ? "Page audited" : "Re-audit complete", description: `lumen.so${page.url} · scores updated` });
    }, 1400);
  };

  const summary = summaries[page.url] ?? `${page.title}. The crawler extracted the main heading and two paragraphs, but no clear one-sentence answer that an engine could quote directly.`;
  const entities = entitySets[page.url] ?? defaultEntities;
  const schema = [
    { name: "Organization", ok: true },
    { name: "WebPage", ok: true },
    { name: "BreadcrumbList", ok: page.url !== "/" },
    { name: "Product / Offer", ok: !pageIssues.some((i) => i.issueId === "i1") },
    { name: "FAQPage", ok: !pageIssues.some((i) => i.issueId === "i6") },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Site Health", to: "/site-health" }]}
        title={<span className="font-mono text-[17px]">{page.url}</span>}
        badge={page.tag ? <Badge tone={page.tag === "Homepage" ? "blue" : "neutral"}>{page.tag}</Badge> : undefined}
        actions={
          <>
            <a
              href={`https://lumen.so${page.url}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-surface px-3 t-label text-ink-2 shadow-control-soft transition-colors hover:bg-canvas hover:text-ink"
            >
              <ArrowSquareOut className="size-4" />
              Open page
            </a>
            <Button iconLeft={<ArrowClockwise className="size-4" />} loading={auditing} onClick={reaudit}>
              {auditing ? "Auditing…" : never ? "Audit page" : "Re-audit"}
            </Button>
          </>
        }
      />

      {/* Page summary */}
      <PageSection className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="min-w-0">
            <div className="t-heading text-ink">{page.title}</div>
            <div className="mt-1 font-mono text-[12px] text-ink-3">https://lumen.so{page.url}</div>
          </div>
          <span className="flex-1" />
          {never ? (
            <StatusPill tone="neutral">Never audited</StatusPill>
          ) : (
            <StatusPill tone={page.audited === "Just now" ? "success" : "neutral"} dot>
              Audited {page.audited.toLowerCase()}
            </StatusPill>
          )}
          {!never && (
            <span className="t-caption text-ink-2">
              <span className="t-num-sm text-ink">{fmt.int(page.visitors)}</span> visitors · 30d
            </span>
          )}
        </div>

        {never && !auditing ? (
          <Card>
            <CardPanel>
              <EmptyState
                icon={<FileMagnifyingGlass />}
                title="This page hasn’t been audited yet"
                description="Run an audit to see how GPTBot, PerplexityBot and ClaudeBot read this page, and what's holding it back from being cited."
                action={
                  <Button variant="outlined" tone="secondary" iconLeft={<FileMagnifyingGlass className="size-4" />} onClick={reaudit}>
                    Audit page
                  </Button>
                }
              />
            </CardPanel>
          </Card>
        ) : (
          <div className={cn("grid grid-cols-1 gap-3 md:grid-cols-3", auditing && "animate-[sy-pulse_1.2s_ease-in-out_infinite]")}>
            <ScoreCard
              label="Technical"
              icon={<Gauge weight="fill" />}
              tile="blue"
              value={page.technical}
              lines={[
                ["LCP", page.technical > 80 ? "1.8s" : "3.1s", page.technical > 80],
                ["Mobile friendly", "Yes", true],
                ["Raw HTML words", page.technical > 80 ? "1,184" : "38", page.technical > 80],
              ]}
            />
            <ScoreCard
              label="AEO"
              icon={<Sparkle weight="fill" />}
              tile="orange"
              value={page.aeo}
              lines={[
                ["Direct answer up top", page.aeo > 70 ? "Yes" : "No", page.aeo > 70],
                ["Structured data", `${schema.filter((s) => s.ok).length} of ${schema.length}`, schema.every((s) => s.ok)],
                ["Cited by engines", page.aeo > 70 ? "4 models" : "1 model", page.aeo > 70],
              ]}
            />
            <Card>
              <CardHeader icon={<Robot weight="fill" />} tile="green" title={<span className="t-label">Crawlability</span>} className="min-h-0 py-2.5" />
              <CardPanel className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <ScoreRing value={crawl} size={44} stroke={5} />
                  <div className="flex items-baseline gap-1">
                    <span className="t-num-lg text-ink">{crawl}</span>
                    <span className="t-caption text-ink-3">/ 100</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {bots.map((b) => {
                    const ok = !(b.model === "chatgpt" && gptBlocked);
                    return (
                      <div key={b.label} className="flex items-center gap-1.5 rounded-lg bg-canvas px-2 py-1.5">
                        <ModelMark id={b.model} size={16} className="rounded-full" />
                        <span className="min-w-0 flex-1 truncate t-caption text-ink-2">{b.label}</span>
                        {ok ? <CheckCircle weight="fill" className="size-3.5 text-success" /> : <XCircle weight="fill" className="size-3.5 text-danger" />}
                      </div>
                    );
                  })}
                </div>
              </CardPanel>
            </Card>
          </div>
        )}
      </PageSection>

      {!never && (
        <PageSection className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,8fr)_minmax(0,5fr)]">
          {/* Issues */}
          <Card>
            <CardHeader
              title={
                <>
                  Issues on this page <CountChip>{openIssues.length}</CountChip>
                </>
              }
              description="Sorted by severity · expand a row for the fix"
              actions={
                <Segmented
                  size="xs"
                  value={sev}
                  onChange={setSev}
                  options={[
                    { value: "all", label: "All" },
                    { value: "critical", label: "Critical", count: counts("critical") },
                    { value: "warning", label: "Warning", count: counts("warning") },
                    { value: "notice", label: "Notice", count: counts("notice") },
                  ]}
                />
              }
            />
            <CardPanel flush>
              {shown.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle />}
                  title={openIssues.length ? "Nothing at this severity" : "No open issues"}
                  description={openIssues.length ? "Switch the filter to see the remaining issues." : "Re-audit to confirm the fixes and refresh scores."}
                  action={
                    !openIssues.length && (
                      <Button variant="outlined" tone="secondary" onClick={reaudit} loading={auditing}>
                        Re-audit
                      </Button>
                    )
                  }
                />
              ) : (
                shown.map((it) => {
                  const isOpen = open === it.key;
                  return (
                    <div key={it.key} className="border-b border-line last:border-b-0">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpen(isOpen ? null : it.key)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-canvas"
                      >
                        <span className="w-[84px] shrink-0">
                          <SeverityPill severity={it.severity} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate t-body-medium text-ink">{it.title}</span>
                          <span className="block truncate t-caption text-ink-3">{it.detail}</span>
                        </span>
                        <span className="hidden sm:inline-flex">
                          <ImpactBadge impact={it.impact} />
                        </span>
                        <span className="hidden items-center gap-1 t-caption-medium text-ink-2 md:inline-flex">How to fix</span>
                        <CaretDown className={cn("size-4 shrink-0 text-icon-subtle transition-transform duration-200", isOpen && "rotate-180")} />
                      </button>
                      {isOpen && (
                        <div className="animate-[sy-fade-in_160ms_ease-out] border-t border-line bg-canvas/60 px-4 py-4">
                          <FixGuideBody
                            issueId={it.issueId}
                            extra={
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="xs"
                                  variant="outlined"
                                  tone="secondary"
                                  iconLeft={<CheckCircle className="size-3.5" />}
                                  onClick={() => {
                                    setFixed((f) => new Set(f).add(it.key));
                                    setOpen(null);
                                    toast({
                                      title: "Marked as fixed",
                                      description: "Re-audit the page to confirm.",
                                      action: { label: "Undo", onClick: () => setFixed((f) => { const n = new Set(f); n.delete(it.key); return n; }) },
                                    });
                                  }}
                                >
                                  Mark fixed
                                </Button>
                                <Button size="xs" variant="link" tone="secondary" onClick={() => nav("/issues")}>
                                  See all {it.category.toLowerCase()} issues
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
            <CardFooter className="t-caption font-normal text-ink-2">
              <span className="inline-flex flex-wrap items-center gap-3">
                {(["critical", "warning", "notice"] as Severity[]).map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: severityMeta[s].color }} />
                    <span className="t-num-sm text-ink">{counts(s)}</span> {severityMeta[s].plural.toLowerCase()}
                  </span>
                ))}
              </span>
              {fixed.size > 0 && <span className="text-success">{fixed.size} fixed · re-audit to confirm</span>}
            </CardFooter>
          </Card>

          {/* How AI sees this page */}
          <Card>
            <CardHeader icon={<Eye weight="fill" />} tile="purple" title="How AI sees this page" description="What a crawler extracts from the raw HTML" />
            <CardPanel className="flex flex-col gap-5">
              <div>
                <SubLabel>Extracted summary</SubLabel>
                <div className="relative mt-2 rounded-xl bg-canvas p-3 pl-9">
                  <Quotes weight="fill" className="absolute left-3 top-3 size-4 text-icon-subtle" />
                  <p className="t-body text-ink">{summary}</p>
                </div>
                <div className="mt-2 flex items-center gap-1.5 t-caption text-ink-3">
                  {bots.slice(0, 3).map((b) => (
                    <ModelMark key={b.model} id={b.model} size={14} className="rounded-full" />
                  ))}
                  <span>Matches what 3 engines currently say about this page</span>
                </div>
              </div>

              <div>
                <SubLabel>Entities</SubLabel>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {entities.map((e) => (
                    <span key={e.name} className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-surface pl-2 pr-1 t-caption-medium text-ink shadow-control-soft">
                      {e.name}
                      <span className="rounded bg-subtle px-1 py-px t-micro text-ink-3">{e.type}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <SubLabel>Schema detected</SubLabel>
                <div className="mt-1">
                  {schema.map((s) => (
                    <div key={s.name} className="flex items-center gap-2 border-b border-line py-2 last:border-b-0">
                      <BracketsCurly className="size-4 text-icon" />
                      <span className="flex-1 t-body text-ink">{s.name}</span>
                      {s.ok ? (
                        <span className="inline-flex items-center gap-1 t-caption-medium text-success">
                          <CheckCircle weight="fill" className="size-3.5" /> Found
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 t-caption-medium text-danger">
                          <XCircle weight="fill" className="size-3.5" /> Missing
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SubLabel>Heading outline</SubLabel>
                <div className="mt-2 flex flex-col gap-1 font-mono text-[12px]">
                  <span className="text-ink">
                    <span className="text-ink-3">H1</span> {page.title}
                  </span>
                  <span className="pl-4 text-ink-2">
                    <span className="text-ink-3">H2</span> {page.url === "/pricing" ? "Compare plans" : "Overview"}
                  </span>
                  <span className="pl-4 text-ink-2">
                    <span className="text-ink-3">H2</span> Frequently asked questions
                  </span>
                </div>
              </div>
            </CardPanel>
          </Card>
        </PageSection>
      )}
    </>
  );
}

function SubLabel({ children }: { children: ReactNode }) {
  return <div className="t-caption-medium text-ink-2">{children}</div>;
}

function ScoreCard({
  label,
  icon,
  tile,
  value,
  lines,
}: {
  label: string;
  icon: ReactNode;
  tile: TileColor;
  value: number;
  lines: [string, string, boolean][];
}) {
  const verdict = value >= 80 ? { t: "Good", tone: "success" as const } : value >= 50 ? { t: "Needs work", tone: "warning" as const } : { t: "Poor", tone: "danger" as const };
  return (
    <Card>
      <CardHeader icon={icon} tile={tile} title={<span className="t-label">{label}</span>} meta={<StatusPill tone={verdict.tone}>{verdict.t}</StatusPill>} className="min-h-0 py-2" />
      <CardPanel className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <ScoreRing value={value} size={44} stroke={5} />
          <div className="flex items-baseline gap-1">
            <span className="t-num-lg text-ink">{value}</span>
            <span className="t-caption text-ink-3">/ 100</span>
          </div>
        </div>
        <div className="flex flex-col">
          {lines.map(([k, v, ok]) => (
            <div key={k} className="flex items-center gap-2 border-t border-line py-1.5 t-caption">
              <span className={cn("size-1.5 rounded-full", ok ? "dot-success" : "dot-warning")} />
              <span className="flex-1 text-ink-2">{k}</span>
              <span className="t-num-sm-medium text-ink">{v}</span>
            </div>
          ))}
        </div>
      </CardPanel>
    </Card>
  );
}
