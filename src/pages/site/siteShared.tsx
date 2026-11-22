import { useState, type ReactNode } from "react";
import { CaretRight, Check, Copy } from "@phosphor-icons/react";
import { Badge, ScoreRing, StatusPill, useToast, type BadgeTone, type StatusTone } from "@/components/ui";
import { issues, sitePages } from "@/data/mock";
import { cn } from "@/lib/cn";

/* Types ------------------------------------------------------------------ */

export type Severity = "critical" | "warning" | "notice";
export type IssueStatus = "open" | "in_progress" | "resolved";
export type SitePage = (typeof sitePages)[number];
export type Issue = (typeof issues)[number];

export const SITEMAP_TOTAL = 2767;

export const severityMeta: Record<Severity, { label: string; plural: string; tone: StatusTone; badge: BadgeTone; color: string }> = {
  critical: { label: "Critical", plural: "Errors", tone: "danger", badge: "red", color: "var(--status-danger)" },
  warning: { label: "Warning", plural: "Warnings", tone: "warning", badge: "orange", color: "var(--status-warning)" },
  notice: { label: "Notice", plural: "Notices", tone: "info", badge: "blue", color: "var(--blue-500)" },
};

export function SeverityPill({ severity, className }: { severity: Severity; className?: string }) {
  const m = severityMeta[severity];
  return (
    <StatusPill tone={m.tone} className={className}>
      {m.label}
    </StatusPill>
  );
}

export function ImpactBadge({ impact }: { impact: string }) {
  return <Badge tone={impact === "AEO" ? "purple" : "blue"}>{impact}</Badge>;
}

/** Ring + percentage, or an em dash for pages that have never been audited. */
export function ScoreCell({ value, audited = true }: { value: number; audited?: boolean }) {
  if (!audited) return <span className="t-num text-ink-3">—</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <ScoreRing value={value} size={18} stroke={2.5} />
      <span className="t-num">{value}%</span>
    </span>
  );
}

/** Deterministic pseudo-random int from a string (stable fake scores per URL). */
export function hashInt(s: string, min: number, max: number) {
  const h = [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return min + (h % (max - min + 1));
}

/* Fix guides -------------------------------------------------------------- */

export interface CodeSample {
  filename: string;
  lang: string;
  body: string;
}

export interface FixGuide {
  why: string;
  steps: string[];
  code?: CodeSample;
  examples: string[];
}

export const fixGuides: Record<string, FixGuide> = {
  i1: {
    why: "Without Product and Offer markup, answer engines read your pricing from third-party listings — often stale. Structured data lets ChatGPT and AI Overviews quote the exact plan and price.",
    steps: [
      "Add a JSON-LD <script> to the <head> of each pricing and plan page.",
      "Include one Offer per plan with price, priceCurrency and a stable URL.",
      "Validate with Google's Rich Results Test, then request a re-crawl.",
    ],
    code: {
      filename: "pricing.html",
      lang: "JSON-LD",
      body: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Lumen Product Analytics",
  "brand": { "@type": "Brand", "name": "Lumen" },
  "offers": [
    {
      "@type": "Offer",
      "name": "Growth",
      "price": "49.00",
      "priceCurrency": "USD",
      "url": "https://lumen.so/pricing#growth"
    }
  ]
}
</script>`,
    },
    examples: ["/pricing", "/compare/orbit", "/"],
  },
  i2: {
    why: "A blanket Disallow for GPTBot keeps ChatGPT from reading these pages, so it can only cite what other sites say about you.",
    steps: [
      "Open robots.txt at the root of lumen.so.",
      "Replace the GPTBot Disallow rule with explicit Allow rules for public paths.",
      "Keep private areas (app, admin) blocked for every user agent.",
    ],
    code: {
      filename: "robots.txt",
      lang: "robots",
      body: `# Allow AI answer engines to read public pages
User-agent: GPTBot
Allow: /
Disallow: /app/

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://lumen.so/sitemap.xml`,
    },
    examples: ["/docs/retention", "/blog", "/changelog", "/customers"],
  },
  i3: {
    why: "llms.txt gives language models a curated map of your most important pages, written in plain Markdown they can parse cheaply.",
    steps: [
      "Create /llms.txt at the site root.",
      "Start with a one-line summary, then list key pages grouped by section.",
      "Link to Markdown versions of docs where you have them.",
    ],
    code: {
      filename: "llms.txt",
      lang: "Markdown",
      body: `# Lumen

> Lumen is product analytics for B2B SaaS teams: funnels,
> retention cohorts and account-level reporting without SQL.

## Product
- [Pricing](https://lumen.so/pricing): plans from $49/mo
- [Lumen vs Orbit](https://lumen.so/compare/orbit)

## Docs
- [Retention cohorts](https://lumen.so/docs/retention.md)
- [Security & GDPR](https://lumen.so/security)`,
    },
    examples: ["/llms.txt"],
  },
  i4: {
    why: "Most AI crawlers do not execute JavaScript. If headings and copy are injected client-side, the bot sees an empty shell.",
    steps: [
      "Server-render or pre-render the main content of affected pages.",
      "Check the raw HTML as a crawler sees it using the command below.",
      "Keep interactive widgets client-side, but ship text in the initial HTML.",
    ],
    code: {
      filename: "terminal",
      lang: "shell",
      body: `# Fetch the page as GPTBot and look for your H1
curl -s -A "GPTBot/1.1" https://lumen.so/pricing \\
  | grep -o "<h1[^>]*>.*</h1>"

# Empty output = content is rendered client-side only`,
    },
    examples: ["/pricing", "/customers", "/changelog"],
  },
  i5: {
    why: "Descriptions over ~160 characters get truncated, and engines fall back to whatever text they extract first.",
    steps: ["Rewrite the meta description to 140–160 characters.", "Lead with the answer, not the brand name.", "Avoid duplicate descriptions across templates."],
    code: {
      filename: "index.html",
      lang: "HTML",
      body: `<meta
  name="description"
  content="Product analytics for B2B SaaS: track funnels,
  retention and account health without SQL. Free up to 10k MTUs."
/>`,
    },
    examples: ["/", "/blog/activation-rate", "/security"],
  },
  i6: {
    why: "FAQ answers hidden in accordions or images can't be lifted into AI answers. Plain text plus FAQPage schema makes each answer quotable.",
    steps: ["Render every question and answer as visible HTML text.", "Keep each answer under 60 words and lead with the direct answer.", "Add FAQPage JSON-LD that mirrors the on-page copy."],
    code: {
      filename: "faq.json",
      lang: "JSON-LD",
      body: `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Is Lumen GDPR compliant?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Yes. Lumen hosts EU data in Frankfurt and signs a DPA."
    }
  }]
}`,
    },
    examples: ["/pricing", "/security", "/docs/retention"],
  },
  i7: {
    why: "Broken internal links waste crawl budget and cut the path crawlers use to discover related pages.",
    steps: ["Update or remove links pointing to the 404 URLs.", "Add 301 redirects for moved pages.", "Re-run the audit to confirm."],
    examples: ["/blog", "/docs/retention", "/changelog"],
  },
};

/* Page-level issues -------------------------------------------------------- */

export interface PageIssue {
  key: string;
  issueId: string;
  title: string;
  severity: Severity;
  category: string;
  impact: string;
  detail: string;
}

const pagePool: Omit<PageIssue, "key">[] = [
  { issueId: "i1", title: "Missing Product / Offer schema", severity: "critical", category: "Structured data", impact: "AEO", detail: "No JSON-LD of type Product or Offer found in <head>." },
  { issueId: "i2", title: "Blocked for GPTBot in robots.txt", severity: "critical", category: "Crawlability", impact: "AEO", detail: "Matched rule: User-agent: GPTBot · Disallow: /" },
  { issueId: "i6", title: "FAQ answers not extractable", severity: "warning", category: "Content structure", impact: "AEO", detail: "4 answers are inside collapsed accordions loaded on click." },
  { issueId: "i4", title: "Main content rendered with JavaScript", severity: "warning", category: "Rendering", impact: "Technical", detail: "Raw HTML contains 38 words; rendered DOM contains 1,240." },
  { issueId: "i5", title: "Meta description too long", severity: "notice", category: "Meta tags", impact: "Technical", detail: "212 characters (recommended 140–160)." },
  { issueId: "i3", title: "Page not listed in llms.txt", severity: "warning", category: "Crawlability", impact: "AEO", detail: "No llms.txt found at lumen.so/llms.txt." },
  { issueId: "i7", title: "2 broken internal links", severity: "notice", category: "Links", impact: "Technical", detail: "/blog/plg-metrics-2024 and /docs/v1/events return 404." },
  { issueId: "i5", title: "Missing Open Graph image", severity: "notice", category: "Meta tags", impact: "Technical", detail: "og:image is not set; social and AI previews show no image." },
  { issueId: "i6", title: "No direct answer in first 100 words", severity: "warning", category: "Content structure", impact: "AEO", detail: "The page opens with a hero tagline instead of a definition." },
];

export function issuesForPage(page: SitePage): PageIssue[] {
  const start = hashInt(page.url, 0, pagePool.length - 1);
  const list: PageIssue[] = [];
  for (let i = 0; i < Math.min(page.issues, pagePool.length); i++) {
    const it = pagePool[(start + i) % pagePool.length];
    list.push({ ...it, key: `${page.url}-${i}` });
  }
  const order: Record<Severity, number> = { critical: 0, warning: 1, notice: 2 };
  return list.sort((a, b) => order[a.severity] - order[b.severity]);
}

/* Code panel --------------------------------------------------------------- */

export function CodeBlock({ code, className }: { code: CodeSample; className?: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code.body);
    } catch {
      /* clipboard unavailable — still confirm for the demo */
    }
    setCopied(true);
    toast({ title: "Copied to clipboard", description: code.filename });
    setTimeout(() => setCopied(false), 1600);
  };
  const lines = code.body.split("\n");
  return (
    <div className={cn("min-w-0 overflow-hidden rounded-xl bg-canvas shadow-card", className)}>
      <div className="flex h-9 items-center gap-2 border-b border-line px-3">
        <span className="flex gap-1">
          <span className="size-2 rounded-full bg-muted" />
          <span className="size-2 rounded-full bg-muted" />
          <span className="size-2 rounded-full bg-muted" />
        </span>
        <span className="ml-1 truncate font-mono text-[12px] text-ink-2">{code.filename}</span>
        <Badge tone="outline">{code.lang}</Badge>
        <span className="flex-1" />
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 t-caption-medium text-ink-2 transition-colors hover:bg-subtle hover:text-ink"
        >
          {copied ? <Check weight="bold" className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-80 overflow-auto py-3 font-mono text-[12px] leading-[1.65]">
        <code className="grid">
          {lines.map((l, i) => {
            const comment = /^\s*(#|\/\/)/.test(l) && code.lang !== "Markdown";
            const heading = code.lang === "Markdown" && /^#/.test(l);
            const quote = code.lang === "Markdown" && /^>/.test(l);
            return (
              <span key={i} className="flex">
                <span className="w-10 shrink-0 select-none pr-3 text-right text-ink-3/70">{i + 1}</span>
                <span className={cn("whitespace-pre pr-4", comment || quote ? "text-ink-3" : heading ? "font-medium text-brand" : "text-ink")}>{highlight(l)}</span>
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

/** Tiny highlighter: quoted strings in brand colour. Good enough for JSON/HTML samples. */
function highlight(line: string): ReactNode {
  const parts = line.split(/("[^"]*")/g);
  if (parts.length === 1) return line;
  return parts.map((p, i) =>
    p.startsWith('"') ? (
      <span key={i} className="text-success">
        {p}
      </span>
    ) : (
      p
    ),
  );
}

/* How-to-fix body ------------------------------------------------------------ */

export function FixGuideBody({ issueId, onOpenPage, extra }: { issueId: string; onOpenPage?: (url: string) => void; extra?: ReactNode }) {
  const g = fixGuides[issueId];
  if (!g) return null;
  return (
    <div className={cn("grid gap-4", g.code && "lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]")}>
      <div className="flex min-w-0 flex-col gap-4">
        <div>
          <div className="t-caption-medium text-ink">Why it matters</div>
          <p className="mt-1 t-body text-ink-2">{g.why}</p>
        </div>
        <div>
          <div className="t-caption-medium text-ink">How to fix</div>
          <ol className="mt-2 flex flex-col gap-2">
            {g.steps.map((s, i) => (
              <li key={i} className="flex gap-2.5 t-body text-ink-2">
                <span className="mt-px inline-grid size-5 shrink-0 place-items-center rounded-md bg-surface t-num-sm-medium text-ink shadow-control-soft">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
        {onOpenPage && (
          <div>
            <div className="t-caption-medium text-ink">Example pages</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {g.examples.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => onOpenPage(u)}
                  className="inline-flex h-6 items-center gap-1 rounded-md bg-surface px-2 font-mono text-[12px] text-ink-2 shadow-control-soft transition-colors hover:text-ink"
                >
                  {u}
                  <CaretRight className="size-3" />
                </button>
              ))}
            </div>
          </div>
        )}
        {extra}
      </div>
      {g.code && <CodeBlock code={g.code} />}
    </div>
  );
}
