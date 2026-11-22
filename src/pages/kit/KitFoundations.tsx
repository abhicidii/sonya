import { useEffect, useState, type CSSProperties } from "react";
import {
  ChartBar,
  ChatCircleDots,
  Cube,
  Eye,
  Hash,
  Lightning,
  Medal,
  Palette,
  SealCheck,
  Smiley,
  Stack,
  Target,
  TextAa,
} from "@phosphor-icons/react";
import {
  Badge,
  DeltaPill,
  Input,
  PillTabs,
  SonyaLogo,
  StatusDot,
  StatusPill,
  Table,
  Td,
  Th,
  THead,
  Tile,
  TickMeter,
  Tr,
  GroupRow,
  useToast,
  type TileColor,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Theme } from "@/lib/theme";
import { Block, Caption, KitSection, MonoLabel } from "./KitParts";

/* ========================================================================== */
/* Data — mirrors src/styles/tokens.css + index.css                            */
/* ========================================================================== */

const PRIMITIVES: { family: string; key: string; steps: [string, string][] }[] = [
  {
    family: "Neutral",
    key: "neutral",
    steps: [
      ["0", "#ffffff"], ["25", "#fcfcfc"], ["50", "#f7f7f7"], ["100", "#f0f0ef"], ["150", "#ebebeb"], ["200", "#e5e5e5"], ["300", "#d6d6d6"],
      ["400", "#a3a3a3"], ["500", "#737373"], ["600", "#525252"], ["700", "#424242"], ["800", "#292929"], ["900", "#141414"], ["950", "#0f0f0f"],
    ],
  },
  {
    family: "Blue",
    key: "blue",
    steps: [
      ["25", "#f5faff"], ["50", "#eff8ff"], ["100", "#d1e9ff"], ["200", "#b2ddff"], ["300", "#84caff"], ["400", "#53b1fd"],
      ["500", "#2e90fa"], ["600", "#1570ef"], ["700", "#175cd3"], ["800", "#1849a9"], ["900", "#194185"],
    ],
  },
  { family: "Green", key: "green", steps: [["50", "#edfcf2"], ["100", "#d3f8df"], ["300", "#73e2a3"], ["400", "#3ccb7f"], ["500", "#16b364"], ["600", "#099250"], ["700", "#087443"]] },
  { family: "Red", key: "red", steps: [["50", "#fef3f2"], ["100", "#fee4e2"], ["300", "#fda29b"], ["400", "#f97066"], ["500", "#f04438"], ["600", "#d92d20"], ["700", "#b42318"]] },
  { family: "Orange", key: "orange", steps: [["50", "#fff6e5"], ["100", "#ffe8bf"], ["400", "#ffa100"], ["500", "#ff8000"], ["700", "#b36f00"]] },
  { family: "Purple", key: "purple", steps: [["50", "#f4efff"], ["500", "#7b42ff"], ["600", "#4f07f7"]] },
  { family: "Pink", key: "pink", steps: [["50", "#fdf0fa"], ["400", "#eb5ec0"], ["500", "#ff2bf8"], ["600", "#e708a4"]] },
];

type TokenKind = "bg" | "text" | "border" | "icon";
interface SemanticToken {
  group: string;
  cls: string;
  v: string;
  usage: string;
  kind: TokenKind;
}

const SEMANTIC: SemanticToken[] = [
  { group: "Background", cls: "bg-frame", v: "--bg-frame", usage: "App frame behind sidebar and panel", kind: "bg" },
  { group: "Background", cls: "bg-canvas", v: "--bg-canvas", usage: "Sidebar, card shells, showcase panels", kind: "bg" },
  { group: "Background", cls: "bg-surface", v: "--bg-surface", usage: "Main panel, inner panels, controls", kind: "bg" },
  { group: "Background", cls: "bg-subtle", v: "--bg-subtle", usage: "Secondary filled buttons, total rows, tracks", kind: "bg" },
  { group: "Background", cls: "bg-hover", v: "--bg-hover", usage: "Hover on subtle surfaces", kind: "bg" },
  { group: "Background", cls: "bg-muted", v: "--bg-muted", usage: "Off toggles, empty level bars", kind: "bg" },
  { group: "Background", cls: "bg-inverse", v: "--bg-inverse", usage: "Tooltips, “You” badges", kind: "bg" },
  { group: "Background", cls: "bg-brand-subtle", v: "--bg-brand-subtle", usage: "Selected rows, chart selection", kind: "bg" },
  { group: "Background", cls: "bg-success-subtle", v: "--bg-success-subtle", usage: "Positive delta pills", kind: "bg" },
  { group: "Background", cls: "bg-danger-subtle", v: "--bg-danger-subtle", usage: "Negative delta pills, destructive hover", kind: "bg" },
  { group: "Background", cls: "bg-warning-subtle", v: "--bg-warning-subtle", usage: "Warning badges", kind: "bg" },
  { group: "Background", cls: "bg-scrim", v: "--bg-scrim", usage: "Dialog and drawer backdrop", kind: "bg" },
  { group: "Text", cls: "text-ink", v: "--text-primary", usage: "Headings, values, primary copy", kind: "text" },
  { group: "Text", cls: "text-ink-2", v: "--text-secondary", usage: "Body copy, labels, inactive tabs", kind: "text" },
  { group: "Text", cls: "text-ink-3", v: "--text-tertiary", usage: "Meta, hints, placeholders", kind: "text" },
  { group: "Text", cls: "text-on-inverse", v: "--text-inverse", usage: "Text on inverse surfaces", kind: "text" },
  { group: "Text", cls: "text-success", v: "--text-success", usage: "Positive deltas and status", kind: "text" },
  { group: "Text", cls: "text-danger", v: "--text-danger", usage: "Errors, negative deltas", kind: "text" },
  { group: "Text", cls: "text-warning", v: "--text-warning", usage: "Warnings", kind: "text" },
  { group: "Text", cls: "text-brand", v: "--text-brand", usage: "Links, info status", kind: "text" },
  { group: "Border", cls: "border-line", v: "--border-default", usage: "Hairline dividers inside panels", kind: "border" },
  { group: "Border", cls: "border-line-strong", v: "--border-strong", usage: "Emphasised dividers, centre lines", kind: "border" },
  { group: "Border", cls: "border-line-brand", v: "--border-brand", usage: "Focus and selection outlines", kind: "border" },
  { group: "Border", cls: "--ring-1", v: "--ring-1", usage: "1px shadow rings on avatars", kind: "border" },
  { group: "Icon", cls: "text-icon", v: "--icon-default", usage: "Default control and nav icons", kind: "icon" },
  { group: "Icon", cls: "text-icon-subtle", v: "--icon-subtle", usage: "Carets, trailing icons", kind: "icon" },
  { group: "Icon", cls: "text-icon-muted", v: "--icon-muted", usage: "Leading icons inside inputs", kind: "icon" },
  { group: "Icon", cls: "text-icon-strong", v: "--icon-strong", usage: "Active nav icon", kind: "icon" },
  { group: "Icon", cls: "--icon-disabled", v: "--icon-disabled", usage: "Disabled and pending glyphs", kind: "icon" },
  { group: "Status", cls: "bg-status-success", v: "--status-success", usage: "Success dot, healthy score", kind: "bg" },
  { group: "Status", cls: "bg-status-warning", v: "--status-warning", usage: "Warning dot, mid score", kind: "bg" },
  { group: "Status", cls: "bg-status-danger", v: "--status-danger", usage: "Danger dot, low score", kind: "bg" },
  { group: "Data", cls: "bg-data-1", v: "--data-1", usage: "Primary series — your brand", kind: "bg" },
  { group: "Data", cls: "bg-data-1-hi", v: "--data-1-highlight", usage: "Hovered primary series", kind: "bg" },
  { group: "Data", cls: "bg-data-2", v: "--data-2", usage: "Secondary stacked series", kind: "bg" },
  { group: "Data", cls: "bg-data-ghost", v: "--data-ghost", usage: "Empty dot-matrix cells, donut track", kind: "bg" },
  { group: "Data", cls: "--data-target", v: "--data-target", usage: "Dashed goal lines", kind: "bg" },
  { group: "Data", cls: "--data-grid", v: "--data-grid", usage: "Chart grid lines", kind: "bg" },
  { group: "Accent", cls: "bg-blue", v: "--accent-blue", usage: "Blue tiles and KPI accents", kind: "bg" },
  { group: "Accent", cls: "bg-orange", v: "--accent-orange", usage: "Orange tiles and KPI accents", kind: "bg" },
  { group: "Accent", cls: "bg-green", v: "--accent-green", usage: "Green tiles and KPI accents", kind: "bg" },
  { group: "Accent", cls: "bg-purple", v: "--accent-purple", usage: "Purple tiles, Scale badge", kind: "bg" },
  { group: "Accent", cls: "bg-pink", v: "--accent-pink", usage: "Pink tiles and KPI accents", kind: "bg" },
  { group: "Primary", cls: "bg-primary", v: "--primary-bg", usage: "Primary filled button", kind: "bg" },
  { group: "Primary", cls: "bg-primary-hover", v: "--primary-bg-hover", usage: "Primary hover", kind: "bg" },
  { group: "Primary", cls: "bg-primary-pressed", v: "--primary-bg-pressed", usage: "Primary pressed", kind: "bg" },
  { group: "Primary", cls: "text-on-primary", v: "--primary-fg", usage: "Label on primary", kind: "text" },
];

const TOKEN_GROUPS = ["All", ...Array.from(new Set(SEMANTIC.map((t) => t.group)))];

const TYPE_STYLES = [
  { cls: "t-display", font: "Geist", size: 24, line: "1.2", weight: 500, track: "−2.5%", use: "Hero copy, auth and section headings", sample: "See how AI talks about you" },
  { cls: "t-title", font: "Inter", size: 18, line: "24px", weight: 500, track: "−1.4%", use: "Page titles in the 64px header", sample: "AEO Insights" },
  { cls: "t-heading", font: "Geist", size: 15, line: "1.2", weight: 500, track: "−1.75%", use: "Card titles", sample: "Visibility by model" },
  { cls: "t-label", font: "Geist", size: 14, line: "1", weight: 500, track: "−1.5%", use: "Buttons, nav items, tabs", sample: "Continue to Prompts" },
  { cls: "t-body", font: "Geist", size: 14, line: "1.4", weight: 400, track: "−1.5%", use: "Default body copy", sample: "Lumen is mentioned in 42% of answers this week." },
  { cls: "t-body-medium", font: "Geist", size: 14, line: "1.4", weight: 500, track: "−1.5%", use: "List titles, emphasised body", sample: "What is the best product analytics tool?" },
  { cls: "t-caption", font: "Geist", size: 12, line: "1.4", weight: 400, track: "−1%", use: "Meta, hints, table headers", sample: "Last 7 days · 22 prompts × 6 models" },
  { cls: "t-caption-medium", font: "Geist", size: 12, line: "1.4", weight: 500, track: "−1%", use: "Field labels, small buttons", sample: "Work email" },
  { cls: "t-micro", font: "Geist", size: 11, line: "1", weight: 500, track: "−1.5%", use: "Badges", sample: "PRO · BETA · NEW" },
  { cls: "t-num-xl", font: "Geist Mono", size: 32, line: "1.1", weight: 500, track: "−4%", use: "Hero metrics", sample: "41.8%" },
  { cls: "t-num-lg", font: "Geist Mono", size: 24, line: "1.2", weight: 500, track: "−4%", use: "KPI values", sample: "12,850" },
  { cls: "t-num", font: "Geist Mono", size: 14, line: "1.4", weight: 500, track: "−2%", use: "Table numbers", sample: "#1.6 · 18.4%" },
  { cls: "t-num-sm", font: "Geist Mono", size: 12, line: "1.4", weight: 400, track: "−1%", use: "Counts, axis labels", sample: "1,284 mentions" },
  { cls: "t-num-sm-medium", font: "Geist Mono", size: 12, line: "1.4", weight: 500, track: "−1.5%", use: "Inline deltas", sample: "+3.2 pts" },
  { cls: "t-wordmark", font: "Geist", size: 19, line: "1", weight: 600, track: "−4%", use: "Sonya wordmark", sample: "Sonya" },
];

const SHADOWS = [
  { cls: "shadow-xs", v: "--fx-xs", use: "Toggle knobs, tiny lifts" },
  { cls: "shadow-xs-faint", v: "--fx-xs-faint", use: "Faint lift on flat chips" },
  { cls: "shadow-card", v: "--fx-card", use: "Card shells and inner panels" },
  { cls: "shadow-control", v: "--fx-control", use: "Outlined primary controls, chips" },
  { cls: "shadow-control-soft", v: "--fx-control-soft", use: "Secondary outlined controls, pills" },
  { cls: "shadow-input", v: "--fx-input", use: "Text inputs and textareas" },
  { cls: "shadow-panel", v: "--fx-panel", use: "Main app panel" },
  { cls: "shadow-tooltip", v: "--fx-tooltip", use: "Tooltips, chart tooltips" },
  { cls: "shadow-popover", v: "--fx-popover", use: "Menus, dialogs, toasts" },
  { cls: "shadow-button-primary", v: "--fx-button-primary", use: "Primary filled button" },
  { cls: "shadow-nav-active", v: "--fx-nav-active", use: "Active nav item" },
  { cls: "shadow-inner-ring", v: "--fx-inner-ring", use: "Hairline ring on media" },
  { cls: "shadow-focus", v: "--fx-focus", use: "Keyboard focus ring" },
];

const TILE_COLORS: TileColor[] = ["blue", "orange", "green", "pink", "purple", "ink"];
const TILE_SIZES = ["xs", "sm", "md", "lg", "xl"] as const;

const SPACING = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
const RADII = [
  { r: 4, use: "Badges" },
  { r: 6, use: "xs buttons, tiles" },
  { r: 8, use: "Buttons, inputs, nav" },
  { r: 10, use: "md buttons, segmented" },
  { r: 12, use: "Inner panels" },
  { r: 16, use: "Cards, main panel" },
  { r: 20, use: "Showcase panels" },
  { r: 999, use: "Pills, avatars" },
];

export const KIT_COUNTS = {
  primitives: PRIMITIVES.reduce((a, f) => a + f.steps.length, 0),
  semantic: SEMANTIC.length,
  type: TYPE_STYLES.length,
  shadows: SHADOWS.length,
};

/* ========================================================================== */
/* Overview                                                                    */
/* ========================================================================== */

export function OverviewSection() {
  const principles = [
    { icon: <Stack weight="fill" />, tile: "blue" as TileColor, title: "Two-layer cards", body: "A canvas shell holds the title and meta; a white inner panel holds the content." },
    { icon: <Cube weight="fill" />, tile: "orange" as TileColor, title: "Shadows, not borders", body: "Depth comes from soft shadows and 1px shadow rings. Hairlines only divide rows." },
    { icon: <Hash weight="bold" />, tile: "green" as TileColor, title: "Every number in mono", body: "Values, deltas and counts use Geist Mono with tabular figures, so columns align." },
    { icon: <Palette weight="fill" />, tile: "pink" as TileColor, title: "Semantic tokens only", body: "Components read semantic tokens, so light and dark are a remap — not a rewrite." },
  ];
  const stats = [
    { value: "58", label: "components" },
    { value: String(KIT_COUNTS.primitives + KIT_COUNTS.semantic), label: "colour tokens" },
    { value: "8", label: "chart types" },
    { value: "2", label: "themes" },
  ];
  return (
    <KitSection
      id="overview"
      title="Sonya UI Kit"
      description="A calm, data-dense dashboard kit for AI visibility (AEO) products. Every block below is the live React component — switch the theme at the top to see the token remap."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-2xl bg-canvas p-6 shadow-card sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
            style={{ backgroundImage: "radial-gradient(var(--border-strong) 1px, transparent 1.2px)", backgroundSize: "14px 14px" }}
          />
          <div className="relative">
            <SonyaLogo size={40} />
            <p className="mt-5 max-w-md t-body text-ink-2">
              React 18 · Vite · TypeScript · Tailwind v4 · Phosphor icons. Built from the Figma Documentation frame — same tokens, same names.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["React 18", "TypeScript", "Tailwind v4", "Phosphor", "Light + dark", "Responsive"].map((t) => (
                <Badge key={t} tone="outline">
                  {t}
                </Badge>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="t-num-xl text-ink">{s.value}</div>
                  <div className="mt-1 t-caption text-ink-2">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {principles.map((p) => (
            <div key={p.title} className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-card">
              <Tile color={p.tile} size="lg">
                {p.icon}
              </Tile>
              <div>
                <div className="t-body-medium text-ink">{p.title}</div>
                <p className="mt-1 t-caption text-ink-2">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </KitSection>
  );
}

/* ========================================================================== */
/* Colour                                                                      */
/* ========================================================================== */

export function ColourSection({ theme }: { theme: Theme }) {
  const toast = useToast();
  const [group, setGroup] = useState("All");
  const [resolved, setResolved] = useState<Record<string, string>>({});

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const map: Record<string, string> = {};
    SEMANTIC.forEach((t) => (map[t.v] = cs.getPropertyValue(t.v).trim()));
    setResolved(map);
  }, [theme]);

  const rows = group === "All" ? SEMANTIC : SEMANTIC.filter((t) => t.group === group);
  const groups = Array.from(new Set(rows.map((r) => r.group)));

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => toast({ title: `Copied ${text}` }),
      () => toast({ tone: "warning", title: "Couldn’t access the clipboard" }),
    );
  };

  return (
    <KitSection
      id="colour"
      title="Colour"
      description="Two layers, like the Figma file. Primitives are the raw palette and never appear in components; semantic tokens map them per theme."
    >
      <Block title="Primitives" usage="Raw palette from tokens.css. Click a swatch to copy its hex." code="var(--blue-500)  /* primitives: reference only from semantic tokens */">
        <div className="flex flex-col gap-4">
          {PRIMITIVES.map((f) => (
            <div key={f.key} className="grid gap-2 sm:grid-cols-[88px_minmax(0,1fr)] sm:items-center sm:gap-4">
              <div className="t-caption-medium text-ink">{f.family}</div>
              <div className="grid auto-cols-[minmax(58px,1fr)] grid-flow-col gap-1.5 overflow-x-auto pb-1">
                {f.steps.map(([step, hex]) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => copy(hex)}
                    title={`--${f.key}-${step} · ${hex}`}
                    className="group flex flex-col overflow-hidden rounded-[10px] bg-surface text-left shadow-control-soft transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span className="h-12 w-full shadow-[inset_0_-1px_0_var(--ring-1)]" style={{ background: `var(--${f.key}-${step})` }} />
                    <span className="flex flex-col gap-0.5 px-2 py-1.5">
                      <span className="t-caption-medium text-ink">{step}</span>
                      <span className="t-num-sm text-[11px] text-ink-3">{hex.slice(1)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block
        title="Semantic tokens"
        usage={`Resolved live for the ${theme} theme. Use the Tailwind class in components; the CSS variable is what themes remap.`}
        code='<div className="bg-surface text-ink border-line" />'
        flush
        panelClassName="p-2"
        actions={<PillTabs value={group} onChange={setGroup} options={TOKEN_GROUPS.map((g) => ({ value: g, label: g }))} />}
      >
        <Table>
          <THead>
            <tr>
              <Th>Token</Th>
              <Th>Preview</Th>
              <Th>CSS variable</Th>
              <Th>Value · {theme}</Th>
              <Th>Usage</Th>
            </tr>
          </THead>
          <tbody>
            {groups.map((g) => (
              <TokenGroup key={g} group={g} rows={rows.filter((r) => r.group === g)} resolved={resolved} showHeader={group === "All"} onCopy={copy} />
            ))}
          </tbody>
        </Table>
      </Block>
    </KitSection>
  );
}

function TokenGroup({
  group,
  rows,
  resolved,
  showHeader,
  onCopy,
}: {
  group: string;
  rows: SemanticToken[];
  resolved: Record<string, string>;
  showHeader: boolean;
  onCopy: (s: string) => void;
}) {
  return (
    <>
      {showHeader && (
        <GroupRow colSpan={5}>
          <span className="t-caption-medium">{group}</span> <span className="t-num-sm text-ink-3">{rows.length}</span>
        </GroupRow>
      )}
      {rows.map((t) => (
        <Tr key={t.v} interactive onClick={() => onCopy(t.cls.startsWith("--") ? `var(${t.v})` : t.cls)}>
          <Td className="whitespace-nowrap">
            <MonoLabel className="text-ink">{t.cls.startsWith("--") ? "—" : t.cls}</MonoLabel>
          </Td>
          <Td>
            <TokenPreview token={t} />
          </Td>
          <Td className="whitespace-nowrap">
            <MonoLabel>{t.v}</MonoLabel>
          </Td>
          <Td className="whitespace-nowrap">
            <MonoLabel className="text-ink-3">{resolved[t.v] || "…"}</MonoLabel>
          </Td>
          <Td className="min-w-[220px] t-caption text-ink-2">{t.usage}</Td>
        </Tr>
      ))}
    </>
  );
}

function TokenPreview({ token }: { token: SemanticToken }) {
  const v = `var(${token.v})`;
  if (token.kind === "text")
    return (
      <span className="inline-grid h-7 w-12 place-items-center rounded-md bg-canvas text-[15px] font-semibold shadow-inner-ring" style={{ color: v, background: token.v === "--text-inverse" || token.v === "--primary-fg" ? "var(--bg-inverse)" : undefined }}>
        Aa
      </span>
    );
  if (token.kind === "icon")
    return (
      <span className="inline-grid h-7 w-12 place-items-center rounded-md bg-canvas shadow-inner-ring" style={{ color: v }}>
        <Lightning weight="fill" className="size-4" />
      </span>
    );
  if (token.kind === "border") return <span className="block h-7 w-12 rounded-md bg-surface" style={{ boxShadow: `inset 0 0 0 1.5px ${v}` }} />;
  return <span className="block h-7 w-12 rounded-md shadow-[inset_0_0_0_1px_var(--ring-1)]" style={{ background: v }} />;
}

/* ========================================================================== */
/* Typography                                                                  */
/* ========================================================================== */

export function TypographySection() {
  const [sample, setSample] = useState("");
  const fonts = [
    { name: "Geist", role: "Sans · UI and body", style: { fontFamily: "var(--font-sans)" } as CSSProperties, weights: "400 · 500 · 600" },
    { name: "Geist Mono", role: "Mono · every number", style: { fontFamily: "var(--font-mono)" } as CSSProperties, weights: "400 · 500" },
    { name: "Inter", role: "Display · page titles", style: { fontFamily: "var(--font-display)" } as CSSProperties, weights: "500" },
  ];
  return (
    <KitSection
      id="typography"
      title="Typography"
      description="Fifteen text styles exposed as .t-* classes. Use them instead of ad-hoc sizes; numbers always take a .t-num-* style."
    >
      <div className="grid gap-3 md:grid-cols-3">
        {fonts.map((f) => (
          <div key={f.name} className="flex flex-col justify-between gap-6 rounded-2xl bg-canvas p-1 shadow-card">
            <div className="rounded-xl bg-surface p-4 shadow-card">
              <div className="text-[44px] leading-none tracking-[-0.04em] text-ink" style={f.style}>
                Aa 0123
              </div>
              <div className="mt-4 truncate t-caption text-ink-3" style={f.style}>
                ABCDEFGHIJKLM nopqrstuvwxyz 456789 %#+−
              </div>
            </div>
            <div className="flex items-center justify-between px-3 pb-2.5">
              <div>
                <div className="t-body-medium text-ink">{f.name}</div>
                <div className="t-caption text-ink-3">{f.role}</div>
              </div>
              <MonoLabel>{f.weights}</MonoLabel>
            </div>
          </div>
        ))}
      </div>

      <Block
        title="Text styles"
        usage="Size / line-height · weight · tracking. Type in the field to preview your own copy."
        code='<h1 className="t-title text-ink">AEO Insights</h1>'
        flush
        actions={<Input placeholder="Preview text…" value={sample} onChange={(e) => setSample(e.target.value)} wrapperClassName="w-56" iconLeft={<TextAa />} />}
      >
        <div className="flex flex-col">
          {TYPE_STYLES.map((t) => (
            <div key={t.cls} className="grid gap-x-6 gap-y-2 border-b border-line px-4 py-4 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)_200px] md:items-center">
              <div>
                <MonoLabel className="text-ink">.{t.cls}</MonoLabel>
                <div className="mt-1 t-caption text-ink-3">{t.use}</div>
              </div>
              <div className={cn("min-w-0 truncate text-ink", t.cls)}>{sample || t.sample}</div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 md:justify-end">
                <span className="t-num-sm text-ink-2">
                  {t.size}/{t.line}
                </span>
                <span className="t-num-sm text-ink-3">{t.weight}</span>
                <span className="t-num-sm text-ink-3">{t.track}</span>
                <span className="t-caption text-ink-3">{t.font}</span>
              </div>
            </div>
          ))}
        </div>
      </Block>
    </KitSection>
  );
}

/* ========================================================================== */
/* Effects                                                                     */
/* ========================================================================== */

export function EffectsSection() {
  return (
    <KitSection
      id="effects"
      title="Effects"
      description="Elevation is soft shadow plus a 1px shadow ring. Tiles carry category colour; status dots glow."
    >
      <Block title="Shadows" usage="Every shadow-* token, on the surface it is designed for." code='<div className="rounded-2xl bg-canvas shadow-card" />'>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
          {SHADOWS.map((s) => (
            <div key={s.cls} className="flex flex-col gap-3">
              <div className="grid h-20 place-items-center rounded-xl bg-canvas">
                <div className={cn("h-11 w-[72%] rounded-[10px] bg-surface", s.cls)} />
              </div>
              <div>
                <MonoLabel className="text-ink">{s.cls}</MonoLabel>
                <div className="mt-0.5 t-caption text-ink-3">{s.use}</div>
              </div>
            </div>
          ))}
        </div>
      </Block>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Block title="Tiles" usage="Coloured icon tiles carry category colour. Glyph is white, weight fill." code='<Tile color="blue" size="md"><Eye weight="fill" /></Tile>'>
          <div className="overflow-x-auto">
            <div className="grid min-w-[420px] grid-cols-[64px_repeat(5,minmax(0,1fr))] items-center gap-y-3">
              <span />
              {TILE_SIZES.map((sz) => (
                <span key={sz} className="text-center">
                  <MonoLabel>{sz}</MonoLabel>
                </span>
              ))}
              {TILE_COLORS.map((c) => (
                <TileRow key={c} color={c} />
              ))}
            </div>
          </div>
        </Block>

        <Block title="Status dots" usage="Success, warning and danger carry a soft glow. Info and neutral are flat." code='<StatusDot tone="success" />  ·  <StatusPill tone="warning">…</StatusPill>'>
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-6">
              {(["success", "warning", "danger", "info", "neutral"] as const).map((t) => (
                <div key={t} className="flex flex-col items-center gap-2">
                  <span className="grid size-10 place-items-center rounded-xl bg-canvas">
                    <StatusDot tone={t} className="size-2.5" />
                  </span>
                  <Caption>{t}</Caption>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill tone="success">Healthy</StatusPill>
              <StatusPill tone="warning">Behind goal</StatusPill>
              <StatusPill tone="danger">Not cited</StatusPill>
              <StatusPill tone="info">Running</StatusPill>
            </div>
          </div>
        </Block>
      </div>
    </KitSection>
  );
}

function TileRow({ color }: { color: TileColor }) {
  const icons = [<Eye weight="fill" />, <ChatCircleDots weight="fill" />, <Medal weight="fill" />, <Smiley weight="fill" />, <Target weight="fill" />];
  return (
    <>
      <MonoLabel>{color}</MonoLabel>
      {TILE_SIZES.map((sz, i) => (
        <span key={sz} className="grid place-items-center">
          <Tile color={color} size={sz}>
            {icons[i]}
          </Tile>
        </span>
      ))}
    </>
  );
}

/* ========================================================================== */
/* Layout                                                                      */
/* ========================================================================== */

export function LayoutSection() {
  return (
    <KitSection id="layout" title="Layout" description="A 4px spacing grid, six working radii and one container pattern — the two-layer card.">
      <div className="grid gap-4 xl:grid-cols-2">
        <Block title="Spacing" usage="Steps of 4. Gaps 8–16 inside cards, 16–20 between bands." code='<div className="flex gap-3 p-4" />'>
          <div className="flex flex-col gap-2.5">
            {SPACING.map((n) => (
              <div key={n} className="grid grid-cols-[44px_52px_minmax(0,1fr)] items-center gap-3">
                <MonoLabel className="text-ink">{n}</MonoLabel>
                <span className="t-num-sm text-ink-3">{n * 4}px</span>
                <span className="h-3 rounded-[3px] bg-data-1 transition-[width]" style={{ width: n * 4 * 1.6 }} />
              </div>
            ))}
          </div>
        </Block>

        <Block title="Radius" usage="Nested radii shrink by the padding between them: card 16 → panel 12." code='<div className="rounded-2xl" />  /* 16 */'>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
            {RADII.map((r) => (
              <div key={r.r} className="flex flex-col gap-2">
                <span className="h-16 w-full bg-canvas shadow-card" style={{ borderRadius: r.r === 999 ? 999 : r.r }} />
                <div>
                  <span className="t-num-sm-medium text-ink">{r.r === 999 ? "full" : r.r}</span>
                  <div className="t-caption text-ink-3">{r.use}</div>
                </div>
              </div>
            ))}
          </div>
        </Block>
      </div>

      <Block
        title="Two-layer card — anatomy"
        usage="Content lives in the inner panel; titles and meta stay in the shell header."
        code="<Card><CardHeader title meta /><CardPanel>…</CardPanel></Card>"
      >
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid place-items-center rounded-xl bg-canvas px-6 py-10 sm:px-12">
            <div className="relative w-full max-w-[400px]">
              <Callout n={1} className="-left-2.5 -top-2.5 bg-[var(--blue-500)]" />
              <div className="rounded-2xl bg-canvas p-1 shadow-card outline-1 outline-offset-[5px] outline-[var(--blue-400)] outline-dashed">
                <div className="relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 outline-1 outline-offset-[-2px] outline-[var(--orange-400)] outline-dashed">
                  <Callout n={2} className="-right-2.5 -top-2.5 bg-[var(--orange-400)]" />
                  <Tile color="blue" size="sm">
                    <Eye weight="fill" />
                  </Tile>
                  <span className="t-label text-ink">Visibility score</span>
                  <span className="flex-1" />
                  <span className="t-caption text-ink-3">vs 38.6%</span>
                </div>
                <div className="relative rounded-xl bg-surface p-4 shadow-card outline-1 outline-offset-[3px] outline-[var(--green-500)] outline-dashed">
                  <Callout n={3} className="-bottom-2.5 -right-2.5 bg-[var(--green-500)]" />
                  <div className="flex items-end justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="t-num-lg text-ink">41.8%</span>
                      <span className="t-caption text-ink-3">of answers</span>
                    </div>
                    <DeltaPill value="+3.2 pts" direction="up" />
                  </div>
                  <TickMeter value={41.8} className="mt-4" />
                </div>
              </div>
            </div>
          </div>
          <ol className="flex flex-col gap-4">
            {[
              { n: 1, c: "var(--blue-500)", t: "Shell", d: "bg-canvas · radius 16 · padding 4 · shadow-card" },
              { n: 2, c: "var(--orange-400)", t: "Header zone", d: "padding 12 · tile + title + meta or actions" },
              { n: 3, c: "var(--green-500)", t: "Inner panel", d: "bg-surface · radius 12 · padding 16 · ring" },
            ].map((s) => (
              <li key={s.n} className="flex gap-3">
                <span className="grid size-5 shrink-0 place-items-center rounded-full t-micro text-white" style={{ background: s.c }}>
                  {s.n}
                </span>
                <div>
                  <div className="t-body-medium text-ink">{s.t}</div>
                  <div className="mt-0.5 t-caption text-ink-2">{s.d}</div>
                </div>
              </li>
            ))}
            <li className="flex items-center gap-2 rounded-lg bg-canvas px-3 py-2 t-caption text-ink-2">
              <SealCheck weight="fill" className="size-4 shrink-0 text-[var(--status-success)]" />
              KpiCard, CardFooter and every dashboard card use this pattern.
            </li>
          </ol>
        </div>
      </Block>

      <Block title="Page anatomy" usage="Header 64px with one primary action, then horizontal bands divided by hairlines." code="<PageHeader title actions /> <PageSection>…</PageSection>">
        <div className="overflow-hidden rounded-xl bg-surface shadow-card">
          <div className="flex h-12 items-center gap-2 border-b border-line px-4">
            <span className="t-label text-ink">Page title</span>
            <span className="flex-1" />
            <span className="h-6 w-20 rounded-md bg-subtle" />
            <span className="h-6 w-16 rounded-md bg-primary" />
          </div>
          {[
            { cols: "grid-cols-4", n: 4, label: "PageSection · KPI row" },
            { cols: "grid-cols-[5fr_9fr]", n: 2, label: "PageSection · 5 / 9 split" },
          ].map((band) => (
            <div key={band.label} className="border-b border-line p-3 last:border-b-0">
              <div className={cn("grid gap-2", band.cols)}>
                {Array.from({ length: band.n }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-canvas shadow-card" />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <ChartBar className="size-3 text-icon-muted" />
                <Caption>{band.label}</Caption>
              </div>
            </div>
          ))}
        </div>
      </Block>
    </KitSection>
  );
}

function Callout({ n, className }: { n: number; className?: string }) {
  return <span className={cn("absolute z-10 grid size-5 place-items-center rounded-full t-micro text-white shadow-xs", className)}>{n}</span>;
}
