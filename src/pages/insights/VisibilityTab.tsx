import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowsOutSimple, ChatCircleDots, DotsThree, Eye, Medal, Smiley, Target } from "@phosphor-icons/react";
import {
  BrandMark,
  Card,
  CardFooter,
  CardHeader,
  CardPanel,
  DeltaText,
  IconButton,
  KpiCard,
  ModelMark,
  MODELS,
  Segmented,
  SentimentScore,
  StatusPill,
  Table,
  Td,
  Th,
  THead,
  Toggle,
  Tr,
  Badge,
} from "@/components/ui";
import { DotMatrix, Donut, Legend, LineChart } from "@/components/charts";
import { PageSection } from "@/components/shell/PageHeader";
import type { Filters } from "@/components/shell/FilterBar";
import { brands, days14, models, months, you } from "@/data/mock";
import { fmt } from "@/lib/cn";

const monthlyMentions = {
  owned: [620, 680, 710, 760, 820, 880, 940, 1010, 1080, 1160, null, null],
  earned: [210, 230, 250, 240, 270, 300, 310, 330, 360, 390, null, null],
  target: [800, 850, 900, 950, 1000, 1080, 1160, 1240, 1320, 1400, 1480, 1560],
};

export default function VisibilityTab({ filters }: { filters: Filters }) {
  const nav = useNavigate();
  const [compare, setCompare] = useState(true);
  const [gran, setGran] = useState("d");
  const [month, setMonth] = useState(9);
  const brand = brands.find((b) => b.id === filters.brand) ?? you;

  const series = (compare ? brands.slice(0, 5) : [brand]).map((b) => ({
    id: b.id,
    label: b.name,
    values: b.trend,
    color: b.you ? "var(--data-1)" : b.color,
    emphasis: b.id === brand.id,
  }));

  return (
    <>
      {/* KPIs */}
      <PageSection className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="success">Data updated Nov 6, 2026 · 06:30 UTC</StatusPill>
          <span className="t-caption text-ink-3">22 prompts × 6 models · 1,320 answers analysed</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Visibility score"
            icon={<Eye weight="fill" />}
            tile="blue"
            prior="vs 38.6%"
            value={fmt.pct(brand.visibility)}
            unit="of answers"
            delta={{ value: fmt.signed(brand.visDelta) + " pts", direction: brand.visDelta >= 0 ? "up" : "down" }}
          />
          <KpiCard
            label="Share of voice"
            icon={<ChatCircleDots weight="fill" />}
            tile="orange"
            prior="vs 17.1%"
            value={fmt.pct(brand.sov)}
            unit="of mentions"
            delta={{ value: "+1.3 pts", direction: "up" }}
          />
          <KpiCard
            label="Avg. position"
            icon={<Medal weight="fill" />}
            tile="green"
            prior="vs #1.9"
            value={`#${brand.position.toFixed(1)}`}
            unit="when mentioned"
            delta={{ value: fmt.signed(brand.posDelta), direction: brand.posDelta <= 0 ? "up" : "down", good: brand.posDelta <= 0 }}
          />
          <KpiCard
            label="Sentiment"
            icon={<Smiley weight="fill" />}
            tile="pink"
            prior="vs 70"
            value={`${brand.sentiment}`}
            unit="/ 100"
            delta={{ value: "+2", direction: "up" }}
          />
        </div>
      </PageSection>

      {/* Model breakdown + trend */}
      <PageSection className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,9fr)]">
        <Card>
          <CardHeader
            title="Visibility by model"
            description="Last 7 days · % of answers that mention you"
            actions={
              <IconButton label="Open LLM Analytics" size="xs" onClick={() => nav("/llm")}>
                <ArrowsOutSimple className="size-3.5" />
              </IconButton>
            }
          />
          <CardPanel flush className="px-4">
            {models.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
                <ModelMark id={m.id} size={32} className="rounded-full" />
                <div className="min-w-0 flex-1">
                  <div className="t-body-medium text-ink">{MODELS[m.id].name}</div>
                  <div className="truncate t-caption text-ink-3">
                    {fmt.pct(m.visibility)} · {m.mentions} mentions · #{m.position.toFixed(1)}
                  </div>
                </div>
                <DeltaText value={fmt.signed(m.delta) + " pts"} good={m.delta >= 0} />
              </div>
            ))}
          </CardPanel>
          <CardFooter>
            <span>Blended visibility</span>
            <span className="t-num text-success">{fmt.pct(brand.visibility)}</span>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader
            title="Visibility trend"
            description="Share of answers mentioning each brand"
            actions={
              <>
                <Toggle size="xs" checked={compare} onChange={setCompare} label="Competitors" />
                <Segmented
                  size="xs"
                  value={gran}
                  onChange={setGran}
                  options={[
                    { value: "d", label: "D" },
                    { value: "w", label: "W" },
                    { value: "m", label: "M" },
                  ]}
                />
              </>
            }
          />
          <CardPanel className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="t-num-lg text-ink">{fmt.pct(brand.visibility)}</span>
              <span className="t-caption text-ink-2">visibility score</span>
              <span className="flex-1" />
              <StatusPill tone="success">Ahead of Orbit by 3.6 pts</StatusPill>
            </div>
            <Legend items={series.map((s) => ({ label: s.label, color: s.color }))} />
            <LineChart labels={days14} series={series} height={232} format={(v) => `${Math.round(v)}%`} />
          </CardPanel>
        </Card>
      </PageSection>

      {/* Rankings + share of voice */}
      <PageSection className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,9fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader
            title="Rankings"
            description="Top brands across models for your prompts"
            actions={
              <IconButton label="More" size="xs" variant="link">
                <DotsThree weight="bold" className="size-4" />
              </IconButton>
            }
          />
          <CardPanel flush className="p-2">
            <Table>
              <THead>
                <tr>
                  <Th className="w-10">#</Th>
                  <Th>Brand</Th>
                  <Th align="right">Visibility</Th>
                  <Th align="right">SOV</Th>
                  <Th align="right">Sentiment</Th>
                  <Th align="right">Avg. pos.</Th>
                </tr>
              </THead>
              <tbody>
                {brands.map((b, i) => (
                  <Tr key={b.id} selected={b.id === brand.id}>
                    <Td className="t-num-sm text-ink-3">{i + 1}</Td>
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
                        <DeltaText value={fmt.signed(b.visDelta)} good={b.visDelta >= 0} className="w-10 text-right" />
                      </span>
                    </Td>
                    <Td align="right" className="t-num">{fmt.pct(b.sov)}</Td>
                    <Td align="right">
                      <SentimentScore value={b.sentiment} />
                    </Td>
                    <Td align="right" className="t-num text-ink-2">#{b.position.toFixed(1)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </CardPanel>
        </Card>

        <Card>
          <CardHeader title="Share of voice" description="Your mentions vs competitors" />
          <CardPanel className="flex flex-col items-center gap-5">
            <Donut
              size={196}
              data={brands.slice(0, 6).map((b) => ({ label: b.name, value: b.sov, color: b.you ? "var(--data-1)" : b.color }))}
              center={
                <div>
                  <div className="t-num-lg text-ink">{fmt.pct(brand.sov)}</div>
                  <div className="t-caption text-ink-2">{brand.name}</div>
                </div>
              }
            />
            <div className="grid w-full grid-cols-2 gap-x-4 gap-y-2">
              {brands.slice(0, 6).map((b) => (
                <div key={b.id} className="flex items-center gap-2 t-caption">
                  <span className="size-2.5 rounded-[3px]" style={{ background: b.you ? "var(--data-1)" : b.color }} />
                  <span className="flex-1 truncate text-ink-2">{b.name}</span>
                  <span className="t-num-sm-medium text-ink">{fmt.pct(b.sov)}</span>
                </div>
              ))}
            </div>
          </CardPanel>
        </Card>
      </PageSection>

      {/* Mentions vs goal — dot matrix */}
      <PageSection>
        <Card>
          <CardHeader
            icon={<Target weight="fill" />}
            tile="purple"
            title="Mentions vs monthly goal"
            description="Jan – Dec 2026 · owned and earned mentions"
            actions={
              <IconButton label="More" size="xs" variant="link">
                <DotsThree weight="bold" className="size-4" />
              </IconButton>
            }
          />
          <CardPanel className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <span className="t-num-lg text-ink">12,850</span>
              <span className="t-caption text-ink-2">mentions year to date</span>
              <span className="flex-1" />
              <StatusPill tone="warning">Behind goal · −8.1% in Oct</StatusPill>
            </div>
            <Legend
              items={[
                { label: "Owned · your pages cited", color: "var(--data-1)" },
                { label: "Earned · third-party", color: "var(--data-2)" },
                { label: "Monthly goal", color: "var(--data-target)", dashed: true },
              ]}
            />
            <DotMatrix
              labels={months}
              series={[
                { values: monthlyMentions.owned, color: "var(--data-1)", highlight: "var(--data-1-highlight)" },
                { values: monthlyMentions.earned, color: "var(--data-2)" },
              ]}
              target={monthlyMentions.target}
              max={1800}
              rows={14}
              height={200}
              selected={month}
              onSelect={setMonth}
              formatTip={(i) => {
                const total = (monthlyMentions.owned[i] ?? 0) + (monthlyMentions.earned[i] ?? 0);
                return total ? (
                  <>
                    <div className="t-num-sm-medium">{fmt.int(total)} mentions</div>
                    <div className="t-caption opacity-70">goal {fmt.int(monthlyMentions.target[i])}</div>
                  </>
                ) : (
                  <div className="t-caption">No data yet · goal {fmt.int(monthlyMentions.target[i])}</div>
                );
              }}
            />
          </CardPanel>
        </Card>
      </PageSection>
    </>
  );
}
