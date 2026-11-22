import { useState } from "react";
import { ChartBar, DownloadSimple, CursorClick, GoogleLogo, Info, MagnifyingGlass, Percent, UserPlus, X } from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardPanel,
  CountChip,
  DeltaText,
  EmptyState,
  IconButton,
  KpiCard,
  ModelMark,
  MODELS,
  SearchInput,
  Segmented,
  StatusPill,
  Table,
  Td,
  Th,
  THead,
  Tile,
  TickMeter,
  Tr,
  useToast,
  type ModelId,
} from "@/components/ui";
import { BarChart, Legend, Sparkline } from "@/components/charts";
import { FilterBar, useFilters } from "@/components/shell/FilterBar";
import { PageHeader, PageSection } from "@/components/shell/PageHeader";
import { traffic, trafficDays } from "@/data/mock";
import { cn, fmt } from "@/lib/cn";
import { downloadCsv, Highlight, rand, RANGE_LABEL, RANGE_SCALE, sortHeader, walk, type SortDir } from "@/pages/insights/_shared";

type Metric = "sessions" | "signups";
type SortKey = "sessions" | "signups" | "conv" | "delta";

const TRAFFIC_MODELS = Object.keys(traffic.byModel) as ModelId[];
const CONV: Partial<Record<ModelId, number>> = { chatgpt: 3.1, perplexity: 4.2, gemini: 2.6, claude: 3.8 };

/** Landing pages beyond the five in the mock, so the table can paginate/search. */
const moreLanding = [
  { path: "/blog/plg-metrics", sessions: 1210, signups: 38, model: "claude" as ModelId, delta: 22 },
  { path: "/security", sessions: 880, signups: 19, model: "perplexity" as ModelId, delta: 4 },
  { path: "/integrations/snowflake", sessions: 640, signups: 31, model: "chatgpt" as ModelId, delta: 46 },
];

export default function TrafficPage() {
  const toast = useToast();
  const [filters, setFilters] = useFilters();
  const [metric, setMetric] = useState<Metric>("sessions");
  const [banner, setBanner] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "sessions", dir: "desc" });
  const th = sortHeader(sort, setSort);

  // Mock covers 14 days; KPIs default to 7. A single location keeps its share of sessions.
  const locShare = filters.location === "all" ? 1 : filters.location === "US" ? 0.48 : 0.05 + rand(`loc-${filters.location}`) * 0.12;
  const scale = ((RANGE_SCALE[filters.range] ?? 1) / 2) * locShare;
  const model = filters.model;
  const noData = model !== "all" && !TRAFFIC_MODELS.includes(model);
  const shown = model === "all" ? TRAFFIC_MODELS : TRAFFIC_MODELS.filter((m) => m === model);

  const series = shown.map((m) => {
    const sessions = traffic.byModel[m] ?? [];
    return {
      label: MODELS[m].name,
      color: MODELS[m].color,
      values: (metric === "sessions" ? sessions : sessions.map((v) => (v * (CONV[m] ?? 3)) / 100)).map((v) => Math.round(v * locShare)),
    };
  });

  const modelTotal = (m: ModelId) => (traffic.byModel[m] ?? []).reduce((a, v) => a + v, 0);
  const grand = TRAFFIC_MODELS.reduce((a, m) => a + modelTotal(m), 0);
  const share = model === "all" ? 1 : noData ? 0 : modelTotal(model) / grand;
  const sessions = Math.round(traffic.sessions * scale * share);
  const signups = Math.round(traffic.signups * scale * share);
  const conversion = sessions ? (signups / sessions) * 100 : 0;

  const q = query.trim().toLowerCase();
  const landing = [...traffic.landing, ...moreLanding]
    .filter((l) => model === "all" || l.model === model)
    .filter((l) => !q || l.path.includes(q))
    .map((l) => ({ ...l, sessions: Math.round(l.sessions * scale), signups: Math.round(l.signups * scale), conv: (l.signups / l.sessions) * 100 }))
    .sort((a, b) => (sort.dir === "desc" ? b[sort.key] - a[sort.key] : a[sort.key] - b[sort.key]));
  const maxSessions = Math.max(1, ...landing.map((l) => l.sessions));

  const connect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setBanner(false);
      toast({ title: "Google Search Console connected", description: "Importing 16 months of query data — this takes a few minutes." });
    }, 1400);
  };

  const dismiss = () => {
    setBanner(false);
    toast({
      title: "Reminder hidden",
      description: "You can connect Search Console any time from Settings → Integrations.",
      tone: "info",
      action: { label: "Undo", onClick: () => setBanner(true) },
    });
  };

  const exportCsv = () => {
    downloadCsv("ai-referral-landing-pages.csv", [
      ["Path", "Top model", "Sessions", "Signups", "Conversion %", "Change %"],
      ...landing.map((l) => [l.path, MODELS[l.model].name, l.sessions, l.signups, l.conv.toFixed(1), l.delta]),
    ]);
    toast({ title: `Exported ${landing.length} landing pages` });
  };

  return (
    <>
      <PageHeader
        title="Traffic"
        badge={<Badge tone="blue">AI referrals</Badge>}
        actions={
          <Button iconLeft={<DownloadSimple weight="bold" className="size-4" />} onClick={exportCsv}>
            Export
          </Button>
        }
      />
      <div className="border-b border-line px-5 py-3">
        <FilterBar value={filters} onChange={setFilters} show={["range", "model", "location"]} />
      </div>

      {banner && (
        <PageSection>
          <div className="flex flex-col gap-4 rounded-2xl bg-canvas p-4 shadow-card animate-[sy-fade-in_200ms_ease-out] sm:flex-row sm:items-center">
            <Tile color="blue" size="xl">
              <GoogleLogo weight="bold" />
            </Tile>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="t-heading text-ink">Connect Google Search Console</span>
                <StatusPill tone="warning">Setup 2 of 3</StatusPill>
              </div>
              <p className="mt-1 max-w-2xl t-body text-ink-2">
                See which AI Overview and search queries send visitors to your site, alongside AI-assistant referrals. Read-only access — we never change your
                property.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outlined" tone="secondary" onClick={dismiss}>
                Not now
              </Button>
              <Button loading={connecting} onClick={connect}>
                {connecting ? "Connecting…" : "Connect"}
              </Button>
              <IconButton label="Dismiss" size="xs" variant="link" onClick={dismiss} className="hidden sm:inline-grid">
                <X className="size-3.5" />
              </IconButton>
            </div>
          </div>
        </PageSection>
      )}

      <PageSection className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="success">Tracking script active</StatusPill>
          <span className="t-caption text-ink-3">{RANGE_LABEL[filters.range]} · sessions referred by AI assistants</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="AI sessions"
            icon={<CursorClick weight="fill" />}
            tile="blue"
            prior="vs 15,050"
            value={fmt.int(sessions)}
            unit="visits"
            delta={{ value: fmt.signedPct(traffic.sessionsDelta), direction: "up" }}
          />
          <KpiCard
            label="Signups"
            icon={<UserPlus weight="fill" />}
            tile="orange"
            prior="vs 536"
            value={fmt.int(signups)}
            unit="from AI"
            delta={{ value: fmt.signedPct(traffic.signupsDelta), direction: "up" }}
          />
          <KpiCard
            label="Conversion"
            icon={<Percent weight="bold" />}
            tile="green"
            prior="vs 3.7%"
            value={fmt.pct(conversion)}
            unit="session → signup"
            delta={{ value: fmt.signed(traffic.conversionDelta) + " pts", direction: "down" }}
          />
          <KpiCard
            label="Share of site traffic"
            icon={<ChartBar weight="fill" />}
            tile="pink"
            prior="vs 6.1%"
            value={fmt.pct(7.4 * share)}
            unit="of all sessions"
            delta={{ value: "+1.3 pts", direction: "up" }}
          />
        </div>
      </PageSection>

      <PageSection className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,9fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader
            title={metric === "sessions" ? "Sessions by model" : "Signups by model"}
            description="Daily visits referred by each AI assistant"
            actions={
              <Segmented
                size="xs"
                value={metric}
                onChange={setMetric}
                options={[
                  { value: "sessions", label: "Sessions" },
                  { value: "signups", label: "Signups" },
                ]}
              />
            }
          />
          <CardPanel className="flex flex-col gap-4">
            {noData ? (
              <EmptyState
                icon={<Info weight="duotone" />}
                title={`No referral data for ${MODELS[model as ModelId].name}`}
                description="This engine doesn’t pass a referrer, so its visits show up as direct traffic. Connect Search Console to attribute AI Overviews clicks."
              />
            ) : (
              <>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="t-num-lg text-ink">{fmt.int(series.reduce((a, s) => a + s.values.reduce((x, y) => x + y, 0), 0))}</span>
                  <span className="t-caption text-ink-2">{metric} in the last 14 days</span>
                </div>
                <Legend items={series.map((s) => ({ label: s.label, color: s.color }))} />
                <BarChart labels={trafficDays} series={series} height={232} format={(v) => fmt.int(v)} />
              </>
            )}
          </CardPanel>
        </Card>

        <Card>
          <CardHeader title="By assistant" description="Sessions, signups and conversion" />
          <CardPanel flush className="px-4">
            {TRAFFIC_MODELS.map((m) => {
              const total = modelTotal(m);
              return (
                <div
                  key={m}
                  className={cn(
                    "flex items-center gap-3 border-b border-line py-3 transition-opacity last:border-b-0",
                    model !== "all" && model !== m && "opacity-40",
                  )}
                >
                  <ModelMark id={m} size={28} className="rounded-full" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="t-body-medium text-ink">{MODELS[m].name}</span>
                      <span className="t-num text-ink">{fmt.int(total)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <TickMeter value={total} max={grand} color={MODELS[m].color} height={6} />
                      <span className="w-10 shrink-0 text-right t-num-sm text-ink-3">{((total / grand) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="mt-1 t-caption text-ink-3">
                      <span className="t-num-sm text-ink-2">{CONV[m]?.toFixed(1)}%</span> conversion
                    </div>
                  </div>
                </div>
              );
            })}
          </CardPanel>
          <CardFooter>
            <span className="t-caption text-ink-2">Best converting</span>
            <span className="flex items-center gap-1.5 t-caption-medium text-ink">
              <ModelMark id="perplexity" size={14} className="rounded-full" /> Perplexity · <span className="t-num-sm-medium text-success">4.2%</span>
            </span>
          </CardFooter>
        </Card>
      </PageSection>

      <PageSection>
        <Card>
          <CardHeader
            title={
              <>
                Landing pages <CountChip>{landing.length}</CountChip>
              </>
            }
            description="Where AI-referred visitors arrive"
            actions={
              <SearchInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search paths…"
                wrapperClassName="hidden w-56 sm:flex"
                aria-label="Search landing pages"
              />
            }
          />
          <CardPanel flush className="p-2">
            {landing.length === 0 ? (
              <EmptyState icon={<MagnifyingGlass />} title="No landing pages" description="Nothing matches this search and model." />
            ) : (
              <Table className="min-w-[760px]">
                <THead>
                  <tr>
                    <Th>Page</Th>
                    <Th>Top referrer</Th>
                    <Th {...th("sessions")}>Sessions</Th>
                    <Th align="right" {...th("signups")}>
                      Signups
                    </Th>
                    <Th align="right" {...th("conv")}>
                      Conv.
                    </Th>
                    <Th align="right">Trend</Th>
                    <Th align="right" {...th("delta")}>
                      Change
                    </Th>
                  </tr>
                </THead>
                <tbody>
                  {landing.map((l) => (
                    <Tr key={l.path}>
                      <Td>
                        <span className="t-body-medium">
                          <Highlight text={l.path} query={query} />
                        </span>
                        <div className="t-caption text-ink-3">lumen.so{l.path === "/" ? "" : l.path}</div>
                      </Td>
                      <Td>
                        <span className="flex items-center gap-2">
                          <ModelMark id={l.model} size={18} className="rounded-full" />
                          <span className="t-body text-ink-2">{MODELS[l.model].name}</span>
                        </span>
                      </Td>
                      <Td>
                        <span className="flex items-center gap-3">
                          <TickMeter value={l.sessions} max={maxSessions} className="w-24" />
                          <span className="t-num">{fmt.int(l.sessions)}</span>
                        </span>
                      </Td>
                      <Td align="right" className="t-num">
                        {fmt.int(l.signups)}
                      </Td>
                      <Td align="right" className="t-num text-ink-2">
                        {l.conv.toFixed(1)}%
                      </Td>
                      <Td align="right">
                        <span className="inline-block">
                          <Sparkline
                            values={walk(l.path, l.sessions, (l.delta / 100) * l.sessions, 10, l.sessions / 20)}
                            color={l.delta >= 0 ? "var(--status-success)" : "var(--status-danger)"}
                            width={64}
                            height={20}
                          />
                        </span>
                      </Td>
                      <Td align="right">
                        <DeltaText value={fmt.signedPct(l.delta, 0)} good={l.delta >= 0} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardPanel>
        </Card>
      </PageSection>
    </>
  );
}
