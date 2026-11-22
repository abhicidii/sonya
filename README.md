# Sonya — AI visibility dashboard UI kit

React 18 · Vite · TypeScript · Tailwind CSS v4 · Phosphor Icons. Light + dark from one token set.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
```

## What's inside

| Area | Routes |
| --- | --- |
| Auth & onboarding | `/signin`, `/signup`, `/onboarding` (5 steps), `/welcome` |
| Analytics | `/insights/:tab` (visibility, mentions, sentiment, sources, topics, fanout, location), `/llm`, `/traffic`, `/reports` |
| Prompts | `/prompts` (`?add=1`, `?p=<id>`), `/prompts/research` |
| Actions | `/content`, `/content/:id` (editor + AEO score), `/opportunities` |
| On page | `/site-health`, `/site-health/page?url=`, `/issues` |
| Agent | `/agent`, `/agent/c/:id`, `/agent/skills` |
| Workspace | `/knowledge`, `/settings/:section`, `/kit` (living component docs) |

Global: ⌘K command palette, Learn modal, toasts, collapsible sidebar, mobile drawer.

## Structure

```
src/styles/tokens.css     primitives + semantic tokens (light / dark)
src/styles/index.css      Tailwind theme mapping, text styles (.t-*), tiles, keyframes
src/components/ui         Button, Card (two-layer), Table, Select, Dialog, Toast, Pills, Marks …
src/components/charts     DotMatrix, LineChart, Donut, BarChart, Sparkline, SplitBar, HeatCell
src/components/shell      AppLayout, Sidebar, AppHeader, PageHeader, FilterBar, CommandPalette, LearnModal
src/pages/*               one folder per area
src/data/mock.ts          illustrative data (fictional brand "Lumen")
```

See `CONVENTIONS.md` for the design rules. Model and brand marks are generic glyphs; swap in real logos in your product.
