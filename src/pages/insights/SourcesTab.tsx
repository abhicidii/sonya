import { useState } from "react";
import { ArrowSquareOut, Globe, MagnifyingGlass, Sparkle, X } from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardPanel,
  CountChip,
  DeltaText,
  DomainMark,
  EmptyState,
  IconButton,
  PillTabs,
  SearchInput,
  StatusPill,
  Table,
  Td,
  Th,
  THead,
  TickMeter,
  Tr,
} from "@/components/ui";
import { Donut, SplitBar } from "@/components/charts";
import { PageSection } from "@/components/shell/PageHeader";
import type { Filters } from "@/components/shell/FilterBar";
import { sources, sourceTypeColor, type SourceType } from "@/data/mock";
import { cn, fmt } from "@/lib/cn";
import { ColorBadge, Highlight, rand, scaleBy, selectedBrand, sortHeader, type SortDir } from "./_shared";

type SortKey = "used" | "citations" | "pages" | "delta";
const TYPES = Object.keys(sourceTypeColor) as SourceType[];
const TYPE_HINT: Record<SourceType, string> = {
  UGC: "Forums, video, social",
  Reference: "Review & listing sites",
  Competitor: "Competitor-owned pages",
  Editorial: "News, blogs, publications",
  Owned: "Your own domain",
  Institutional: "Wikis, .gov, .edu",
  Corporate: "Other company sites",
};

export default function SourcesTab({ filters }: { filters: Filters }) {
  const brand = selectedBrand(filters);
  const [type, setType] = useState<"all" | SourceType>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "used", dir: "desc" });
  const [selected, setSelected] = useState<string | null>(null);
  const th = sortHeader(sort, setSort);

  // A model filter shifts how often each domain gets used.
  const data = sources.map((s) => {
    const factor = filters.model === "all" ? 1 : 0.55 + rand(`${filters.model}-${s.domain}`) * 0.9;
    const domain = s.type === "Owned" ? brand.domain : s.domain;
    return { ...s, domain, used: Math.min(96, Math.round(s.used * factor)), pages: scaleBy(s.pages, filters.range) || 1 };
  });

  const byType = TYPES.map((t) => {
    const rows = data.filter((d) => d.type === t);
    return { type: t, domains: rows.length, used: rows.reduce((a, d) => a + d.used, 0) };
  }).filter((t) => t.domains > 0);
  const usedTotal = byType.reduce((a, t) => a + t.used, 0);

  const owned = byType.find((t) => t.type === "Owned")?.used ?? 0;
  const competitor = byType.find((t) => t.type === "Competitor")?.used ?? 0;
  const earned = usedTotal - owned - competitor;

  const q = query.trim().toLowerCase();
  const rows = data
    .filter((d) => type === "all" || d.type === type)
    .filter((d) => !q || d.domain.includes(q))
    .sort((a, b) => (sort.dir === "desc" ? b[sort.key] - a[sort.key] : a[sort.key] - b[sort.key]));
  const detail = data.find((d) => d.domain === selected) ?? null;

  return (
    <>
      <PageSection className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,9fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader title="Domain types" description="Share of answers that cite each kind of source · click to filter the table" />
          <CardPanel className="flex flex-col gap-4">
            <SplitBar height={12} parts={byType.map((t) => ({ value: t.used, color: sourceTypeColor[t.type], label: t.type }))} />
            <div className="flex flex-col">
              {[...byType]
                .sort((a, b) => b.used - a.used)
                .map((t) => {
                  const share = (t.used / usedTotal) * 100;
                  const on = type === t.type;
                  return (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setType(on ? "all" : t.type)}
                      aria-pressed={on}
                      className={cn(
                        "-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors",
                        on ? "bg-canvas shadow-control-soft" : "hover:bg-canvas/60",
                      )}
                    >
                      <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: sourceTypeColor[t.type] }} />
                      <div className="w-36 min-w-0 shrink-0">
                        <div className="t-body-medium text-ink">{t.type}</div>
                        <div className="truncate t-caption text-ink-3">{TYPE_HINT[t.type]}</div>
                      </div>
                      <div className="flex-1">
                        <div className="relative h-2 overflow-hidden rounded-[3px] bg-subtle">
                          <div
                            className="absolute inset-y-0 left-0 rounded-[3px] transition-[width] duration-500 ease-out"
                            style={{
                              width: `${(share / Math.max(...byType.map((x) => (x.used / usedTotal) * 100))) * 100}%`,
                              background: sourceTypeColor[t.type],
                            }}
                          />
                        </div>
                      </div>
                      <span className="w-12 text-right t-num-sm-medium text-ink">{share.toFixed(1)}%</span>
                      <span className="hidden w-20 text-right t-caption text-ink-3 sm:block">
                        {t.domains} {t.domains === 1 ? "domain" : "domains"}
                      </span>
                    </button>
                  );
                })}
            </div>
          </CardPanel>
        </Card>

        <Card>
          <CardHeader title="Owned vs earned" description="Who supplies the pages AI cites" />
          <CardPanel className="flex flex-col items-center gap-5">
            <Donut
              size={188}
              data={[
                { label: "Owned", value: owned, color: sourceTypeColor.Owned },
                { label: "Earned", value: earned, color: "var(--data-1)" },
                { label: "Competitor", value: competitor, color: sourceTypeColor.Competitor },
              ]}
              center={
                <div>
                  <div className="t-num-lg text-ink">{((owned / usedTotal) * 100).toFixed(1)}%</div>
                  <div className="t-caption text-ink-2">owned</div>
                </div>
              }
            />
            <div className="w-full">
              {[
                { label: "Owned", sub: brand.domain, value: owned, color: sourceTypeColor.Owned },
                { label: "Earned", sub: "Third-party coverage", value: earned, color: "var(--data-1)" },
                { label: "Competitor", sub: "Rival domains", value: competitor, color: sourceTypeColor.Competitor },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-2.5 border-b border-line py-2.5 last:border-b-0">
                  <span className="size-2.5 rounded-[3px]" style={{ background: r.color }} />
                  <span className="t-body-medium text-ink">{r.label}</span>
                  <span className="flex-1 truncate t-caption text-ink-3">{r.sub}</span>
                  <span className="t-num-sm-medium text-ink">{((r.value / usedTotal) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardPanel>
        </Card>
      </PageSection>

      <PageSection className={cn("grid grid-cols-1 gap-4", detail && "xl:grid-cols-[minmax(0,9fr)_minmax(0,4fr)]")}>
        <Card>
          <CardHeader
            title={
              <>
                Top domains <CountChip>{rows.length}</CountChip>
              </>
            }
            description="Domains cited in answers to your prompts · click a row for details"
          />
          <CardPanel flush>
            <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
              <PillTabs
                value={type}
                onChange={setType}
                options={[
                  { value: "all" as const, label: "All", count: data.length },
                  ...byType.map((t) => ({ value: t.type, label: t.type, count: t.domains })),
                ]}
              />
              <span className="flex-1" />
              <SearchInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search domains…"
                wrapperClassName="w-full sm:w-56"
                aria-label="Search domains"
              />
            </div>
            {rows.length === 0 ? (
              <EmptyState
                icon={<MagnifyingGlass />}
                title="No domains found"
                description="Nothing matches this search and type."
                action={
                  <Button variant="outlined" tone="secondary" onClick={() => (setQuery(""), setType("all"))}>
                    Reset filters
                  </Button>
                }
              />
            ) : (
              <div className="p-2">
                <Table className="min-w-[720px]">
                  <THead>
                    <tr>
                      <Th className="w-10">#</Th>
                      <Th>Domain</Th>
                      <Th>Type</Th>
                      <Th {...th("used")}>Used</Th>
                      <Th align="right" {...th("citations")}>
                        Avg. citations
                      </Th>
                      <Th align="right" {...th("pages")}>
                        Pages
                      </Th>
                      <Th align="right" {...th("delta")}>
                        Change
                      </Th>
                    </tr>
                  </THead>
                  <tbody>
                    {rows.map((d, i) => (
                      <Tr key={d.domain} interactive selected={d.domain === selected} onClick={() => setSelected(d.domain === selected ? null : d.domain)}>
                        <Td className="t-num-sm text-ink-3">{i + 1}</Td>
                        <Td>
                          <span className="flex items-center gap-2">
                            <DomainMark domain={d.domain} size={20} />
                            <span className="t-body-medium">
                              <Highlight text={d.domain} query={query} />
                            </span>
                            {d.type === "Owned" && <Badge tone="inverse">You</Badge>}
                          </span>
                        </Td>
                        <Td>
                          <ColorBadge color={sourceTypeColor[d.type]}>{d.type}</ColorBadge>
                        </Td>
                        <Td>
                          <span className="flex items-center gap-3">
                            <TickMeter value={d.used} className="w-24" color={sourceTypeColor[d.type]} />
                            <span className="t-num">{d.used}%</span>
                          </span>
                        </Td>
                        <Td align="right" className="t-num">
                          {d.citations.toFixed(1)}
                        </Td>
                        <Td align="right" className="t-num text-ink-2">
                          {fmt.int(d.pages)}
                        </Td>
                        <Td align="right">
                          <DeltaText value={d.delta === 0 ? "0.0" : fmt.signed(d.delta)} good={d.delta === 0 ? null : d.delta > 0} />
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </CardPanel>
        </Card>

        {detail && (
          <Card className="self-start animate-[sy-pop-in_180ms_var(--ease-out)]">
            <CardHeader
              icon={<DomainMark domain={detail.domain} size={20} />}
              title={detail.domain}
              description={TYPE_HINT[detail.type]}
              actions={
                <IconButton label="Close details" size="xs" variant="link" onClick={() => setSelected(null)}>
                  <X className="size-3.5" />
                </IconButton>
              }
            />
            <CardPanel className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Used in answers" value={`${detail.used}%`} />
                <Stat label="Avg. citations" value={detail.citations.toFixed(1)} />
                <Stat label="Pages cited" value={fmt.int(detail.pages)} />
                <Stat label="Change" value={fmt.signed(detail.delta)} tone={detail.delta > 0 ? "up" : detail.delta < 0 ? "down" : undefined} />
              </div>
              <div>
                <div className="mb-2 t-caption-medium text-ink-2">Most cited pages</div>
                {["/best-product-analytics", "/reviews/2026", "/compare"].map((path, i) => (
                  <div key={path} className="flex items-center gap-2 border-b border-line py-2 last:border-b-0">
                    <Globe className="size-3.5 shrink-0 text-icon-muted" />
                    <span className="flex-1 truncate t-caption text-ink">
                      {detail.domain}
                      {path}
                    </span>
                    <span className="t-num-sm text-ink-3">{Math.max(1, Math.round(detail.pages / (i + 2)))}</span>
                  </div>
                ))}
              </div>
              {detail.type !== "Owned" && (
                <div className="flex items-start gap-2 rounded-lg bg-canvas p-3 t-caption text-ink-2">
                  <Sparkle weight="fill" className="mt-0.5 size-3.5 shrink-0 text-brand" />
                  <span>
                    {detail.type === "Competitor"
                      ? `${detail.domain} is cited for comparison prompts. A head-to-head page on ${brand.domain} can take those citations.`
                      : `Getting ${brand.name} mentioned on ${detail.domain} would reach ${detail.used}% of answers for your prompts.`}
                  </span>
                </div>
              )}
            </CardPanel>
            <CardFooter>
              <StatusPill tone={detail.delta >= 0 ? "success" : "warning"}>{detail.delta >= 0 ? "Gaining citations" : "Losing citations"}</StatusPill>
              <Button
                size="xs"
                variant="link"
                tone="secondary"
                iconRight={<ArrowSquareOut className="size-3.5" />}
                onClick={() => window.open(`https://${detail.domain}`, "_blank", "noopener")}
              >
                Visit
              </Button>
            </CardFooter>
          </Card>
        )}
      </PageSection>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded-lg bg-canvas p-3">
      <div className="t-caption text-ink-2">{label}</div>
      <div className={cn("mt-1 t-num", tone === "up" ? "text-success" : tone === "down" ? "text-danger" : "text-ink")}>{value}</div>
    </div>
  );
}
