/* Small helpers shared by the AEO Insights tabs, LLM Analytics and Traffic pages. */
import { Fragment, type ReactNode } from "react";
import type { Filters } from "@/components/shell/FilterBar";
import type { StatusTone } from "@/components/ui";
import { brands, topics } from "@/data/mock";

/** How much bigger counts get for each date range (7 days = 1×). */
export const RANGE_SCALE: Record<string, number> = { "24h": 0.16, "7d": 1, "30d": 4.3, "90d": 12.6, ytd: 41.5 };
export const RANGE_LABEL: Record<string, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  ytd: "Year to date",
};

export const scaleBy = (n: number, range: string) => Math.max(0, Math.round(n * (RANGE_SCALE[range] ?? 1)));

/** Stable string hash → used to derive deterministic demo numbers. */
export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic 0–1 pseudo random from a seed string. */
export function rand(seed: string) {
  return (hash(seed) % 10000) / 10000;
}

/** A series of `n` points that ends at `end` and drifts by roughly `drift` overall. */
export function walk(seed: string, end: number, drift: number, n = 14, noise = 1) {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const base = end - drift * (1 - t);
    const jitter = i === n - 1 ? 0 : (rand(`${seed}:${i}`) - 0.5) * 2 * noise;
    return Math.max(0, +(base + jitter).toFixed(1));
  });
}

export const brandColor = (b: { you?: boolean; color: string }) => (b.you ? "var(--data-1)" : b.color === "#141414" ? "#737373" : b.color);

export const selectedBrand = (filters: Filters) => brands.find((b) => b.id === filters.brand) ?? brands[0];
export const topicName = (filters: Filters) => (filters.topic === "all" ? null : (topics.find((t) => t.id === filters.topic)?.name ?? null));

export type Tone = "positive" | "neutral" | "negative";
export const TONE: Record<Tone, { label: string; status: StatusTone; color: string }> = {
  positive: { label: "Positive", status: "success", color: "var(--status-success)" },
  neutral: { label: "Neutral", status: "neutral", color: "var(--icon-muted)" },
  negative: { label: "Negative", status: "danger", color: "var(--status-danger)" },
};

/** Split a 0–100 sentiment score into a positive / neutral / negative share. */
export function sentimentSplit(score: number) {
  const pos = Math.max(0, Math.round(score - 10));
  const neg = Math.max(2, Math.round((100 - score) * 0.38));
  return { positive: pos, neutral: Math.max(0, 100 - pos - neg), negative: neg };
}

/** Renders `**bold**` segments as <strong>. */
export function RichText({ text, strongClass = "font-medium text-ink" }: { text: string; strongClass?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") ? (
          <strong key={i} className={strongClass}>
            {p.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

/** Highlights the matched part of `text` for a search query. */
export function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[3px] bg-brand-subtle px-px text-ink">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

/** Coloured type badge for any hex colour — readable in light and dark. */
export function ColorBadge({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded px-1.5 t-micro"
      style={{ color, background: `color-mix(in oklab, ${color} 14%, transparent)` }}
    >
      {children}
    </span>
  );
}

/** Small "Section title + subtitle" heading used at the top of some tabs. */
export function TabIntro({ title, description, actions }: { title: ReactNode; description: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1">
        <h2 className="t-heading text-ink">{title}</h2>
        <p className="mt-1 t-body text-ink-2">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export type SortDir = "asc" | "desc";
/** Toggle helper for sortable table headers. */
export function sortHeader<K extends string>(sort: { key: K; dir: SortDir }, setSort: (s: { key: K; dir: SortDir }) => void) {
  return (key: K) => ({
    sort: sort.key === key ? sort.dir : null,
    onSort: () => setSort({ key, dir: sort.key === key && sort.dir === "desc" ? "asc" : "desc" }),
  });
}

/** Downloads rows as CSV (Export buttons). */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
