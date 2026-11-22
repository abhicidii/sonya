import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatCenteredText, Lightbulb, PenNib, Quotes, Smiley, SmileyMeh, SmileySad } from "@phosphor-icons/react";
import {
  Badge,
  BrandMark,
  Button,
  Card,
  CardHeader,
  CardPanel,
  DeltaPill,
  DeltaText,
  ModelMark,
  MODELS,
  Segmented,
  SentimentScore,
  StatusPill,
  TickMeter,
  Toggle,
  type ModelId,
} from "@/components/ui";
import { Legend, LineChart, Sparkline, SplitBar } from "@/components/charts";
import { PageSection } from "@/components/shell/PageHeader";
import type { Filters } from "@/components/shell/FilterBar";
import { brands, days14, models, sentimentThemes } from "@/data/mock";
import { cn, fmt } from "@/lib/cn";
import { brandColor, rand, scaleBy, selectedBrand, sentimentSplit, TONE, walk, type Tone } from "./_shared";

/** Supporting quotes per theme (the mock carries one headline quote each). */
const themeQuotes: Record<string, { model: ModelId; prompt: string; text: string }[]> = {
  "Ease of setup": [
    {
      model: "chatgpt",
      prompt: "How do I track feature adoption without engineers?",
      text: "Setup takes minutes — the snippet autocaptures clicks and PMs label events later.",
    },
    {
      model: "claude",
      prompt: "Best product analytics tool for B2B SaaS",
      text: "Teams without a data engineer tend to get to first insight fastest with Lumen.",
    },
  ],
  "Pricing transparency": [
    {
      model: "perplexity",
      prompt: "Cheapest alternative to Orbit analytics",
      text: "Lumen publishes per-user pricing with a free tier up to 10k tracked users.",
    },
    { model: "gemini", prompt: "Lumen pricing per seat", text: "Pricing is listed publicly, unlike Orbit's sales-led enterprise tier." },
  ],
  "Account-level analytics": [
    {
      model: "chatgpt",
      prompt: "Best product analytics tool for B2B SaaS",
      text: "Lumen rolls events up to accounts natively, which suits B2B health scoring.",
    },
    { model: "perplexity", prompt: "Lumen vs Orbit for funnel analysis", text: "Account-level funnels are a standout compared with user-only tools." },
  ],
  "Session replay depth": [
    { model: "aio", prompt: "Session replay tools with privacy controls", text: "Lumen's replay is newer and lacks advanced filters and heatmaps." },
    { model: "perplexity", prompt: "Session replay tools with privacy controls", text: "Reviewers prefer Orbit for searching replays by user property." },
  ],
  "Mobile SDK": [
    { model: "aio", prompt: "Product analytics for mobile apps", text: "The React Native SDK is less mature than the web SDK." },
    { model: "gemini", prompt: "Product analytics for mobile apps", text: "Some users report delayed events on Android background sessions." },
  ],
  "Support response": [
    { model: "claude", prompt: "Is Lumen GDPR compliant?", text: "Support answers DPA questions within a business day on paid plans." },
    { model: "chatgpt", prompt: "Lumen vs Orbit for funnel analysis", text: "Free-tier users rely mostly on docs and community forums." },
  ],
};

const toneIcon: Record<Tone, JSX.Element> = {
  positive: <Smiley weight="fill" />,
  neutral: <SmileyMeh weight="fill" />,
  negative: <SmileySad weight="fill" />,
};

export default function SentimentTab({ filters }: { filters: Filters }) {
  const nav = useNavigate();
  const brand = selectedBrand(filters);
  const [compare, setCompare] = useState(true);
  const [tone, setTone] = useState<"all" | Tone>("all");
  const [selected, setSelected] = useState(sentimentThemes[0].theme);

  const model = filters.model === "all" ? null : (models.find((m) => m.id === filters.model) ?? null);
  const score = model ? Math.round((model.sentiment * brand.sentiment) / 72) : brand.sentiment;
  const split = sentimentSplit(score);
  const total = scaleBy((model ? model.mentions : brand.mentions) * (brand.mentions / 1284), filters.range);

  const trendBrands = compare ? brands.slice(0, 4) : [brand];
  const series = trendBrands.map((b) => ({
    id: b.id,
    label: b.name,
    color: brandColor(b),
    emphasis: b.id === brand.id,
    values: walk(`sent-${b.id}-${filters.model}`, b.id === brand.id ? score : b.sentiment, b.id === brand.id ? 4 : 1, 14, 1.4),
  }));

  const themes = sentimentThemes.filter((t) => tone === "all" || t.tone === tone);
  const active = sentimentThemes.find((t) => t.theme === selected) ?? sentimentThemes[0];
  const maxShare = Math.max(...sentimentThemes.map((t) => t.share));

  return (
    <>
      <PageSection className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,9fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader
            title="Sentiment score"
            description="0–100 · how positively AI describes each brand"
            actions={<Toggle size="xs" checked={compare} onChange={setCompare} label="Competitors" />}
          />
          <CardPanel className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="t-num-lg text-ink">{score}</span>
              <span className="t-caption text-ink-2">/ 100 {model ? `on ${MODELS[model.id].name}` : "across models"}</span>
              <DeltaPill value="+2" direction="up" size="xs" />
              <span className="flex-1" />
              <StatusPill tone={score >= 65 ? "success" : score >= 45 ? "warning" : "danger"}>
                {score >= 65 ? "Mostly positive" : score >= 45 ? "Mixed" : "Mostly negative"}
              </StatusPill>
            </div>
            <Legend items={series.map((s) => ({ label: s.label, color: s.color }))} />
            <LineChart labels={days14} series={series} height={220} yMin={40} yMax={90} format={(v) => `${Math.round(v)}`} />
          </CardPanel>
        </Card>

        <Card>
          <CardHeader title="Sentiment split" description={`${fmt.int(total)} answers that mention ${brand.name}`} />
          <CardPanel className="flex flex-col gap-5">
            <SplitBar
              height={12}
              parts={(["positive", "neutral", "negative"] as Tone[]).map((t) => ({ value: split[t], color: TONE[t].color, label: TONE[t].label }))}
            />
            <div className="grid grid-cols-3 gap-2">
              {(["positive", "neutral", "negative"] as Tone[]).map((t) => (
                <div key={t} className="rounded-lg bg-canvas p-3">
                  <div className="flex items-center gap-1.5 t-caption text-ink-2">
                    <span className="size-2 rounded-full" style={{ background: TONE[t].color }} />
                    {TONE[t].label}
                  </div>
                  <div className="mt-2 t-num-lg text-ink">{split[t]}%</div>
                  <div className="t-num-sm text-ink-3">{fmt.int(Math.round((total * split[t]) / 100))}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              {[
                { label: "Positive vs prior period", value: "+3.1 pts", good: true },
                { label: "Negative vs prior period", value: "−0.8 pts", good: true },
                { label: "Most negative model", value: "AI Overviews", good: null },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between border-b border-line py-2.5 t-body last:border-b-0">
                  <span className="text-ink-2">{r.label}</span>
                  {r.good === null ? <span className="t-body-medium text-ink">{r.value}</span> : <DeltaText value={r.value} good={r.good} />}
                </div>
              ))}
            </div>
          </CardPanel>
        </Card>
      </PageSection>

      <PageSection className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,8fr)_minmax(0,6fr)]">
        <Card>
          <CardHeader
            icon={<ChatCenteredText weight="fill" />}
            tile="purple"
            title="Themes"
            description="What AI says about you, grouped by topic"
            actions={
              <Segmented
                size="xs"
                value={tone}
                onChange={(v) => {
                  setTone(v);
                  const first = sentimentThemes.find((t) => v === "all" || t.tone === v);
                  if (first && v !== "all") setSelected(first.theme);
                }}
                options={[
                  { value: "all", label: "All" },
                  { value: "positive", label: "Positive" },
                  { value: "neutral", label: "Neutral" },
                  { value: "negative", label: "Negative" },
                ]}
              />
            }
          />
          <CardPanel flush className="p-1.5">
            {themes.map((t) => {
              const on = t.theme === active.theme;
              return (
                <button
                  key={t.theme}
                  type="button"
                  onClick={() => setSelected(t.theme)}
                  aria-pressed={on}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-left transition-colors",
                    on ? "bg-canvas shadow-control-soft" : "hover:bg-canvas/60",
                  )}
                >
                  <span className="text-[18px] [&_svg]:size-[18px]" style={{ color: TONE[t.tone].color }}>
                    {toneIcon[t.tone]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate t-body-medium text-ink">{t.theme}</span>
                    </div>
                    <div className="mt-0.5 truncate t-caption text-ink-3">“{t.quote}”</div>
                  </div>
                  <div className="hidden w-32 sm:block">
                    <TickMeter value={t.share} max={maxShare} color={TONE[t.tone].color} />
                  </div>
                  <span className="w-10 text-right t-num-sm-medium text-ink">{t.share}%</span>
                  <span className="hidden w-12 text-right t-num-sm text-ink-3 sm:block">{fmt.int(scaleBy(t.mentions, filters.range))}</span>
                </button>
              );
            })}
          </CardPanel>
        </Card>

        <Card className="self-start">
          <CardHeader
            title={active.theme}
            description={`${fmt.int(scaleBy(active.mentions, filters.range))} mentions · ${active.share}% of all themes`}
            actions={<StatusPill tone={TONE[active.tone].status}>{TONE[active.tone].label}</StatusPill>}
          />
          <CardPanel className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="t-caption text-ink-2">Share of voice in this theme, 14 days</div>
                <div className="mt-1 t-num-lg text-ink">{active.share}%</div>
              </div>
              <Sparkline
                values={walk(`theme-${active.theme}`, active.share, active.tone === "negative" ? -2 : 3, 14, 1.2)}
                color={TONE[active.tone].color}
                width={140}
                height={40}
              />
            </div>
            <div className="flex flex-col gap-2">
              {[{ model: "chatgpt" as ModelId, prompt: "Headline quote", text: active.quote }, ...(themeQuotes[active.theme] ?? [])].map((q, i) => (
                <figure key={i} className="rounded-xl bg-canvas p-3">
                  <blockquote className="flex gap-2 t-body text-ink">
                    <Quotes weight="fill" className="mt-0.5 size-3.5 shrink-0 text-icon-muted" />
                    {q.text}
                  </blockquote>
                  <figcaption className="mt-2 flex items-center gap-1.5 t-caption text-ink-3">
                    <ModelMark id={q.model} size={14} className="rounded-full" />
                    <span className="text-ink-2">{MODELS[q.model].name}</span>
                    {i > 0 && <span className="truncate">· {q.prompt}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="flex items-start gap-2.5 rounded-xl p-3 shadow-control-soft">
              <Lightbulb weight="fill" className="mt-0.5 size-4 shrink-0 text-warning" />
              <div className="min-w-0 flex-1">
                <div className="t-body-medium text-ink">{active.tone === "negative" ? "Correct the narrative" : "Amplify what's working"}</div>
                <p className="mt-0.5 t-caption text-ink-2">
                  {active.tone === "negative"
                    ? `Publish a page that answers “${active.theme.toLowerCase()}” directly — engines are quoting third-party reviews.`
                    : `Reinforce “${active.theme.toLowerCase()}” on comparison pages so engines keep quoting it.`}
                </p>
                <Button size="xs" className="mt-2.5" iconLeft={<PenNib className="size-3.5" />} onClick={() => nav("/content")}>
                  Draft content
                </Button>
              </div>
            </div>
          </CardPanel>
        </Card>
      </PageSection>

      <PageSection className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Sentiment by model" description="How each engine talks about you" />
          <CardPanel flush className="px-4">
            {models.map((m) => {
              const s = sentimentSplit(m.sentiment);
              const delta = +((rand(`sd-${m.id}`) - 0.35) * 6).toFixed(1);
              return (
                <div
                  key={m.id}
                  className={cn(
                    "-mx-4 flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0",
                    filters.model === m.id && "bg-brand-subtle",
                    filters.model !== "all" && filters.model !== m.id && "opacity-50",
                  )}
                >
                  <ModelMark id={m.id} size={24} className="rounded-full" />
                  <span className="w-24 truncate t-body-medium text-ink sm:w-28">{MODELS[m.id].name}</span>
                  <SplitBar
                    className="flex-1"
                    parts={(["positive", "neutral", "negative"] as Tone[]).map((t) => ({
                      value: s[t],
                      color: TONE[t].color,
                      label: `${TONE[t].label} ${s[t]}%`,
                    }))}
                  />
                  <span className="w-10 text-right">
                    <SentimentScore value={m.sentiment} />
                  </span>
                  <DeltaText value={fmt.signed(delta)} good={delta >= 0} className="w-10 text-right" />
                </div>
              );
            })}
          </CardPanel>
        </Card>

        <Card>
          <CardHeader title="Sentiment by competitor" description="Same prompts, every brand mentioned" />
          <CardPanel flush className="px-4">
            {[...brands]
              .slice(0, 6)
              .sort((a, b) => b.sentiment - a.sentiment)
              .map((b) => {
                const s = sentimentSplit(b.sentiment);
                return (
                  <div
                    key={b.id}
                    className={cn("-mx-4 flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0", b.id === brand.id && "bg-brand-subtle")}
                  >
                    <BrandMark brand={b} size={24} />
                    <span className="flex w-24 items-center gap-1.5 truncate t-body-medium text-ink sm:w-28">
                      {b.name}
                      {b.you && <Badge tone="inverse">You</Badge>}
                    </span>
                    <SplitBar
                      className="flex-1"
                      parts={(["positive", "neutral", "negative"] as Tone[]).map((t) => ({
                        value: s[t],
                        color: TONE[t].color,
                        label: `${TONE[t].label} ${s[t]}%`,
                      }))}
                    />
                    <span className="w-10 text-right">
                      <SentimentScore value={b.sentiment} />
                    </span>
                    <span className="w-14 text-right t-num-sm text-ink-3">{fmt.int(scaleBy(b.mentions, filters.range))}</span>
                  </div>
                );
              })}
          </CardPanel>
        </Card>
      </PageSection>
    </>
  );
}
