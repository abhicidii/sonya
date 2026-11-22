import { useState } from "react";
import {
  ArrowRight,
  BellSimple,
  CalendarBlank,
  ChartLineUp,
  ChatCircleText,
  DotsThree,
  DownloadSimple,
  EnvelopeSimple,
  Export,
  Funnel,
  Globe,
  GridFour,
  Heartbeat,
  Lightning,
  ListBullets,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  SquaresFour,
} from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Checkbox,
  ChoiceChip,
  CountChip,
  DeltaPill,
  DeltaText,
  Field,
  IconButton,
  Input,
  Kbd,
  ModelMark,
  MODELS,
  Pagination,
  PillTabs,
  SearchInput,
  Segmented,
  Select,
  StatusPill,
  Table,
  Tabs,
  Td,
  Th,
  THead,
  Textarea,
  Toggle,
  Tr,
  type BadgeTone,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
  type ModelId,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { Block, Caption, Demo, KitSection, MonoLabel } from "./KitParts";

/* ========================================================================== */
/* Actions                                                                     */
/* ========================================================================== */

const TONES: ButtonTone[] = ["primary", "secondary", "danger"];
const VARIANTS: ButtonVariant[] = ["filled", "outlined", "link"];

export function ActionsSection() {
  const [size, setSize] = useState<ButtonSize>("sm");
  const [icons, setIcons] = useState(true);
  const [row, setRow] = useState<{ tone: ButtonTone; variant: ButtonVariant }>({ tone: "primary", variant: "filled" });
  const [busy, setBusy] = useState(false);

  const code = `<Button tone="${row.tone}" variant="${row.variant}" size="${size}"${icons ? " iconLeft={<Plus />}" : ""}>Add prompt</Button>`;

  return (
    <KitSection
      id="actions"
      title="Actions"
      description="Buttons are Type × Style × Size × State, like the Figma component. One primary filled button per view."
    >
      <Block
        title="Button"
        usage="Hover a row to update the code label. md 40 · sm 32 (app default) · xs 28."
        code={code}
        flush
        panelClassName="p-2"
        actions={
          <>
            <Toggle size="xs" checked={icons} onChange={setIcons} label="Icons" />
            <Segmented
              size="xs"
              value={size}
              onChange={setSize}
              options={[
                { value: "md", label: "md" },
                { value: "sm", label: "sm" },
                { value: "xs", label: "xs" },
              ]}
            />
          </>
        }
      >
        <Table>
          <THead>
            <tr>
              <Th className="w-40">tone / variant</Th>
              <Th>Default</Th>
              <Th>Trailing icon</Th>
              <Th>Disabled</Th>
              <Th>Loading</Th>
            </tr>
          </THead>
          <tbody>
            {TONES.flatMap((tone) =>
              VARIANTS.map((variant) => (
                <Tr
                  key={tone + variant}
                  selected={row.tone === tone && row.variant === variant}
                  onMouseEnter={() => setRow({ tone, variant })}
                  className="[&>td]:h-16"
                >
                  <Td>
                    <MonoLabel className="text-ink">{tone}</MonoLabel>
                    <MonoLabel className="text-ink-3"> / {variant}</MonoLabel>
                  </Td>
                  <Td>
                    <Button tone={tone} variant={variant} size={size} iconLeft={icons ? <Plus className="size-4" /> : undefined}>
                      {tone === "danger" ? "Delete" : "Add prompt"}
                    </Button>
                  </Td>
                  <Td>
                    <Button tone={tone} variant={variant} size={size} iconRight={icons ? <ArrowRight className="size-4" /> : undefined}>
                      Continue
                    </Button>
                  </Td>
                  <Td>
                    <Button tone={tone} variant={variant} size={size} disabled iconLeft={icons ? <Plus className="size-4" /> : undefined}>
                      Disabled
                    </Button>
                  </Td>
                  <Td>
                    <Button tone={tone} variant={variant} size={size} loading>
                      Saving…
                    </Button>
                  </Td>
                </Tr>
              )),
            )}
          </tbody>
        </Table>
      </Block>

      <div className="grid gap-4 xl:grid-cols-2">
        <Block title="IconButton" usage="Icon-only. `label` is required — it becomes aria-label and the native tooltip." code='<IconButton label="Export" size="sm"><Export /></IconButton>'>
          <div className="flex flex-col gap-4">
            {(
              [
                { tone: "secondary", variant: "outlined" },
                { tone: "secondary", variant: "link" },
                { tone: "secondary", variant: "filled" },
                { tone: "primary", variant: "filled" },
              ] as { tone: ButtonTone; variant: ButtonVariant }[]
            ).map((v) => (
              <div key={v.tone + v.variant} className="grid grid-cols-[140px_minmax(0,1fr)] items-center gap-3">
                <MonoLabel>
                  {v.tone} / {v.variant}
                </MonoLabel>
                <div className="flex items-center gap-2">
                  {(["md", "sm", "xs"] as ButtonSize[]).map((s) => (
                    <IconButton key={s} label={`Export (${s})`} tone={v.tone} variant={v.variant} size={s}>
                      <Export className={s === "xs" ? "size-3.5" : "size-4"} />
                    </IconButton>
                  ))}
                  <IconButton label="More actions" tone={v.tone} variant={v.variant} size="sm">
                    <DotsThree weight="bold" className="size-4" />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Async action" usage="Pass `loading` while a request runs — the button disables and swaps its icon for a spinner." code="<Button loading={saving}>Run prompts</Button>">
          <div className="flex h-full flex-col justify-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                loading={busy}
                iconLeft={<Lightning weight="fill" className="size-4" />}
                onClick={() => {
                  setBusy(true);
                  window.setTimeout(() => setBusy(false), 1600);
                }}
              >
                {busy ? "Running…" : "Run prompts"}
              </Button>
              <Button variant="outlined" iconLeft={<DownloadSimple className="size-4" />}>
                Export CSV
              </Button>
              <Button tone="secondary" variant="link" iconRight={<ArrowRight className="size-4" />}>
                View all
              </Button>
            </div>
            <Caption>Click “Run prompts” — it resolves after 1.6s.</Caption>
          </div>
        </Block>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Block title="DeltaPill · DeltaText" usage="Change vs prior period. `good` sets colour, `direction` sets the arrow — position going down is good." code='<DeltaPill value="+3.2 pts" direction="up" />'>
          <div className="grid gap-5 sm:grid-cols-2">
            <Demo label="Up · good">
              <DeltaPill value="+3.2 pts" direction="up" />
              <DeltaPill value="+3.2" direction="up" size="xs" />
            </Demo>
            <Demo label="Down · bad">
              <DeltaPill value="1.4 pts" direction="down" />
              <DeltaPill value="1.4" direction="down" size="xs" />
            </Demo>
            <Demo label="Rank down · good">
              <DeltaPill value="0.3" direction="down" good />
              <DeltaPill value="#1.6" direction="down" good size="xs" />
            </Demo>
            <Demo label="Flat · DeltaText">
              <DeltaPill value="0.0" direction="flat" />
              <DeltaText value="+4.1" good />
              <DeltaText value="−2.6" good={false} />
              <DeltaText value="0" good={null} />
            </Demo>
          </div>
        </Block>

        <Block title="StatusPill · Badge · CountChip" usage="StatusPill for state, Badge for short labels, CountChip beside section titles." code='<Badge tone="blue">Beta</Badge>'>
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              <StatusPill tone="success">Live</StatusPill>
              <StatusPill tone="warning">Behind goal</StatusPill>
              <StatusPill tone="danger">Failed</StatusPill>
              <StatusPill tone="info">Running</StatusPill>
              <StatusPill tone="neutral">Draft</StatusPill>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["neutral", "inverse", "outline", "blue", "green", "orange", "red", "purple", "pink"] as BadgeTone[]).map((t) => (
                <Badge key={t} tone={t}>
                  {t === "inverse" ? "You" : t === "purple" ? "Scale" : t === "blue" ? "Beta" : t === "green" ? "New" : t === "orange" ? "Partial" : t === "red" ? "Error" : t === "pink" ? "AI" : t === "outline" ? "Pro" : "Draft"}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="t-heading text-ink">Sites</span>
              <CountChip>4</CountChip>
              <span className="t-heading text-ink">Prompts</span>
              <CountChip>22</CountChip>
            </div>
          </div>
        </Block>
      </div>
    </KitSection>
  );
}

/* ========================================================================== */
/* Inputs                                                                      */
/* ========================================================================== */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function InputsSection() {
  const [email, setEmail] = useState("maya@lumen");
  const [note, setNote] = useState("Track how Perplexity cites our pricing page.");
  const [items, setItems] = useState({ chatgpt: true, perplexity: true, gemini: false });
  const [toggles, setToggles] = useState({ alerts: true, weekly: false });
  const [chips, setChips] = useState<ModelId[]>(["chatgpt", "perplexity"]);
  const [range, setRange] = useState("7d");
  const [site, setSite] = useState("lumen");
  const [industry, setIndustry] = useState("analytics");

  const all = Object.values(items);
  const checkedCount = all.filter(Boolean).length;
  const emailErr = email && !EMAIL.test(email) ? "Enter a valid email, like maya@lumen.so" : undefined;

  return (
    <KitSection id="inputs" title="Inputs" description="Inputs use shadow-input and a blue focus ring. Every field sits inside <Field> for its label, hint and error.">
      <div className="grid gap-4 xl:grid-cols-2">
        <Block title="Input · SearchInput · Textarea" usage="Default sm (32px) in app chrome, md (40px) in forms and auth." code='<Input size="md" iconLeft={<Globe />} placeholder="lumen.so" />'>
          <div className="flex flex-col gap-4">
            <Demo label="md · leading icon" className="[&>div]:w-full">
              <Input size="md" iconLeft={<Globe />} placeholder="lumen.so" wrapperClassName="w-full" />
            </Demo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Demo label="SearchInput · shortcut" className="[&>div]:w-full">
                <SearchInput shortcut="⌘K" wrapperClassName="w-full" />
              </Demo>
              <Demo label="Trailing unit" className="[&>div]:w-full">
                <Input defaultValue="40" trailing={<span className="t-caption text-ink-3">% goal</span>} wrapperClassName="w-full" className="t-num" />
              </Demo>
              <Demo label="Disabled" className="[&>div]:w-full">
                <Input disabled value="lumen.so" readOnly wrapperClassName="w-full" iconLeft={<Globe />} />
              </Demo>
              <Demo label="Invalid" className="[&>div]:w-full">
                <Input invalid defaultValue="lumen" wrapperClassName="w-full" />
              </Demo>
            </div>
            <Demo label={`Textarea · ${note.length}/160`} className="[&>div]:w-full">
              <Textarea rows={3} maxLength={160} value={note} onChange={(e) => setNote(e.target.value)} />
            </Demo>
          </div>
        </Block>

        <Block title="Field" usage="Label, optional aside, then a hint — swapped for an error when validation fails. Try fixing the email." code='<Field label="Work email" error={error}><Input invalid={!!error} /></Field>'>
          <div className="flex flex-col gap-5">
            <Field label="Work email" hint="We’ll send weekly reports here." error={emailErr}>
              <Input size="md" iconLeft={<EnvelopeSimple />} value={email} invalid={!!emailErr} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Brand name" aside={<span className="t-caption text-ink-3">Required</span>} hint="Shown in reports and share links.">
              <Input size="md" defaultValue="Lumen" />
            </Field>
            <Field label="Industry">
              <div>
                <Select
                  label="Industry"
                  value={industry}
                  onChange={setIndustry}
                  options={[
                    { value: "analytics", label: "Product analytics" },
                    { value: "saas", label: "B2B SaaS" },
                    { value: "fintech", label: "Fintech" },
                  ]}
                />
              </div>
            </Field>
          </div>
        </Block>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Block title="Checkbox" usage="Use indeterminate on a parent when some children are checked." code="<Checkbox checked indeterminate={some} onChange={…} />">
          <div className="flex flex-col gap-3">
            <Checkbox
              checked={checkedCount === all.length}
              indeterminate={checkedCount > 0 && checkedCount < all.length}
              onChange={(v) => setItems({ chatgpt: v, perplexity: v, gemini: v })}
              label={<span className="t-body-medium">All models</span>}
            />
            <div className="ml-6 flex flex-col gap-2.5">
              {(Object.keys(items) as (keyof typeof items)[]).map((k) => (
                <Checkbox key={k} checked={items[k]} onChange={(v) => setItems((s) => ({ ...s, [k]: v }))} label={MODELS[k].name} />
              ))}
            </div>
            <Checkbox checked={false} disabled label={<span className="text-ink-3">Copilot · Scale plan</span>} />
          </div>
        </Block>

        <Block title="Toggle" usage="For settings that apply immediately. sm in forms, xs in card headers." code='<Toggle checked={on} onChange={setOn} label="Alerts" />'>
          <div className="flex flex-col gap-4">
            <Toggle checked={toggles.alerts} onChange={(v) => setToggles((s) => ({ ...s, alerts: v }))} label="Visibility drop alerts" />
            <Toggle checked={toggles.weekly} onChange={(v) => setToggles((s) => ({ ...s, weekly: v }))} label="Weekly email digest" />
            <Toggle size="xs" checked={toggles.alerts} onChange={(v) => setToggles((s) => ({ ...s, alerts: v }))} label="Competitors (xs)" />
            <Toggle checked disabled onChange={() => {}} label="Daily runs (locked)" />
          </div>
        </Block>

        <Block title="ChoiceChip · Select" usage="Chips for multi-select pickers, Select for one value from a menu." code='<ChoiceChip selected={on} icon={<ModelMark id="chatgpt" size={16} />}>ChatGPT</ChoiceChip>'>
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              {(["chatgpt", "perplexity", "gemini", "claude"] as ModelId[]).map((m) => (
                <ChoiceChip
                  key={m}
                  selected={chips.includes(m)}
                  onClick={() => setChips((c) => (c.includes(m) ? c.filter((x) => x !== m) : [...c, m]))}
                  icon={<ModelMark id={m} size={16} />}
                >
                  {MODELS[m].name}
                </ChoiceChip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                label="Date range"
                icon={<CalendarBlank />}
                value={range}
                onChange={setRange}
                options={[
                  { value: "24h", label: "Last 24 hours" },
                  { value: "7d", label: "Last 7 days" },
                  { value: "30d", label: "Last 30 days" },
                  { value: "90d", label: "Last 90 days" },
                ]}
              />
              <Select
                label="Site"
                value={site}
                onChange={setSite}
                options={[
                  { value: "lumen", label: "lumen.so", icon: <Globe />, description: "Production · 142 pages" },
                  { value: "docs", label: "docs.lumen.so", icon: <Globe />, description: "Docs · 88 pages" },
                ]}
              />
            </div>
          </div>
        </Block>
      </div>
    </KitSection>
  );
}

/* ========================================================================== */
/* Navigation                                                                  */
/* ========================================================================== */

export function NavigationSection() {
  const [view, setView] = useState("grid");
  const [gran, setGran] = useState("w");
  const [scope, setScope] = useState("all");
  const [tab, setTab] = useState("visibility");
  const [pill, setPill] = useState("all");
  const [nav, setNav] = useState("insights");
  const [page, setPage] = useState(2);

  const navItems = [
    { id: "insights", label: "AEO Insights", icon: <ChartLineUp weight="duotone" /> },
    { id: "prompts", label: "Prompts", icon: <ChatCircleText weight="duotone" />, count: 22 },
    { id: "health", label: "Site Health", icon: <Heartbeat weight="duotone" />, badge: "New" },
    { id: "alerts", label: "Alerts", icon: <BellSimple weight="duotone" /> },
  ];

  const tabLabels: Record<string, string> = {
    visibility: "Visibility — share of answers that mention you.",
    sources: "Sources — domains AI engines cite for your prompts.",
    sentiment: "Sentiment — how answers describe your brand.",
    topics: "Topics — visibility grouped by theme.",
  };

  return (
    <KitSection id="navigation" title="Navigation" description="Segmented for view switches, underline Tabs for sub-pages, PillTabs for filters, plus sidebar items and keyboard hints.">
      <div className="grid gap-4 xl:grid-cols-2">
        <Block title="Segmented" usage="Switch views of the same data. Active segment lifts with shadow-control." code='<Segmented value={v} onChange={setV} options={[…]} />'>
          <div className="flex flex-col gap-5">
            <Demo label="sm · icons">
              <Segmented
                value={view}
                onChange={setView}
                options={[
                  { value: "grid", label: "Grid", icon: <GridFour /> },
                  { value: "list", label: "List", icon: <ListBullets /> },
                ]}
              />
            </Demo>
            <Demo label="xs · granularity">
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
            </Demo>
            <Demo label="stretch · counts" className="[&>div]:w-full">
              <Segmented
                stretch
                value={scope}
                onChange={setScope}
                options={[
                  { value: "all", label: "All", count: 22 },
                  { value: "active", label: "Active", count: 15 },
                  { value: "suggested", label: "Suggested", count: 5 },
                ]}
              />
            </Demo>
          </div>
        </Block>

        <Block title="Tabs · PillTabs" usage="Underline tabs for sub-navigation; pill tabs for lightweight filters." code='<Tabs value={tab} onChange={setTab} options={[{ value: "visibility", label: "Visibility" }]} />'>
          <div className="flex flex-col gap-5">
            <div>
              <TabsDemo value={tab} onChange={setTab} />
              <p className="mt-3 t-caption text-ink-2">{tabLabels[tab]}</p>
            </div>
            <Demo label="PillTabs">
              <PillTabs
                value={pill}
                onChange={setPill}
                options={[
                  { value: "all", label: "All videos", count: 12 },
                  { value: "prompts", label: "Prompts" },
                  { value: "content", label: "Content" },
                  { value: "reports", label: "Reports" },
                ]}
              />
            </Demo>
          </div>
        </Block>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Block title="Sidebar nav item" usage="32px rows on bg-canvas. Active lifts onto the surface with shadow-nav-active. The right column is live." code='<NavLink className={isActive ? "bg-surface shadow-nav-active" : "hover:bg-subtle"} />'>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-xl bg-canvas p-3">
              {[
                { state: "Default", cls: "text-ink-2" },
                { state: "Hover", cls: "bg-subtle text-ink" },
                { state: "Active", cls: "bg-surface text-ink shadow-nav-active" },
              ].map((s) => (
                <div key={s.state} className="flex items-center gap-3">
                  <span className={cn("flex h-8 flex-1 items-center gap-2 rounded-lg px-2 t-label", s.cls)}>
                    <SquaresFour weight="duotone" className={cn("size-4", s.state === "Active" ? "text-icon-strong" : "text-icon")} />
                    Overview
                  </span>
                  <span className="w-14 t-caption text-ink-3">{s.state}</span>
                </div>
              ))}
            </div>
            <nav className="flex flex-col gap-0.5 rounded-xl bg-canvas p-3" aria-label="Demo navigation">
              {navItems.map((it) => {
                const active = nav === it.id;
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setNav(it.id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-8 items-center gap-2 rounded-lg px-2 text-left t-label transition-[background-color,color,box-shadow] duration-150 [&_svg]:size-4",
                      active ? "bg-surface text-ink shadow-nav-active" : "text-ink-2 hover:bg-subtle hover:text-ink",
                    )}
                  >
                    <span className={active ? "text-icon-strong" : "text-icon"}>{it.icon}</span>
                    <span className="flex-1 truncate">{it.label}</span>
                    {it.badge && <Badge tone="blue">{it.badge}</Badge>}
                    {it.count !== undefined && <span className="rounded bg-surface px-1.5 t-num-sm text-ink-2 shadow-control-soft">{it.count}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        </Block>

        <Block title="Kbd · Pagination" usage="Show shortcuts next to the action they trigger. Pagination sits under tables." code="<Kbd>⌘K</Kbd>  ·  <Pagination page={p} pages={8} onChange={setP} />">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <span className="inline-flex items-center gap-1.5 t-caption text-ink-2">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd> Search
              </span>
              <span className="inline-flex items-center gap-1.5 t-caption text-ink-2">
                <Kbd>↵</Kbd> Continue
              </span>
              <span className="inline-flex items-center gap-1.5 t-caption text-ink-2">
                <Kbd>Esc</Kbd> Close
              </span>
              <span className="inline-flex items-center gap-1.5 t-caption text-ink-2">
                <Kbd>⇧</Kbd>
                <Kbd>E</Kbd> Export
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input iconLeft={<MagnifyingGlass />} placeholder="Jump to…" wrapperClassName="flex-1" trailing={<Kbd>/</Kbd>} />
              <IconButton label="Filter">
                <Funnel className="size-4" />
              </IconButton>
            </div>
            <div className="-mx-3 rounded-lg">
              <Pagination page={page} pages={8} onChange={setPage} total={176} label="prompts" />
            </div>
          </div>
        </Block>
      </div>
    </KitSection>
  );
}

function TabsDemo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Tabs
      value={value}
      onChange={onChange}
      options={[
        { value: "visibility", label: "Visibility", icon: <ChartLineUp /> },
        { value: "sources", label: "Sources", count: 12 },
        { value: "sentiment", label: "Sentiment" },
        { value: "topics", label: "Topics", icon: <PencilSimple />, count: 8 },
      ]}
    />
  );
}

