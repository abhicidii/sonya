# Sonya — build conventions

Sonya is an AI-visibility (AEO) dashboard UI kit: React 18 + Vite + TypeScript + Tailwind v4 + Phosphor icons.
Design source: Figma file `CwKz0LgI38HlvuXcLvMvPO`, page **Revision** (`1:46135`) → frame **Documentation** (`1:46137`).
Flow source: Searchable (AEO platform) on Mobbin.

## Visual language (from the Documentation frame)

- Frame `bg-frame` (#F0F0EF) → sidebar `bg-canvas` (#F7F7F7) → main panel `bg-surface` (white) with `shadow-panel`.
- **Two-layer card** is the default container: `<Card>` (canvas shell, radius 16, p-1) → `<CardHeader>` (title/meta/actions, padding 12) → `<CardPanel>` (white inner panel, radius 12, p-16). Content goes in the panel; title + meta stay in the shell header.
- Depth comes from soft shadows + 1px shadow rings (`shadow-card`, `shadow-control`, `shadow-control-soft`), **not borders**. Hairline dividers inside panels use `border-line`.
- Primary button = ink (`<Button>` default). One primary per view. Secondary = `variant="outlined" tone="secondary"`.
- Coloured icon **tiles** (`<Tile color="blue|orange|green|pink|purple|ink">`) carry category colour. KPI colours: blue, orange, green, pink.
- **Every number** uses Geist Mono via `.t-num-*` classes. Text styles: `.t-title` (page title), `.t-heading` (card titles), `.t-label`, `.t-body`, `.t-body-medium`, `.t-caption`, `.t-caption-medium`, `.t-micro`.
- Icons: `@phosphor-icons/react`, `weight="duotone"` for nav/feature icons, regular for controls, `weight="fill"` inside tiles. 16px default.
- Status: `<StatusPill tone="success|warning|danger|neutral">` (glowing dot), `<DeltaPill>` for change vs prior, `<DeltaText>` inline.
- Charts: `DotMatrix`, `LineChart`, `Donut`, `Sparkline`, `BarChart`, `SplitBar`, `HeatCell`, `Legend` from `@/components/charts`.
- Spacing steps by 4. Radius 4 (badges) · 6 · 8 (buttons, inputs, nav) · 10 · 12 (inner panels) · 16 (cards, panels).
- Light + dark: only use semantic tokens (`bg-surface`, `text-ink`, `text-ink-2`, `text-ink-3`, `border-line`, `bg-subtle`, `bg-canvas`, `text-success`, `bg-success-subtle`, …). Never hard-code neutrals. Accent hex is fine for brand/model marks and chart series.

## Page anatomy

```tsx
<PageHeader title="…" actions={<>…</>} />      // 64px, border-b
<PageSection>…</PageSection>                   // horizontal band, p-5, border-b between bands
// or <PageBody> for a single padded column
```

The shell (`AppLayout`) already provides app header, sidebar, ⌘K palette, Learn modal, toasts (`useToast()`).

## Components (`@/components/ui`)

Button, IconButton, Spinner · Card, CardHeader, CardPanel, CardFooter, KpiCard, Panel, SectionHeader · Tile, DotMarker ·
Input, SearchInput, Textarea, Field, Checkbox, Toggle, ChoiceChip · Segmented, Tabs, PillTabs · Table, THead, Th, Tr, Td, GroupRow, Pagination ·
Popover, MenuItem, MenuLabel, MenuDivider, Select, Dialog, ToastProvider/useToast · DeltaPill, DeltaText, StatusPill, StatusDot, Badge, CountChip ·
Kbd, Avatar, AvatarStack, Skeleton, EmptyState, TickMeter, DivergingMeter, Progress, ScoreRing, LevelBars, SentimentScore, Divider, Tooltip ·
ModelMark (+ MODELS), BrandMark, DomainMark, SonyaLogo.

Shell: `PageHeader`, `PageBody`, `PageSection` (`@/components/shell/PageHeader`), `FilterBar` + `useFilters` (`@/components/shell/FilterBar`), `useShell()`.

Mock data: `@/data/mock` (brands, models, prompts, topics, sources, citedPages, mentionsFeed, sentimentThemes, locations, fanouts, traffic, reports, opportunities, contentItems, sitePages, issues, team, agentChats, learnVideos).

Reference implementation: `src/pages/insights/VisibilityTab.tsx`.

## Quality bar

- Real interactions, not static pictures: filters filter, tabs switch, modals open, toasts confirm, empty/loading states exist.
- Every icon-only button has a label. Hover/active states on everything clickable.
- Responsive down to ~375px: grids collapse, tables scroll horizontally.
- `npx tsc --noEmit` must pass.
