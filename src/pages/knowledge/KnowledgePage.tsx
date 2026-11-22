import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArticleNyTimes,
  BookOpen,
  ChartLineUp,
  ChatCircleDots,
  ChatCircleText,
  Clock,
  CreditCard,
  EnvelopeSimple,
  FileText,
  Heartbeat,
  Lightning,
  MagnifyingGlass,
  PencilLine,
  PlayCircle,
  Plugs,
  RocketLaunch,
  ThumbsDown,
  ThumbsUp,
  X,
} from "@phosphor-icons/react";
import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Card,
  CardHeader,
  CardPanel,
  Dialog,
  EmptyState,
  Input,
  StatusPill,
  Tile,
  useToast,
  type TileColor,
} from "@/components/ui";
import { PageHeader, PageSection } from "@/components/shell/PageHeader";
import { useShell } from "@/components/shell/ShellContext";
import { cn } from "@/lib/cn";

type CatId = "start" | "insights" | "prompts" | "content" | "site" | "integrations" | "billing" | "agent";

const categories: { id: CatId; name: string; description: string; icon: ReactNode; tile: TileColor; count: number }[] = [
  { id: "start", name: "Getting started", description: "Set up your workspace, brands and first prompts", icon: <RocketLaunch weight="fill" />, tile: "ink", count: 12 },
  { id: "insights", name: "AEO Insights", description: "Visibility, share of voice, sentiment and sources", icon: <ChartLineUp weight="fill" />, tile: "blue", count: 18 },
  { id: "prompts", name: "Prompts", description: "Track, research and organise the prompts that matter", icon: <ChatCircleText weight="fill" />, tile: "orange", count: 9 },
  { id: "content", name: "Content", description: "Briefs, the editor and the content score", icon: <PencilLine weight="fill" />, tile: "green", count: 11 },
  { id: "site", name: "Site Health", description: "Crawls, schema, llms.txt and AI crawler access", icon: <Heartbeat weight="fill" />, tile: "pink", count: 14 },
  { id: "agent", name: "Agent & Skills", description: "Chat with Sonya, approve actions, build skills", icon: <Lightning weight="fill" />, tile: "purple", count: 7 },
  { id: "integrations", name: "Integrations", description: "Search Console, Analytics, Slack and CMS", icon: <Plugs weight="fill" />, tile: "blue", count: 8 },
  { id: "billing", name: "Billing", description: "Plans, usage limits, seats and invoices", icon: <CreditCard weight="fill" />, tile: "orange", count: 6 },
];

interface Article {
  id: string;
  title: string;
  cat: CatId;
  minutes: number;
  updated: string;
  views: number;
  summary: string;
}

const articles: Article[] = [
  { id: "k1", title: "How the visibility score is calculated", cat: "insights", minutes: 4, updated: "Nov 2", views: 2841, summary: "Visibility is the share of AI answers to your tracked prompts that mention your brand, across every model you track." },
  { id: "k2", title: "Choosing your first 20 prompts", cat: "start", minutes: 6, updated: "Oct 29", views: 2310, summary: "Start with the questions buyers ask before they shortlist a tool: comparisons, alternatives and “best for” prompts." },
  { id: "k3", title: "Why do results differ between models?", cat: "insights", minutes: 5, updated: "Oct 27", views: 1984, summary: "Each engine retrieves from different sources and refreshes on its own schedule, so the same prompt can mention different brands." },
  { id: "k4", title: "Connecting Google Search Console", cat: "integrations", minutes: 3, updated: "Oct 24", views: 1702, summary: "Connect Search Console to bring clicks and impressions from AI Overviews into Traffic and the Agent." },
  { id: "k5", title: "Allowing AI crawlers in robots.txt", cat: "site", minutes: 4, updated: "Oct 22", views: 1655, summary: "GPTBot, PerplexityBot, ClaudeBot and Google-Extended each need their own rule. Here's a safe default." },
  { id: "k6", title: "Writing content that gets cited", cat: "content", minutes: 8, updated: "Oct 20", views: 1520, summary: "Lead with a direct answer, back claims with sources and structure pages so engines can lift a passage verbatim." },
  { id: "k7", title: "Approving actions proposed by the Agent", cat: "agent", minutes: 3, updated: "Nov 4", views: 1214, summary: "Nothing changes until you approve. Edit the proposal to remove items, or dismiss it entirely." },
  { id: "k8", title: "Adding competitors and brand aliases", cat: "start", minutes: 3, updated: "Oct 18", views: 1108, summary: "Aliases catch misspellings and product names so mentions like “Lumen Analytics” still count toward your score." },
  { id: "k9", title: "Prompt research: finding prompts worth tracking", cat: "prompts", minutes: 5, updated: "Oct 16", views: 986, summary: "Research suggests prompts by volume and by how often competitors appear where you don't." },
  { id: "k10", title: "Understanding prompt limits and overages", cat: "billing", minutes: 2, updated: "Oct 12", views: 742, summary: "Your plan includes a fixed number of tracked prompts. Suggested prompts don't count until you activate them." },
  { id: "k11", title: "Adding llms.txt to your site", cat: "site", minutes: 4, updated: "Oct 10", views: 702, summary: "llms.txt gives engines a short, curated map of your most important pages." },
  { id: "k12", title: "Building your first custom skill", cat: "agent", minutes: 5, updated: "Nov 5", views: 488, summary: "Skills are reusable instructions. Give them a clear goal, the data they may read and the output you expect." },
];

const glossary = [
  { term: "Visibility score", def: "Share of AI answers to your tracked prompts that mention your brand.", formula: "answers mentioning you ÷ all answers" },
  { term: "Share of voice", def: "Your mentions as a share of all brand mentions in the same answers.", formula: "your mentions ÷ all brand mentions" },
  { term: "Avg. position", def: "Where your brand appears in an answer's list or text when it's mentioned. Lower is better.", formula: "mean rank when mentioned" },
  { term: "Sentiment", def: "How positively engines describe you, from 0 (negative) to 100 (positive).", formula: "0 – 100 · weighted by mention" },
  { term: "Query fanout", def: "The sub-searches an engine runs behind the scenes to answer one prompt.", formula: "1 prompt → n searches" },
  { term: "Citation", def: "A link an engine shows as the source of a claim. Owned citations point to your site.", formula: "owned · earned · competitor" },
];

const popularSearches = ["visibility score", "robots.txt", "Search Console", "content score", "seats"];

export default function KnowledgePage() {
  const toast = useToast();
  const { openLearn } = useShell();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CatId | null>(null);
  const [open, setOpen] = useState<Article | null>(null);
  const [glossOpen, setGlossOpen] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return articles
      .filter((a) => (!cat || a.cat === cat) && (!s || `${a.title} ${a.summary}`.toLowerCase().includes(s)))
      .sort((a, b) => b.views - a.views);
  }, [q, cat]);

  const pickCategory = (c: CatId) => {
    setCat((cur) => (cur === c ? null : c));
    requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const catName = (id: CatId) => categories.find((c) => c.id === id)?.name ?? "";
  const searching = q.trim().length > 0;

  return (
    <>
      <PageHeader
        title="Knowledge Base"
        actions={
          <>
            <Button variant="outlined" tone="secondary" iconLeft={<PlayCircle weight="duotone" className="size-4" />} onClick={() => openLearn("videos")}>
              Video guides
            </Button>
            <Button variant="outlined" tone="secondary" iconLeft={<ChatCircleDots weight="duotone" className="size-4" />} onClick={() => toast({ tone: "info", title: "Chat started", description: "A support specialist will reply here in about 2 hours." })}>
              Contact support
            </Button>
          </>
        }
      />

      {/* Search hero */}
      <PageSection className="relative overflow-hidden bg-canvas">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(var(--border-default)_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
        />
        <div className="relative mx-auto flex max-w-[640px] flex-col items-center py-6 text-center sm:py-10">
          <Tile color="ink" size="lg" className="mb-4">
            <BookOpen weight="fill" />
          </Tile>
          <h2 className="text-balance font-display text-[26px] font-medium leading-tight tracking-[-0.03em] text-ink">How can we help?</h2>
          <p className="mt-2 t-body text-ink-2">Guides, definitions and answers for getting your brand into AI answers.</p>
          <Input
            size="md"
            iconLeft={<MagnifyingGlass />}
            placeholder="Search articles, e.g. “visibility score”"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            wrapperClassName="mt-5 w-full"
            trailing={
              q ? (
                <button aria-label="Clear search" onClick={() => setQ("")} className="grid size-5 place-items-center rounded text-icon-muted hover:text-ink">
                  <X className="size-3.5" />
                </button>
              ) : undefined
            }
          />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            <span className="t-caption text-ink-3">Popular:</span>
            {popularSearches.map((s) => (
              <button
                key={s}
                onClick={() => setQ(s)}
                className="h-6 rounded-full bg-surface px-2.5 t-caption-medium text-ink-2 shadow-control-soft transition-colors hover:text-ink"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </PageSection>

      {/* Categories */}
      {!searching && (
        <PageSection className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h2 className="t-heading text-ink">Browse by topic</h2>
            <span className="flex-1" />
            <span className="t-caption text-ink-3">
              <span className="t-num-sm text-ink-2">{categories.reduce((a, c) => a + c.count, 0)}</span> articles
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map((c) => {
              const active = cat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => pickCategory(c.id)}
                  aria-pressed={active}
                  className={cn(
                    "group flex flex-col rounded-2xl bg-canvas p-1 text-left shadow-card transition-shadow duration-150 hover:shadow-control",
                    active && "shadow-[0_0_0_1.5px_var(--text-primary)] hover:shadow-[0_0_0_1.5px_var(--text-primary)]",
                  )}
                >
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <Tile color={c.tile} size="md">
                      {c.icon}
                    </Tile>
                    <span className="flex-1 truncate t-label text-ink">{c.name}</span>
                    <ArrowRight className="size-3.5 text-icon-muted transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-3 rounded-xl bg-surface p-3.5 shadow-card">
                    <p className="t-caption text-ink-2">{c.description}</p>
                    <span className="t-caption text-ink-3">
                      <span className="t-num-sm-medium text-ink">{c.count}</span> articles
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </PageSection>
      )}

      {/* Articles + support */}
      <PageSection className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div ref={listRef} className="scroll-mt-4">
          <Card>
            <CardHeader
              icon={<FileText weight="fill" />}
              tile="blue"
              title={searching ? "Search results" : cat ? catName(cat) : "Popular articles"}
              description={searching ? `${results.length} articles for “${q.trim()}”` : cat ? `${results.length} articles` : "Most read this month"}
              actions={
                cat ? (
                  <button onClick={() => setCat(null)} className="inline-flex h-7 items-center gap-1 rounded-md bg-surface px-2 t-caption-medium text-ink-2 shadow-control-soft hover:text-ink">
                    {catName(cat)} <X className="size-3" />
                  </button>
                ) : undefined
              }
            />
            <CardPanel flush className="px-2 py-1">
              {results.length === 0 ? (
                <EmptyState
                  icon={<MagnifyingGlass weight="duotone" />}
                  title="No articles found"
                  description="Try a different word, or ask our team — we usually reply within 2 hours."
                  action={
                    <Button variant="outlined" tone="secondary" onClick={() => { setQ(""); setCat(null); }}>
                      Clear search
                    </Button>
                  }
                />
              ) : (
                results.slice(0, searching || cat ? 20 : 8).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setOpen(a)}
                    className="group flex w-full items-center gap-3 border-b border-line px-2 py-3 text-left transition-colors last:border-b-0 hover:bg-canvas"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-subtle text-icon">
                      <ArticleNyTimes weight="duotone" className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate t-body-medium text-ink">{a.title}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 t-caption text-ink-3">
                        <span>{catName(a.cat)}</span>·
                        <Clock className="size-3" />
                        <span>{a.minutes} min read</span>
                        <span className="hidden sm:inline">· Updated {a.updated}</span>
                      </span>
                    </span>
                    <span className="hidden t-num-sm text-ink-3 sm:block">{a.views.toLocaleString()} views</span>
                    <ArrowRight className="size-3.5 text-icon-muted opacity-0 transition-[opacity,transform] group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </button>
                ))
              )}
            </CardPanel>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader icon={<ChatCircleDots weight="fill" />} tile="green" title="Still need help?" description="Our AEO specialists are online" />
            <CardPanel className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <AvatarStack names={["Priya Nair", "Tom Becker", "Jo Kim", "Rui Alves"]} size={28} />
                <div className="min-w-0">
                  <StatusPill tone="success">Online now</StatusPill>
                  <div className="mt-1 t-caption text-ink-3">
                    Avg. first reply <span className="t-num-sm text-ink-2">1h 52m</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="md" iconLeft={<ChatCircleDots weight="bold" className="size-4" />} onClick={() => toast({ tone: "info", title: "Chat started", description: "Priya from support will reply shortly." })}>
                  Start a chat
                </Button>
                <Button
                  size="md"
                  variant="outlined"
                  tone="secondary"
                  iconLeft={<EnvelopeSimple className="size-4" />}
                  onClick={() => {
                    navigator.clipboard?.writeText("support@sonya.ai").catch(() => {});
                    toast({ title: "Email copied", description: "support@sonya.ai" });
                  }}
                >
                  support@sonya.ai
                </Button>
              </div>
              <div className="rounded-xl bg-canvas p-3">
                <div className="t-caption-medium text-ink">Pro plan perk</div>
                <p className="mt-0.5 t-caption text-ink-2">Book a 30-minute AEO strategy call with a specialist each quarter.</p>
                <button
                  onClick={() => toast({ title: "Call requested", description: "We'll email you times for next week." })}
                  className="mt-2 inline-flex items-center gap-1 t-caption-medium text-ink underline-offset-2 hover:underline"
                >
                  Book a call <ArrowRight className="size-3" />
                </button>
              </div>
            </CardPanel>
          </Card>

          <Card>
            <CardHeader icon={<PlayCircle weight="fill" />} tile="pink" title="Video guides" description="6 short walkthroughs · 40 min" />
            <CardPanel flush className="p-1.5">
              {["AEO Visibility", "Your Prompts", "Content that gets cited"].map((t, i) => (
                <button key={t} onClick={() => openLearn("videos")} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-canvas">
                  <span className="relative grid h-9 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-inverse text-on-inverse">
                    <PlayCircle weight="fill" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate t-body-medium text-ink">{t}</span>
                  <span className="t-num-sm text-ink-3">{[5, 7, 9][i]}:00</span>
                </button>
              ))}
            </CardPanel>
          </Card>
        </div>
      </PageSection>

      {/* Glossary */}
      <PageSection className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="t-heading text-ink">Glossary</h2>
          <Badge tone="neutral">{glossary.length} terms</Badge>
          <span className="flex-1" />
          <span className="hidden t-caption text-ink-3 sm:block">The metrics you'll see across Sonya</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {glossary.map((g) => {
            const expanded = glossOpen === g.term;
            return (
              <button
                key={g.term}
                onClick={() => setGlossOpen(expanded ? null : g.term)}
                aria-expanded={expanded}
                className="flex flex-col gap-2 rounded-2xl bg-surface p-4 text-left shadow-card transition-shadow hover:shadow-control"
              >
                <span className="flex items-center gap-2">
                  <span className="t-body-medium text-ink">{g.term}</span>
                  <span className="flex-1" />
                  <span className="t-caption text-ink-3">{expanded ? "Hide" : "Formula"}</span>
                </span>
                <span className="t-body text-ink-2">{g.def}</span>
                {expanded && (
                  <span className="mt-1 rounded-lg bg-canvas px-2.5 py-2 font-mono text-[12px] text-ink animate-[sy-fade-in_140ms_ease-out]">{g.formula}</span>
                )}
              </button>
            );
          })}
        </div>
      </PageSection>

      <ArticleDialog article={open} category={open ? catName(open.cat) : ""} onClose={() => setOpen(null)} />
    </>
  );
}

function ArticleDialog({ article, category, onClose }: { article: Article | null; category: string; onClose: () => void }) {
  const toast = useToast();
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const close = () => {
    setVote(null);
    onClose();
  };
  return (
    <Dialog open={!!article} onClose={close} size="lg" title={article?.title} description={article ? `${category} · ${article.minutes} min read · Updated ${article.updated}, 2026` : undefined}>
      {article && (
        <div className="flex flex-col gap-4 px-5 py-5">
          <div className="flex items-center gap-2">
            <Avatar name="Priya Nair" size={24} />
            <span className="t-caption text-ink-2">Written by Priya Nair, AEO specialist</span>
          </div>
          <p className="text-[15px] leading-[1.65] text-ink">{article.summary}</p>
          <h3 className="t-heading text-ink">In this article</h3>
          <ol className="flex flex-col gap-2">
            {["What it measures", "How we collect the data", "Reading it in your dashboard", "Common questions"].map((s, i) => (
              <li key={s} className="flex items-center gap-2.5 t-body text-ink-2">
                <span className="grid size-5 place-items-center rounded-md bg-subtle t-num-sm-medium text-ink-2">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <div className="rounded-xl bg-canvas p-4">
            <div className="t-caption-medium text-ink">Tip</div>
            <p className="mt-1 t-body text-ink-2">
              Ask the Agent “explain this metric for my brand” to see this applied to Lumen's own numbers.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <span className="t-body text-ink-2">Was this helpful?</span>
            <Button
              size="xs"
              variant="outlined"
              tone={vote === "up" ? "primary" : "secondary"}
              iconLeft={<ThumbsUp weight={vote === "up" ? "fill" : "regular"} className="size-3.5" />}
              onClick={() => {
                setVote("up");
                toast({ title: "Thanks for the feedback" });
              }}
            >
              Yes
            </Button>
            <Button
              size="xs"
              variant="outlined"
              tone={vote === "down" ? "primary" : "secondary"}
              iconLeft={<ThumbsDown weight={vote === "down" ? "fill" : "regular"} className="size-3.5" />}
              onClick={() => {
                setVote("down");
                toast({ tone: "info", title: "Thanks — we'll improve this article" });
              }}
            >
              No
            </Button>
            <span className="flex-1" />
            <span className="t-caption text-ink-3">
              <span className="t-num-sm">{article.views.toLocaleString()}</span> views
            </span>
          </div>
        </div>
      )}
    </Dialog>
  );
}
