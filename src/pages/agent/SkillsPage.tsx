import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Binoculars,
  ChartLineUp,
  ChatCircleText,
  Code,
  FileText,
  Globe,
  Lightning,
  ListChecks,
  MagnifyingGlass,
  PencilLine,
  Plus,
  Quotes,
  Robot,
  Scales,
  Smiley,
  Sparkle,
  TreeStructure,
} from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardPanel,
  Checkbox,
  Dialog,
  EmptyState,
  Field,
  Input,
  PillTabs,
  SearchInput,
  Select,
  Textarea,
  Tile,
  Toggle,
  useToast,
  type TileColor,
} from "@/components/ui";
import { PageHeader, PageSection } from "@/components/shell/PageHeader";
import { cn } from "@/lib/cn";

type Category = "analysis" | "content" | "technical" | "reporting";
type Source = "prompts" | "site" | "content" | "sources" | "gsc";

interface Skill {
  id: string;
  name: string;
  description: string;
  category: Category;
  icon: ReactNode;
  tile: TileColor;
  runsOn: Source[];
  prompt: string;
  runs: number;
  enabled: boolean;
  custom?: boolean;
  isNew?: boolean;
}

const sourceMeta: Record<Source, { label: string; icon: ReactNode }> = {
  prompts: { label: "Prompts", icon: <ChatCircleText weight="duotone" /> },
  site: { label: "Site", icon: <Globe weight="duotone" /> },
  content: { label: "Content", icon: <FileText weight="duotone" /> },
  sources: { label: "Sources", icon: <Quotes weight="duotone" /> },
  gsc: { label: "Search Console", icon: <MagnifyingGlass weight="duotone" /> },
};

const categoryLabel: Record<Category, string> = { analysis: "Analysis", content: "Content", technical: "Technical", reporting: "Reporting" };

const initialSkills: Skill[] = [
  {
    id: "s1",
    name: "Visibility plan",
    description: "Ranks the actions most likely to lift your AI visibility over the next 30 days, with owners and expected impact.",
    category: "analysis",
    icon: <ChartLineUp weight="fill" />,
    tile: "blue",
    runsOn: ["prompts", "sources", "site"],
    prompt: "Build a 30-day AI visibility agenda for Lumen (lumen.so), ranked by impact.",
    runs: 128,
    enabled: true,
  },
  {
    id: "s2",
    name: "Explain a spike",
    description: "Finds why visibility moved on a model — new citations, ranking changes or competitor drops — and what to do next.",
    category: "analysis",
    icon: <Binoculars weight="fill" />,
    tile: "purple",
    runsOn: ["prompts", "sources"],
    prompt: "Why did our Perplexity visibility jump this week?",
    runs: 64,
    enabled: true,
  },
  {
    id: "s3",
    name: "Competitor teardown",
    description: "Compares you with one competitor across prompts, models and the pages engines cite for each of you.",
    category: "analysis",
    icon: <Scales weight="fill" />,
    tile: "orange",
    runsOn: ["prompts", "sources"],
    prompt: "Compare Lumen with Orbit across all tracked prompts and tell me where Orbit wins.",
    runs: 41,
    enabled: true,
    isNew: true,
  },
  {
    id: "s4",
    name: "Comparison page writer",
    description: "Drafts a “You vs Competitor” page with a quotable verdict, feature table and sourced claims.",
    category: "content",
    icon: <PencilLine weight="fill" />,
    tile: "green",
    runsOn: ["prompts", "content", "sources"],
    prompt: "Draft a Lumen vs Tidal comparison page that AI engines will cite.",
    runs: 37,
    enabled: true,
  },
  {
    id: "s5",
    name: "Content brief",
    description: "Turns a prompt cluster into a brief: target questions, outline, entities to cover and sources to cite.",
    category: "content",
    icon: <ListChecks weight="fill" />,
    tile: "pink",
    runsOn: ["prompts", "content"],
    prompt: "Write a content brief for the 'session replay privacy' prompt cluster.",
    runs: 92,
    enabled: true,
  },
  {
    id: "s6",
    name: "FAQ rewriter",
    description: "Rewrites FAQ answers into short, direct, extractable answers that engines quote verbatim.",
    category: "content",
    icon: <Sparkle weight="fill" />,
    tile: "blue",
    runsOn: ["site", "content"],
    prompt: "Rewrite the FAQ on lumen.so/pricing so AI engines can quote each answer.",
    runs: 23,
    enabled: false,
  },
  {
    id: "s7",
    name: "AEO page audit",
    description: "Crawls one page and scores it for AI engines: rendering, schema, answer structure and freshness.",
    category: "technical",
    icon: <Code weight="fill" />,
    tile: "ink",
    runsOn: ["site"],
    prompt: "Audit lumen.so/pricing for AEO and tell me what to fix first.",
    runs: 76,
    enabled: true,
  },
  {
    id: "s8",
    name: "Crawler access check",
    description: "Checks robots.txt, llms.txt and response codes for GPTBot, PerplexityBot and Google-Extended.",
    category: "technical",
    icon: <Robot weight="fill" />,
    tile: "orange",
    runsOn: ["site", "gsc"],
    prompt: "Check whether AI crawlers can access every page on lumen.so.",
    runs: 18,
    enabled: true,
    isNew: true,
  },
  {
    id: "s9",
    name: "Weekly digest",
    description: "Summarises the week: visibility by model, new citations, competitor moves and the top 3 actions.",
    category: "reporting",
    icon: <FileText weight="fill" />,
    tile: "green",
    runsOn: ["prompts", "sources", "content"],
    prompt: "Write this week's AI visibility digest for the growth team.",
    runs: 54,
    enabled: true,
  },
  {
    id: "s10",
    name: "Sentiment summary",
    description: "Groups what engines say about you into themes, with the sources behind each positive or negative claim.",
    category: "reporting",
    icon: <Smiley weight="fill" />,
    tile: "pink",
    runsOn: ["prompts", "sources"],
    prompt: "Summarise how AI engines describe Lumen and which sources drive negative sentiment.",
    runs: 29,
    enabled: false,
  },
];

type Filter = "all" | Category;

export default function SkillsPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: skills.length, analysis: 0, content: 0, technical: 0, reporting: 0 };
    skills.forEach((s) => (c[s.category] += 1));
    return c;
  }, [skills]);

  const shown = skills.filter(
    (s) => (filter === "all" || s.category === filter) && (!q || `${s.name} ${s.description}`.toLowerCase().includes(q.toLowerCase())),
  );
  const enabledCount = skills.filter((s) => s.enabled).length;

  const setEnabled = (id: string, v: boolean) => {
    setSkills((s) => s.map((x) => (x.id === id ? { ...x, enabled: v } : x)));
    const sk = skills.find((x) => x.id === id);
    toast({ tone: v ? "success" : "info", title: v ? `${sk?.name} enabled` : `${sk?.name} disabled`, description: v ? "Sonya can use it in any chat." : "Sonya won't use it until you turn it back on." });
  };

  return (
    <>
      <PageHeader
        title="Skills"
        badge={<Badge tone="blue">New</Badge>}
        actions={
          <>
            <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search skills…" wrapperClassName="w-full sm:w-56" />
            <Button iconLeft={<Plus weight="bold" className="size-3.5" />} onClick={() => setCreating(true)}>
              Create skill
            </Button>
          </>
        }
      />

      {/* Intro band */}
      <PageSection>
        <div className="flex flex-col gap-4 rounded-2xl bg-canvas p-1 shadow-card md:flex-row md:items-stretch">
          <div className="flex flex-1 items-center gap-4 px-4 py-3">
            <Tile color="ink" size="xl">
              <Lightning weight="fill" />
            </Tile>
            <div className="min-w-0">
              <div className="t-heading text-ink">Teach Sonya your playbooks</div>
              <p className="mt-1 max-w-xl t-body text-ink-2">
                Skills are reusable workflows the agent runs on your prompts, site and content. Sonya picks the right skill automatically, or you can start one with <span className="t-body-medium text-ink">Try</span>.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 md:w-[360px]">
            {[
              { label: "Enabled", value: `${enabledCount}/${skills.length}` },
              { label: "Runs this month", value: skills.reduce((a, s) => a + s.runs, 0).toLocaleString() },
              { label: "Custom", value: `${skills.filter((s) => s.custom).length}` },
            ].map((k) => (
              <div key={k.label} className="flex flex-col justify-center rounded-xl bg-surface px-3 py-3 shadow-card">
                <span className="t-caption text-ink-2">{k.label}</span>
                <span className="mt-1 t-num-lg text-ink">{k.value}</span>
              </div>
            ))}
          </div>
        </div>
      </PageSection>

      <PageSection className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <PillTabs
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "analysis", label: "Analysis", count: counts.analysis },
              { value: "content", label: "Content", count: counts.content },
              { value: "technical", label: "Technical", count: counts.technical },
              { value: "reporting", label: "Reporting", count: counts.reporting },
            ]}
          />
          <span className="flex-1" />
          <span className="t-caption text-ink-3">
            <span className="t-num-sm text-ink-2">{shown.length}</span> skills
          </span>
        </div>

        {shown.length === 0 ? (
          <Card>
            <CardPanel>
              <EmptyState
                icon={<MagnifyingGlass weight="duotone" />}
                title="No skills match"
                description={q ? `Nothing found for “${q}”. Try another word or create your own skill.` : "No skills in this category yet."}
                action={
                  <>
                    <Button variant="outlined" tone="secondary" onClick={() => { setQ(""); setFilter("all"); }}>
                      Clear filters
                    </Button>
                    <Button iconLeft={<Plus weight="bold" className="size-3.5" />} onClick={() => setCreating(true)}>
                      Create skill
                    </Button>
                  </>
                }
              />
            </CardPanel>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {shown.map((s) => (
              <SkillCard
                key={s.id}
                skill={s}
                onToggle={(v) => setEnabled(s.id, v)}
                onTry={() => nav("/agent", { state: { text: s.prompt, skill: s.name } })}
              />
            ))}
            <button
              onClick={() => setCreating(true)}
              className="group flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line-strong p-6 text-center transition-colors hover:bg-canvas"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-surface text-icon shadow-card transition-transform group-hover:scale-105">
                <Plus weight="bold" className="size-4" />
              </span>
              <span>
                <span className="block t-body-medium text-ink">Create a custom skill</span>
                <span className="mt-1 block t-caption text-ink-3">Write instructions once, reuse them in every chat</span>
              </span>
            </button>
          </div>
        )}
      </PageSection>

      <CreateSkillDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(skill) => {
          setSkills((s) => [skill, ...s]);
          setFilter("all");
          setQ("");
          setCreating(false);
          toast({ title: `“${skill.name}” created`, description: "It's enabled and ready to use in Agent.", action: { label: "Try it", onClick: () => nav("/agent", { state: { text: skill.prompt, skill: skill.name } }) } });
        }}
      />
    </>
  );
}

function SkillCard({ skill: s, onToggle, onTry }: { skill: Skill; onToggle: (v: boolean) => void; onTry: () => void }) {
  return (
    <Card className={cn("transition-opacity duration-200", !s.enabled && "opacity-70")}>
      <CardHeader
        icon={s.icon}
        tile={s.tile}
        title={
          <>
            <span className="truncate">{s.name}</span>
            {s.custom && <Badge tone="purple">Custom</Badge>}
            {s.isNew && <Badge tone="blue">New</Badge>}
          </>
        }
        description={categoryLabel[s.category]}
        actions={<Toggle size="xs" checked={s.enabled} onChange={onToggle} />}
      />
      <CardPanel className="flex flex-col gap-4">
        <p className="line-clamp-2 min-h-[40px] t-body text-ink-2">{s.description}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 t-caption text-ink-3">Runs on</span>
          {s.runsOn.map((r) => (
            <span key={r} className="inline-flex h-6 items-center gap-1 rounded-md bg-subtle px-1.5 t-caption-medium text-ink-2 [&_svg]:size-3.5 [&_svg]:text-icon">
              {sourceMeta[r].icon}
              {sourceMeta[r].label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-line pt-3">
          <TreeStructure className="size-3.5 text-icon-muted" />
          <span className="t-caption text-ink-3">
            <span className="t-num-sm text-ink-2">{s.runs}</span> runs this month
          </span>
          <span className="flex-1" />
          <Button size="xs" variant="outlined" tone="secondary" disabled={!s.enabled} iconRight={<ArrowRight className="size-3" />} onClick={onTry}>
            Try
          </Button>
        </div>
      </CardPanel>
    </Card>
  );
}

function CreateSkillDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (s: Skill) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("analysis");
  const [instructions, setInstructions] = useState("");
  const [access, setAccess] = useState<Record<Source, boolean>>({ prompts: true, site: true, content: false, sources: true, gsc: false });

  const reset = () => {
    setName("");
    setInstructions("");
    setCategory("analysis");
    setAccess({ prompts: true, site: true, content: false, sources: true, gsc: false });
  };
  const close = () => {
    reset();
    onClose();
  };
  const valid = name.trim().length > 1 && instructions.trim().length > 9 && Object.values(access).some(Boolean);

  const submit = () => {
    if (!valid) return;
    const tiles: TileColor[] = ["blue", "purple", "green", "orange", "pink"];
    onCreate({
      id: `custom-${Date.now()}`,
      name: name.trim(),
      description: instructions.trim().split("\n")[0].slice(0, 140),
      category,
      icon: <Sparkle weight="fill" />,
      tile: tiles[name.length % tiles.length],
      runsOn: (Object.keys(access) as Source[]).filter((k) => access[k]),
      prompt: `Run my “${name.trim()}” skill.`,
      runs: 0,
      enabled: true,
      custom: true,
    });
    reset();
  };

  const dataOptions: { key: Source; description: string; disabled?: boolean }[] = [
    { key: "prompts", description: "22 tracked prompts and their answers" },
    { key: "site", description: "Crawled pages and Site Health issues" },
    { key: "content", description: "Drafts and published content" },
    { key: "sources", description: "Domains and pages engines cite" },
    { key: "gsc", description: "Connect Search Console in Settings first", disabled: true },
  ];

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Create skill"
      description="Describe a workflow once. Sonya will follow it whenever the skill runs."
      footer={
        <>
          <Button variant="outlined" tone="secondary" onClick={close}>
            Cancel
          </Button>
          <Button disabled={!valid} onClick={submit}>
            Create skill
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px]">
          <Field label="Name">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Launch-week checklist" maxLength={48} />
          </Field>
          <Field label="Category">
            <Select
              value={category}
              onChange={setCategory}
              options={(Object.keys(categoryLabel) as Category[]).map((c) => ({ value: c, label: categoryLabel[c] }))}
            />
          </Field>
        </div>
        <Field
          label="Instructions"
          hint="Be specific: what to read, how to rank, what to output."
          aside={<span className="t-num-sm text-ink-3">{instructions.length}/2000</span>}
        >
          <Textarea
            rows={6}
            maxLength={2000}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={"When a new competitor shows up in AI answers:\n1. List the prompts where they appear\n2. Show which pages engines cite for them\n3. Suggest one response page"}
          />
        </Field>
        <Field label="Data access" hint="Sonya only reads what you allow.">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {dataOptions.map((o) => (
              <div key={o.key} className={cn("flex items-start gap-2.5 rounded-lg bg-canvas px-3 py-2.5", o.disabled && "opacity-60")}>
                <Checkbox
                  checked={access[o.key]}
                  disabled={o.disabled}
                  onChange={(v) => setAccess((a) => ({ ...a, [o.key]: v }))}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 t-body-medium text-ink [&_svg]:size-3.5 [&_svg]:text-icon">
                    {sourceMeta[o.key].icon}
                    {sourceMeta[o.key].label}
                  </div>
                  <div className="t-caption text-ink-3">{o.description}</div>
                </div>
              </div>
            ))}
          </div>
        </Field>
      </div>
    </Dialog>
  );
}
