/* Illustrative data for the Sonya demo. Brand "Lumen" (lumen.so) is a fictional product-analytics SaaS. */
import type { BrandDef, ModelId } from "@/components/ui/Marks";

export const workspace = { name: "Lumen", domain: "lumen.so", plan: "Pro" };
export const user = { name: "Maya Chen", email: "maya@lumen.so", role: "Head of Growth" };

export const brands: (BrandDef & {
  you?: boolean;
  visibility: number;
  visDelta: number;
  sov: number;
  sentiment: number;
  position: number;
  posDelta: number;
  mentions: number;
  trend: number[];
})[] = [
  { id: "lumen", name: "Lumen", domain: "lumen.so", color: "var(--brand-ink)", shape: "bolt", you: true, visibility: 41.8, visDelta: 3.2, sov: 18.4, sentiment: 72, position: 1.6, posDelta: -0.3, mentions: 1284, trend: [34, 35, 35.5, 36, 37.2, 36.8, 38, 38.6, 39, 39.4, 40.2, 40.1, 41, 41.8] },
  { id: "orbit", name: "Orbit", domain: "orbit.io", color: "#2e90fa", shape: "ring", visibility: 38.2, visDelta: -1.4, sov: 16.1, sentiment: 66, position: 2.1, posDelta: 0.2, mentions: 1122, trend: [40, 39.6, 39.8, 39.1, 38.9, 39.2, 38.6, 38.4, 38.8, 38.1, 38.4, 38, 38.3, 38.2] },
  { id: "tidal", name: "Tidal", domain: "tidal.dev", color: "#16b364", shape: "wave", visibility: 29.5, visDelta: 0.8, sov: 12.7, sentiment: 61, position: 2.8, posDelta: -0.1, mentions: 884, trend: [27.9, 28.2, 28, 28.6, 28.4, 28.9, 29, 28.8, 29.2, 29.1, 29.6, 29.3, 29.4, 29.5] },
  { id: "parcel", name: "Parcel", domain: "parcel.app", color: "#ff8000", shape: "square", visibility: 22.1, visDelta: -2.6, sov: 9.8, sentiment: 58, position: 3.4, posDelta: 0.4, mentions: 641, trend: [25, 24.8, 24.6, 24.1, 23.9, 23.6, 23.5, 23, 22.9, 22.6, 22.7, 22.4, 22.2, 22.1] },
  { id: "quanta", name: "Quanta", domain: "quanta.ai", color: "#7b42ff", shape: "diamond", visibility: 18.7, visDelta: 4.1, sov: 8.2, sentiment: 69, position: 3.1, posDelta: -0.5, mentions: 552, trend: [14.2, 14.8, 15.1, 15.6, 15.9, 16.4, 16.6, 17, 17.2, 17.5, 17.9, 18.2, 18.5, 18.7] },
  { id: "mosaic", name: "Mosaic", domain: "mosaic.so", color: "#e708a4", shape: "stack", visibility: 14.3, visDelta: 0.2, sov: 6.1, sentiment: 63, position: 4.2, posDelta: 0, mentions: 402, trend: [14, 14.2, 14.1, 14.3, 14.1, 14.2, 14.4, 14.3, 14.2, 14.4, 14.3, 14.2, 14.3, 14.3] },
  { id: "kite", name: "Kitepay", domain: "kitepay.com", color: "#0f9a9a", shape: "triangle", visibility: 9.6, visDelta: -0.9, sov: 4.0, sentiment: 54, position: 4.8, posDelta: 0.3, mentions: 268, trend: [10.6, 10.5, 10.4, 10.3, 10.2, 10.1, 10, 9.9, 9.9, 9.8, 9.7, 9.7, 9.6, 9.6] },
  { id: "fernly", name: "Fernly", domain: "fernly.co", color: "#525252", shape: "circle", visibility: 7.2, visDelta: 1.1, sov: 2.9, sentiment: 71, position: 5.1, posDelta: -0.2, mentions: 190, trend: [5.9, 6, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 7, 7.1, 7.2, 7.2] },
];

export const you = brands[0];

export const days14 = ["Oct 24", "Oct 25", "Oct 26", "Oct 27", "Oct 28", "Oct 29", "Oct 30", "Oct 31", "Nov 1", "Nov 2", "Nov 3", "Nov 4", "Nov 5", "Nov 6"];
export const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const models: { id: ModelId; visibility: number; delta: number; mentions: number; citations: number; position: number; sentiment: number; share: number }[] = [
  { id: "chatgpt", visibility: 46.2, delta: 3.8, mentions: 512, citations: 188, position: 1.4, sentiment: 74, share: 38 },
  { id: "perplexity", visibility: 52.9, delta: 5.1, mentions: 301, citations: 264, position: 1.3, sentiment: 71, share: 22 },
  { id: "aio", visibility: 33.4, delta: -1.2, mentions: 214, citations: 140, position: 2.0, sentiment: 68, share: 17 },
  { id: "gemini", visibility: 37.1, delta: 2.4, mentions: 142, citations: 61, position: 1.8, sentiment: 70, share: 11 },
  { id: "claude", visibility: 39.6, delta: 1.6, mentions: 86, citations: 22, position: 1.7, sentiment: 76, share: 8 },
  { id: "copilot", visibility: 24.8, delta: -0.6, mentions: 29, citations: 12, position: 2.6, sentiment: 65, share: 4 },
];

export type PromptStatus = "active" | "suggested" | "inactive";
export interface Prompt {
  id: string;
  text: string;
  topic: string;
  intent: "Informational" | "Comparison" | "Transactional" | "Navigational";
  volume: number; // 1–5
  visibility: number;
  position: number | null;
  sentiment: number | null;
  models: ModelId[];
  status: PromptStatus;
  tags: string[];
  branded: boolean;
  location: string;
  added: string;
  trend: number[];
}

const p = (
  id: number,
  text: string,
  topic: string,
  intent: Prompt["intent"],
  volume: number,
  visibility: number,
  position: number | null,
  sentiment: number | null,
  models: ModelId[],
  status: PromptStatus = "active",
  tags: string[] = [],
  branded = false,
): Prompt => ({
  id: `p${id}`,
  text,
  topic,
  intent,
  volume,
  visibility,
  position,
  sentiment,
  models,
  status,
  tags,
  branded,
  location: "US",
  added: status === "suggested" ? "2 min ago" : `Oct ${10 + (id % 18)}`,
  trend: Array.from({ length: 10 }, (_, i) => Math.max(0, visibility - 6 + i * 0.8 + ((id * 7 + i * 3) % 5) - 2)),
});

export const prompts: Prompt[] = [
  p(1, "What is the best product analytics tool for B2B SaaS?", "Product analytics", "Comparison", 5, 68, 1.2, 74, ["chatgpt", "perplexity", "gemini", "claude"], "active", ["core"]),
  p(2, "Lumen vs Orbit for funnel analysis", "Competitor comparison", "Comparison", 3, 82, 1.0, 71, ["chatgpt", "perplexity", "aio"], "active", ["branded"], true),
  p(3, "How do I track feature adoption without engineers?", "Feature adoption", "Informational", 4, 44, 2.1, 69, ["chatgpt", "claude"], "active", ["core"]),
  p(4, "Cheapest alternative to Orbit analytics", "Competitor comparison", "Transactional", 3, 31, 2.8, 62, ["perplexity", "aio"], "active", ["pricing"]),
  p(5, "Best tools to measure product-led growth", "Product-led growth", "Comparison", 4, 52, 1.6, 73, ["chatgpt", "perplexity", "gemini"], "active", ["plg"]),
  p(6, "How to build a retention cohort chart", "Retention", "Informational", 5, 38, 2.4, 70, ["chatgpt", "gemini", "aio"], "active", []),
  p(7, "Is Lumen GDPR compliant?", "Security & privacy", "Navigational", 2, 91, 1.0, 66, ["chatgpt", "perplexity"], "active", ["branded"], true),
  p(8, "Session replay tools with privacy controls", "Session replay", "Comparison", 3, 12, 4.6, 58, ["perplexity"], "active", []),
  p(9, "Product analytics for mobile apps", "Product analytics", "Comparison", 4, 27, 3.2, 64, ["chatgpt", "aio"], "active", []),
  p(10, "How to calculate activation rate", "Activation", "Informational", 4, 46, 1.9, 75, ["chatgpt", "claude", "gemini"], "active", ["plg"]),
  p(11, "Warehouse-native analytics platforms", "Data warehouse", "Comparison", 3, 19, 3.8, 60, ["perplexity", "claude"], "active", []),
  p(12, "Best A/B testing tool for startups", "Experimentation", "Comparison", 4, 8, 5.2, 55, ["chatgpt"], "active", []),
  p(13, "Lumen pricing per seat", "Pricing", "Transactional", 2, 88, 1.0, 61, ["chatgpt", "perplexity", "aio"], "active", ["branded", "pricing"], true),
  p(14, "What tools do product managers use to track OKRs?", "Product management", "Informational", 3, 22, 3.6, 67, ["gemini"], "active", []),
  p(15, "Open-source product analytics alternatives", "Product analytics", "Comparison", 3, 0, null, null, [], "active", []),
  p(16, "Which analytics tool integrates with Snowflake?", "Data warehouse", "Comparison", 2, 0, null, null, [], "suggested", []),
  p(17, "How to measure time to value in SaaS", "Activation", "Informational", 3, 0, null, null, [], "suggested", ["plg"]),
  p(18, "Best dashboard for weekly active users", "Product analytics", "Comparison", 4, 0, null, null, [], "suggested", []),
  p(19, "Product analytics tools with AI insights", "AI features", "Comparison", 5, 0, null, null, [], "suggested", []),
  p(20, "How to reduce churn using product data", "Retention", "Informational", 4, 0, null, null, [], "suggested", []),
  p(21, "Mixpanel-style event tracking explained", "Product analytics", "Informational", 2, 0, null, null, [], "inactive", []),
  p(22, "Free analytics tool for side projects", "Pricing", "Transactional", 3, 4, 6.1, 52, ["chatgpt"], "inactive", []),
];

export const topics = [
  { id: "t1", name: "Product analytics", prompts: 18, visibility: 47, delta: 3.4, sov: 21, position: 1.7, sentiment: 72, volume: 5, trend: [40, 41, 42, 43, 42, 44, 45, 46, 47] },
  { id: "t2", name: "Competitor comparison", prompts: 9, visibility: 58, delta: 1.2, sov: 26, position: 1.4, sentiment: 68, volume: 3, trend: [55, 56, 57, 56, 57, 58, 57, 58, 58] },
  { id: "t3", name: "Product-led growth", prompts: 7, visibility: 41, delta: 5.8, sov: 18, position: 1.9, sentiment: 74, volume: 4, trend: [32, 34, 35, 36, 37, 38, 39, 40, 41] },
  { id: "t4", name: "Retention", prompts: 6, visibility: 34, delta: -2.1, sov: 14, position: 2.5, sentiment: 70, volume: 5, trend: [37, 36, 36, 35, 35, 34, 34, 35, 34] },
  { id: "t5", name: "Activation", prompts: 5, visibility: 39, delta: 2.2, sov: 16, position: 2.0, sentiment: 75, volume: 4, trend: [35, 36, 36, 37, 37, 38, 38, 39, 39] },
  { id: "t6", name: "Data warehouse", prompts: 4, visibility: 16, delta: -0.4, sov: 7, position: 3.9, sentiment: 60, volume: 3, trend: [17, 16, 17, 16, 16, 16, 15, 16, 16] },
  { id: "t7", name: "Experimentation", prompts: 4, visibility: 9, delta: 0.6, sov: 4, position: 5.0, sentiment: 56, volume: 4, trend: [8, 8, 8, 9, 9, 9, 8, 9, 9] },
  { id: "t8", name: "Security & privacy", prompts: 3, visibility: 71, delta: 0.3, sov: 33, position: 1.1, sentiment: 66, volume: 2, trend: [70, 70, 71, 71, 70, 71, 71, 71, 71] },
];

export type SourceType = "UGC" | "Reference" | "Competitor" | "Editorial" | "Owned" | "Institutional" | "Corporate";
export const sources: { domain: string; used: number; citations: number; type: SourceType; delta: number; pages: number }[] = [
  { domain: "reddit.com", used: 71, citations: 0.6, type: "UGC", delta: 4.2, pages: 312 },
  { domain: "lumen.so", used: 54, citations: 2.1, type: "Owned", delta: 6.8, pages: 84 },
  { domain: "g2.com", used: 49, citations: 0.9, type: "Reference", delta: 1.1, pages: 46 },
  { domain: "youtube.com", used: 42, citations: 0.4, type: "UGC", delta: -0.8, pages: 128 },
  { domain: "orbit.io", used: 38, citations: 1.6, type: "Competitor", delta: 2.4, pages: 61 },
  { domain: "techcrunch.com", used: 26, citations: 0.7, type: "Editorial", delta: 0.3, pages: 18 },
  { domain: "linkedin.com", used: 24, citations: 0.3, type: "UGC", delta: -1.9, pages: 97 },
  { domain: "wikipedia.org", used: 19, citations: 0.5, type: "Institutional", delta: 0, pages: 9 },
  { domain: "capterra.com", used: 17, citations: 0.8, type: "Reference", delta: 1.4, pages: 22 },
  { domain: "medium.com", used: 14, citations: 0.4, type: "Editorial", delta: -0.6, pages: 41 },
  { domain: "tidal.dev", used: 12, citations: 1.2, type: "Competitor", delta: 0.9, pages: 27 },
  { domain: "stackoverflow.com", used: 9, citations: 0.3, type: "UGC", delta: -0.2, pages: 33 },
];

export const sourceTypeColor: Record<SourceType, string> = {
  UGC: "#2e90fa",
  Reference: "#7b42ff",
  Competitor: "#ff8000",
  Editorial: "#e708a4",
  Owned: "#16b364",
  Institutional: "#0f9a9a",
  Corporate: "#737373",
};

export const citedPages = [
  { url: "lumen.so/blog/activation-rate", title: "How to calculate activation rate", citations: 214, models: ["chatgpt", "perplexity", "claude"] as ModelId[], delta: 18 },
  { url: "lumen.so/compare/orbit", title: "Lumen vs Orbit — honest comparison", citations: 176, models: ["chatgpt", "perplexity", "aio"] as ModelId[], delta: 9 },
  { url: "lumen.so/docs/retention", title: "Retention cohorts — docs", citations: 122, models: ["perplexity", "gemini"] as ModelId[], delta: -4 },
  { url: "lumen.so/pricing", title: "Pricing", citations: 98, models: ["chatgpt", "aio"] as ModelId[], delta: 3 },
  { url: "lumen.so/security", title: "Security & GDPR", citations: 77, models: ["chatgpt", "perplexity"] as ModelId[], delta: 1 },
  { url: "lumen.so/blog/plg-metrics", title: "11 PLG metrics that matter", citations: 64, models: ["claude", "gemini"] as ModelId[], delta: 12 },
];

export const mentionsFeed = [
  { id: "m1", model: "chatgpt" as ModelId, prompt: "What is the best product analytics tool for B2B SaaS?", excerpt: "For B2B SaaS teams, **Lumen** stands out for account-level analytics and no-code event tracking, while Orbit is stronger for…", position: 1, sentiment: "positive" as const, cited: true, time: "12 min ago" },
  { id: "m2", model: "perplexity" as ModelId, prompt: "Cheapest alternative to Orbit analytics", excerpt: "Popular alternatives include Tidal, **Lumen** (free up to 10k MTUs) and Parcel. Lumen's pricing is per tracked user…", position: 2, sentiment: "neutral" as const, cited: true, time: "38 min ago" },
  { id: "m3", model: "aio" as ModelId, prompt: "Session replay tools with privacy controls", excerpt: "Orbit and Quanta offer replay with masking. **Lumen** recently added replay but reviewers note limited filtering…", position: 4, sentiment: "negative" as const, cited: false, time: "1 h ago" },
  { id: "m4", model: "claude" as ModelId, prompt: "How do I track feature adoption without engineers?", excerpt: "Tools with visual event tagging such as **Lumen** or Mosaic let PMs define events after the fact…", position: 1, sentiment: "positive" as const, cited: true, time: "2 h ago" },
  { id: "m5", model: "gemini" as ModelId, prompt: "Best tools to measure product-led growth", excerpt: "Orbit, **Lumen** and Quanta are commonly recommended. Lumen's PLG templates cover activation and PQLs…", position: 2, sentiment: "positive" as const, cited: false, time: "3 h ago" },
];

export const sentimentThemes = [
  { theme: "Ease of setup", tone: "positive" as const, share: 34, mentions: 412, quote: "PMs can tag events without a deploy." },
  { theme: "Pricing transparency", tone: "positive" as const, share: 18, mentions: 221, quote: "Per-user pricing is easy to forecast." },
  { theme: "Account-level analytics", tone: "positive" as const, share: 16, mentions: 196, quote: "Best B2B account rollups in the category." },
  { theme: "Session replay depth", tone: "negative" as const, share: 12, mentions: 148, quote: "Replay filtering is behind Orbit." },
  { theme: "Mobile SDK", tone: "negative" as const, share: 9, mentions: 104, quote: "React Native SDK lags the web one." },
  { theme: "Support response", tone: "neutral" as const, share: 11, mentions: 131, quote: "Support is fine on paid plans." },
];

export const locations = [
  { code: "US", name: "United States", flag: "🇺🇸", visibility: 44, delta: 2.8, prompts: 22, position: 1.5 },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", visibility: 39, delta: 1.9, prompts: 18, position: 1.7 },
  { code: "DE", name: "Germany", flag: "🇩🇪", visibility: 28, delta: -0.6, prompts: 14, position: 2.4 },
  { code: "FR", name: "France", flag: "🇫🇷", visibility: 24, delta: 0.4, prompts: 12, position: 2.6 },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", visibility: 31, delta: 4.4, prompts: 10, position: 2.1 },
  { code: "JP", name: "Japan", flag: "🇯🇵", visibility: 12, delta: -1.1, prompts: 8, position: 3.8 },
  { code: "BR", name: "Brazil", flag: "🇧🇷", visibility: 19, delta: 1.2, prompts: 9, position: 3.0 },
  { code: "AU", name: "Australia", flag: "🇦🇺", visibility: 36, delta: 0.9, prompts: 11, position: 1.8 },
];

export const fanouts = [
  {
    prompt: "What is the best product analytics tool for B2B SaaS?",
    count: 31,
    coverage: 24,
    queries: [
      { q: "best product analytics tools 2026 B2B", topic: "Product analytics", volume: 5, difficulty: 4, count: 6, tracked: true },
      { q: "Lumen vs Orbit vs Tidal comparison", topic: "Competitor comparison", volume: 3, difficulty: 3, count: 4, tracked: true },
      { q: "product analytics account level reporting", topic: "Product analytics", volume: 2, difficulty: 2, count: 3, tracked: false },
      { q: "B2B SaaS analytics pricing per seat", topic: "Pricing", volume: 3, difficulty: 2, count: 2, tracked: false },
      { q: "no-code event tracking product analytics", topic: "Feature adoption", volume: 4, difficulty: 3, count: 2, tracked: false },
      { q: "G2 product analytics leaders fall 2026", topic: "Product analytics", volume: 2, difficulty: 4, count: 1, tracked: false },
    ],
  },
  {
    prompt: "How to build a retention cohort chart",
    count: 18,
    coverage: 0,
    queries: [
      { q: "retention cohort chart tutorial", topic: "Retention", volume: 4, difficulty: 2, count: 5, tracked: false },
      { q: "weekly retention cohort SQL", topic: "Data warehouse", volume: 3, difficulty: 3, count: 3, tracked: false },
      { q: "N-day vs unbounded retention", topic: "Retention", volume: 2, difficulty: 2, count: 2, tracked: false },
    ],
  },
];

export const trafficDays = days14;
export const traffic = {
  sessions: 18420,
  sessionsDelta: 22.4,
  signups: 612,
  signupsDelta: 14.1,
  conversion: 3.3,
  conversionDelta: -0.4,
  byModel: {
    chatgpt: [520, 560, 540, 610, 640, 600, 590, 660, 700, 720, 690, 740, 780, 810],
    perplexity: [210, 220, 240, 230, 260, 270, 250, 280, 300, 310, 290, 320, 340, 350],
    gemini: [90, 95, 100, 110, 105, 115, 120, 118, 125, 130, 128, 140, 145, 150],
    claude: [60, 62, 64, 70, 72, 74, 71, 78, 80, 84, 82, 88, 90, 94],
  } as Partial<Record<ModelId, number[]>>,
  landing: [
    { path: "/blog/activation-rate", sessions: 3410, signups: 92, model: "chatgpt" as ModelId, delta: 31 },
    { path: "/compare/orbit", sessions: 2870, signups: 141, model: "perplexity" as ModelId, delta: 18 },
    { path: "/pricing", sessions: 2140, signups: 118, model: "chatgpt" as ModelId, delta: 9 },
    { path: "/docs/retention", sessions: 1630, signups: 24, model: "gemini" as ModelId, delta: -6 },
    { path: "/", sessions: 1490, signups: 77, model: "claude" as ModelId, delta: 12 },
  ],
};

export const reports = [
  { id: "r1", name: "Weekly AI visibility digest", schedule: "Every Monday · 09:00", format: "PDF", recipients: ["Maya Chen", "Leo Park", "Ana Ruiz"], last: "Nov 3, 2026", status: "active" as const },
  { id: "r2", name: "Competitor share of voice — Q4", schedule: "Monthly · 1st", format: "Slides", recipients: ["Maya Chen", "Sam Okafor"], last: "Nov 1, 2026", status: "active" as const },
  { id: "r3", name: "Board update · AI search", schedule: "One-off", format: "PDF", recipients: ["Maya Chen"], last: "Oct 18, 2026", status: "draft" as const },
  { id: "r4", name: "Citations by source type", schedule: "Every Friday · 16:00", format: "CSV", recipients: ["Leo Park"], last: "Oct 31, 2026", status: "paused" as const },
];

export const opportunities = [
  { id: "o1", title: "Publish a comparison page for 'Lumen vs Tidal'", type: "Content gap", impact: "High", effort: "Medium", prompts: 6, lift: "+4.1 pts", model: "chatgpt" as ModelId, status: "open" as const, detail: "Tidal is cited in 6 comparison prompts where Lumen is missing. AI answers lean on Tidal's own comparison page." },
  { id: "o2", title: "Get listed on capterra.com 'Best product analytics' roundup", type: "Citation", impact: "High", effort: "Low", prompts: 9, lift: "+3.2 pts", model: "perplexity" as ModelId, status: "open" as const, detail: "capterra.com is cited in 17% of answers for your topics. Orbit, Tidal and Quanta are listed — Lumen is not." },
  { id: "o3", title: "Answer 'session replay privacy' on your docs", type: "Content gap", impact: "Medium", effort: "Low", prompts: 3, lift: "+1.8 pts", model: "aio" as ModelId, status: "in_progress" as const, detail: "AI Overviews describe Lumen's replay as limited. A docs page on masking & filters would correct this." },
  { id: "o4", title: "Fix missing schema on /pricing", type: "Technical", impact: "Medium", effort: "Low", prompts: 4, lift: "+1.1 pts", model: "gemini" as ModelId, status: "open" as const, detail: "Product and Offer schema are missing, so engines read stale pricing from third-party sites." },
  { id: "o5", title: "Respond to Reddit thread on mobile SDK", type: "Sentiment", impact: "Medium", effort: "Low", prompts: 2, lift: "+0.9 pts", model: "perplexity" as ModelId, status: "open" as const, detail: "A highly cited r/ProductManagement thread drives negative mobile SDK mentions." },
  { id: "o6", title: "Refresh '11 PLG metrics' with 2026 benchmarks", type: "Content refresh", impact: "Low", effort: "Medium", prompts: 3, lift: "+0.7 pts", model: "claude" as ModelId, status: "done" as const, detail: "Claude cites the post but quotes 2024 numbers." },
];

export const contentItems = [
  { id: "c1", title: "Lumen vs Tidal: which product analytics tool fits B2B?", type: "Comparison", status: "Draft" as const, score: 64, words: 1840, owner: "Maya Chen", updated: "10 min ago", target: "Lumen vs Tidal" },
  { id: "c2", title: "Session replay privacy: masking, filters and GDPR", type: "Docs", status: "In review" as const, score: 82, words: 1220, owner: "Leo Park", updated: "2 h ago", target: "session replay privacy" },
  { id: "c3", title: "How to calculate activation rate (2026 guide)", type: "Guide", status: "Published" as const, score: 91, words: 2410, owner: "Ana Ruiz", updated: "Oct 28", target: "activation rate" },
  { id: "c4", title: "Retention cohorts explained", type: "Guide", status: "Published" as const, score: 77, words: 1960, owner: "Sam Okafor", updated: "Oct 21", target: "retention cohort chart" },
  { id: "c5", title: "Warehouse-native analytics with Snowflake", type: "Landing page", status: "Brief" as const, score: 0, words: 0, owner: "Maya Chen", updated: "Yesterday", target: "warehouse-native analytics" },
];

export const sitePages = [
  { url: "/", title: "Lumen — Product analytics for B2B teams", tag: "Homepage", issues: 6, visitors: 48210, technical: 84, aeo: 71, audited: "2 days ago" },
  { url: "/pricing", title: "Pricing", tag: "", issues: 9, visitors: 22410, technical: 62, aeo: 48, audited: "2 days ago" },
  { url: "/compare/orbit", title: "Lumen vs Orbit", tag: "", issues: 2, visitors: 9120, technical: 91, aeo: 88, audited: "2 days ago" },
  { url: "/blog/activation-rate", title: "How to calculate activation rate", tag: "", issues: 1, visitors: 14880, technical: 95, aeo: 92, audited: "5 days ago" },
  { url: "/docs/retention", title: "Retention cohorts — docs", tag: "Docs", issues: 4, visitors: 6310, technical: 78, aeo: 64, audited: "5 days ago" },
  { url: "/security", title: "Security & GDPR", tag: "", issues: 3, visitors: 2840, technical: 88, aeo: 59, audited: "7 days ago" },
  { url: "/blog", title: "Blog", tag: "", issues: 0, visitors: 0, technical: 0, aeo: 0, audited: "Never" },
  { url: "/changelog", title: "Changelog", tag: "", issues: 0, visitors: 0, technical: 0, aeo: 0, audited: "Never" },
  { url: "/customers", title: "Customers", tag: "", issues: 0, visitors: 0, technical: 0, aeo: 0, audited: "Never" },
];

export const issues = [
  { id: "i1", title: "Missing Product / Offer schema", category: "Structured data", severity: "critical" as const, pages: 3, impact: "AEO", detected: "2 days ago", status: "open" as const },
  { id: "i2", title: "Pages blocked for GPTBot in robots.txt", category: "Crawlability", severity: "critical" as const, pages: 12, impact: "AEO", detected: "2 days ago", status: "open" as const },
  { id: "i3", title: "No llms.txt file", category: "Crawlability", severity: "warning" as const, pages: 1, impact: "AEO", detected: "5 days ago", status: "open" as const },
  { id: "i4", title: "Content rendered only with JavaScript", category: "Rendering", severity: "warning" as const, pages: 7, impact: "Technical", detected: "5 days ago", status: "in_progress" as const },
  { id: "i5", title: "Meta description too long", category: "Meta tags", severity: "notice" as const, pages: 14, impact: "Technical", detected: "7 days ago", status: "open" as const },
  { id: "i6", title: "FAQ answers not in an extractable format", category: "Content structure", severity: "warning" as const, pages: 5, impact: "AEO", detected: "7 days ago", status: "open" as const },
  { id: "i7", title: "Broken internal links", category: "Links", severity: "notice" as const, pages: 3, impact: "Technical", detected: "9 days ago", status: "resolved" as const },
];

export const team = [
  { name: "Maya Chen", email: "maya@lumen.so", role: "Owner", last: "Now" },
  { name: "Leo Park", email: "leo@lumen.so", role: "Admin", last: "2 h ago" },
  { name: "Ana Ruiz", email: "ana@lumen.so", role: "Editor", last: "Yesterday" },
  { name: "Sam Okafor", email: "sam@lumen.so", role: "Viewer", last: "Oct 30" },
];

export const agentChats = [
  { id: "a1", title: "30-day AI visibility plan", time: "Today" },
  { id: "a2", title: "Why did Perplexity visibility jump?", time: "Today" },
  { id: "a3", title: "Draft Lumen vs Tidal page", time: "Yesterday" },
  { id: "a4", title: "Audit pricing page for AEO", time: "Nov 2" },
];

export const learnVideos = [
  { id: "v1", title: "Your Prompts", kicker: "Prompts", minutes: 7, description: "Track the prompts that matter and see where your brand appears." },
  { id: "v2", title: "Prompt Research", kicker: "Prompts", minutes: 6, description: "Find the prompts worth tracking next." },
  { id: "v3", title: "AEO Visibility", kicker: "AEO Insights", minutes: 5, description: "Understand the core metrics behind your scores." },
  { id: "v4", title: "Mentions & Citations", kicker: "AEO Insights", minutes: 7, description: "See which pages engines quote and why." },
  { id: "v5", title: "Content that gets cited", kicker: "Content", minutes: 9, description: "Brief, write and score pages for AI answers." },
  { id: "v6", title: "Site Health for AEO", kicker: "Optimization", minutes: 6, description: "Fix the crawl and schema issues engines care about." },
];
