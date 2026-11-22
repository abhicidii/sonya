import type { ReactNode } from "react";
import { Atom, ChatCircleText, Code, FileMagnifyingGlass, ListChecks, Quotes, TrendUp } from "@phosphor-icons/react";

/* Canned agent answers — data only. Rendered by AgentChat. */

export interface Step {
  label: string;
  detail: string;
  icon: ReactNode;
}

export interface PlanRow {
  key: string;
  action: string;
  detail: string;
  impact: "High" | "Medium" | "Low";
  lift: string;
  owner: string;
}

export interface ActionGroup {
  verb: string;
  one: string;
  many: string;
  suffix?: string;
  items: string[];
}

export interface ProposedAction {
  groups: ActionGroup[];
  note: string;
  links: { label: string; to: string }[];
}

export type Block =
  | { t: "p"; text: string }
  | { t: "h"; text: string }
  | { t: "list"; items: string[]; ordered?: boolean }
  | { t: "kpis"; items: { label: string; value: string; delta: string; good: boolean }[] }
  | { t: "trend"; title: string }
  | { t: "models" }
  | { t: "plan"; first: string; title: string; rows: PlanRow[] }
  | { t: "action"; action: ProposedAction }
  | { t: "sources"; domains: string[]; total: number };

export interface Answer {
  steps: Step[];
  blocks: Block[];
  seconds: number;
}

const planAnswer: Answer = {
  seconds: 8,
  steps: [
    { label: "Read 22 tracked prompts", detail: "5 topics · 1,320 answers from the last 14 days", icon: <ChatCircleText weight="duotone" /> },
    { label: "Compared 6 models", detail: "ChatGPT, Perplexity, AI Overviews, Gemini, Claude, Copilot", icon: <Atom weight="duotone" /> },
    { label: "Checked 12 cited sources", detail: "reddit.com, g2.com, capterra.com and 9 more", icon: <Quotes weight="duotone" /> },
    { label: "Ranked 8 actions by impact", detail: "Prompt volume × visibility gap × effort", icon: <ListChecks weight="duotone" /> },
  ],
  blocks: [
    {
      t: "p",
      text: "Here's a 30-day agenda for **Lumen**, ranked by expected visibility lift. You're at **41.8%** visibility — 3.6 pts ahead of Orbit — but you're missing from comparison and pricing prompts where [[capterra.com]] and [[tidal.dev]] dominate the citations.",
    },
    {
      t: "kpis",
      items: [
        { label: "Visibility today", value: "41.8%", delta: "+3.2 pts", good: true },
        { label: "Share of voice", value: "18.4%", delta: "+1.3 pts", good: true },
        { label: "Projected in 30 days", value: "46.5%", delta: "+4.7 pts", good: true },
      ],
    },
    { t: "trend", title: "Visibility · last 14 days" },
    { t: "h", text: "Ranked plan" },
    {
      t: "plan",
      first: "Week",
      title: "30-day plan · 8 actions",
      rows: [
        { key: "W1", action: "Publish a “Lumen vs Tidal” comparison page", detail: "6 comparison prompts cite Tidal and skip Lumen", impact: "High", lift: "+4.1 pts", owner: "Maya Chen" },
        { key: "W1", action: "Unblock GPTBot on 12 docs pages, add llms.txt", detail: "Crawl fixes unblock every other item", impact: "High", lift: "+2.4 pts", owner: "Sam Okafor" },
        { key: "W2", action: "Get listed in Capterra's “Best product analytics”", detail: "Cited in 17% of answers for your topics", impact: "High", lift: "+3.2 pts", owner: "Leo Park" },
        { key: "W2", action: "Add Product / Offer schema to /pricing", detail: "Engines quote stale third-party pricing", impact: "Medium", lift: "+1.1 pts", owner: "Sam Okafor" },
        { key: "W3", action: "Publish “Session replay privacy” docs page", detail: "AI Overviews call your replay “limited”", impact: "Medium", lift: "+1.8 pts", owner: "Ana Ruiz" },
        { key: "W3", action: "Rewrite 5 FAQ answers in extractable format", detail: "Short, direct answers get quoted verbatim", impact: "Medium", lift: "+1.2 pts", owner: "Ana Ruiz" },
        { key: "W4", action: "Reply to r/ProductManagement mobile SDK thread", detail: "Drives most negative SDK mentions", impact: "Low", lift: "+0.9 pts", owner: "Leo Park" },
        { key: "W4", action: "Refresh “11 PLG metrics” with 2026 benchmarks", detail: "Claude quotes your 2024 numbers", impact: "Low", lift: "+0.7 pts", owner: "Ana Ruiz" },
      ],
    },
    { t: "h", text: "Why this order" },
    {
      t: "list",
      items: [
        "**Comparison prompts carry the most volume.** 6 of your 22 prompts are head-to-head, and answers lean on Tidal's own page [[tidal.dev]] [[g2.com]].",
        "**Perplexity rewards review sites.** Capterra and G2 show up in most answers where Orbit outranks you [[capterra.com]].",
        "**Technical fixes are cheap.** Crawl and schema work takes under a day and lifts every page that follows [[lumen.so]].",
      ],
    },
    {
      t: "action",
      action: {
        groups: [
          {
            verb: "create",
            one: "content brief",
            many: "content briefs",
            items: ["Lumen vs Tidal: which product analytics tool fits B2B?", "Session replay privacy: masking, filters and GDPR", "11 PLG metrics — 2026 benchmarks"],
          },
          {
            verb: "add",
            one: "prompt",
            many: "prompts",
            suffix: " to tracking",
            items: [
              "Lumen vs Tidal pricing",
              "Best product analytics for startups",
              "Session replay tools that are GDPR compliant",
              "Tidal analytics alternatives",
              "Product analytics with warehouse sync",
              "Is Lumen SOC 2 compliant?",
            ],
          },
        ],
        note: "Briefs land in Content as drafts assigned to their owners. New prompts start tracking across all 6 models tonight.",
        links: [
          { label: "Open Content", to: "/content" },
          { label: "View prompts", to: "/prompts" },
        ],
      },
    },
    { t: "sources", domains: ["reddit.com", "g2.com", "capterra.com", "tidal.dev", "lumen.so", "techcrunch.com"], total: 12 },
  ],
};

const perplexityAnswer: Answer = {
  seconds: 7,
  steps: [
    { label: "Pulled Perplexity answers for 22 prompts", detail: "This week vs the previous 7 days", icon: <ChatCircleText weight="duotone" /> },
    { label: "Compared 6 models", detail: "Perplexity moved the most: +5.1 pts", icon: <Atom weight="duotone" /> },
    { label: "Checked 9 newly cited pages", detail: "4 owned · 3 review sites · 2 forums", icon: <Quotes weight="duotone" /> },
  ],
  blocks: [
    {
      t: "p",
      text: "Perplexity visibility rose **+5.1 pts to 52.9%** this week — the biggest jump of any model. Most of it came from **new citations**, not from ranking changes: Perplexity started quoting three pages it hadn't used before [[lumen.so]] [[g2.com]].",
    },
    { t: "models" },
    { t: "h", text: "What drove it" },
    {
      t: "list",
      ordered: true,
      items: [
        "**Your Orbit comparison page got picked up.** /compare/orbit is now cited in 4 Perplexity answers, up from 0 [[lumen.so]].",
        "**A G2 review wave.** 14 new reviews in October pushed your profile into Perplexity's top sources for “best product analytics” [[g2.com]].",
        "**Reddit momentum.** A positive r/analytics thread comparing Lumen and Orbit is now cited in 3 answers [[reddit.com]].",
      ],
    },
    { t: "h", text: "What to do next" },
    {
      t: "p",
      text: "The same pattern should work on ChatGPT, which still cites Orbit's comparison page first. Refresh your comparison with 2026 pricing and track the review-driven prompts so you can see if the lift holds.",
    },
    {
      t: "action",
      action: {
        groups: [
          { verb: "create", one: "content brief", many: "content briefs", items: ["Lumen vs Orbit — refresh with 2026 pricing"] },
          { verb: "add", one: "prompt", many: "prompts", suffix: " to tracking", items: ["Best G2-rated product analytics", "Lumen reviews", "Orbit vs Lumen on Reddit"] },
        ],
        note: "The brief reuses the structure of /compare/orbit, which Perplexity already trusts.",
        links: [
          { label: "Open Content", to: "/content" },
          { label: "View prompts", to: "/prompts" },
        ],
      },
    },
    { t: "sources", domains: ["lumen.so", "g2.com", "reddit.com", "orbit.io"], total: 9 },
  ],
};

const tidalAnswer: Answer = {
  seconds: 9,
  steps: [
    { label: "Read 6 comparison prompts", detail: "Lumen vs Tidal, Tidal alternatives, pricing", icon: <ChatCircleText weight="duotone" /> },
    { label: "Analysed Tidal's comparison page", detail: "tidal.dev/compare/lumen · 2,140 words", icon: <FileMagnifyingGlass weight="duotone" /> },
    { label: "Checked 8 cited sources", detail: "g2.com, reddit.com, tidal.dev and 5 more", icon: <Quotes weight="duotone" /> },
  ],
  blocks: [
    {
      t: "p",
      text: "Tidal is cited in **5 of 6** Lumen-vs-Tidal answers, mostly from its own comparison page [[tidal.dev]]. A page of your own with a clear verdict table and sourced claims should win back most of those citations.",
    },
    {
      t: "kpis",
      items: [
        { label: "Prompts targeted", value: "6", delta: "+2 new", good: true },
        { label: "Tidal cited in", value: "83%", delta: "of answers", good: false },
        { label: "Projected lift", value: "+4.1", delta: "pts", good: true },
      ],
    },
    { t: "h", text: "Suggested outline" },
    {
      t: "list",
      ordered: true,
      items: [
        "**Verdict up front** — a 2-sentence answer engines can quote: who should pick Lumen, who should pick Tidal.",
        "**Feature table** — funnels, retention, session replay, warehouse sync, SSO, with ✓ / partial / ✗.",
        "**Pricing at 3 team sizes** — engines currently quote Tidal's numbers for both [[capterra.com]].",
        "**Migration in a day** — the most common follow-up in Perplexity answers [[reddit.com]].",
        "**FAQ** — 5 short answers matching the exact prompts you track.",
      ],
    },
    { t: "h", text: "Claims to back with sources" },
    {
      t: "list",
      items: [
        "Lumen's G2 rating (4.7) is higher than Tidal's (4.4) [[g2.com]].",
        "Warehouse-native sync is GA on Lumen and in beta on Tidal [[tidal.dev]].",
      ],
    },
    {
      t: "action",
      action: {
        groups: [
          { verb: "create", one: "draft", many: "drafts", suffix: " in Content", items: ["Lumen vs Tidal: which product analytics tool fits B2B?"] },
          { verb: "add", one: "prompt", many: "prompts", suffix: " to tracking", items: ["Tidal vs Lumen for startups", "Is Tidal cheaper than Lumen?"] },
        ],
        note: "The draft is pre-filled with the outline above and assigned to Maya Chen for review.",
        links: [
          { label: "Open draft", to: "/content/c1" },
          { label: "View prompts", to: "/prompts" },
        ],
      },
    },
    { t: "sources", domains: ["tidal.dev", "g2.com", "capterra.com", "reddit.com"], total: 8 },
  ],
};

const pricingAnswer: Answer = {
  seconds: 6,
  steps: [
    { label: "Crawled lumen.so/pricing", detail: "1 page · rendered with and without JavaScript", icon: <FileMagnifyingGlass weight="duotone" /> },
    { label: "Checked structured data", detail: "Product, Offer and FAQPage schema", icon: <Code weight="duotone" /> },
    { label: "Compared answers on 4 pricing prompts", detail: "ChatGPT, Perplexity, AI Overviews, Gemini", icon: <TrendUp weight="duotone" /> },
  ],
  blocks: [
    {
      t: "p",
      text: "**/pricing** scores **48 AEO** and **62 technical** — the weakest of your key pages. Engines can't read your plans, so they quote 2024 prices from review sites [[capterra.com]] [[g2.com]].",
    },
    {
      t: "kpis",
      items: [
        { label: "AEO score", value: "48", delta: "−6", good: false },
        { label: "Open issues", value: "9", delta: "3 critical", good: false },
        { label: "Monthly visitors", value: "22.4K", delta: "+8.2%", good: true },
      ],
    },
    { t: "h", text: "Fix in this order" },
    {
      t: "plan",
      first: "Priority",
      title: "Pricing page fixes · 5 items",
      rows: [
        { key: "P1", action: "Add Product + Offer schema for all 3 plans", detail: "Engines read no structured pricing today", impact: "High", lift: "+1.1 pts", owner: "Sam Okafor" },
        { key: "P1", action: "Server-render the plan table", detail: "Plans load with JavaScript only", impact: "High", lift: "+0.9 pts", owner: "Sam Okafor" },
        { key: "P2", action: "Add a 5-question pricing FAQ", detail: "Matches “how much does Lumen cost”", impact: "Medium", lift: "+0.8 pts", owner: "Ana Ruiz" },
        { key: "P2", action: "Ask Capterra to update listed prices", detail: "Quoted in 3 of 4 pricing answers", impact: "Medium", lift: "+0.6 pts", owner: "Leo Park" },
        { key: "P3", action: "Shorten the meta description", detail: "Truncated at 182 characters", impact: "Low", lift: "+0.1 pts", owner: "Sam Okafor" },
      ],
    },
    {
      t: "action",
      action: {
        groups: [
          { verb: "open", one: "issue", many: "issues", suffix: " in Site Health", items: ["Missing Product / Offer schema", "Plan table rendered client-side"] },
          { verb: "create", one: "content brief", many: "content briefs", items: ["Pricing FAQ — 5 answers"] },
        ],
        note: "Issues are assigned to Sam Okafor; the FAQ brief goes to Ana Ruiz.",
        links: [
          { label: "Open Issues", to: "/issues" },
          { label: "Open Content", to: "/content" },
        ],
      },
    },
    { t: "sources", domains: ["lumen.so", "capterra.com", "g2.com"], total: 5 },
  ],
};

const followUpGeneric: Answer = {
  seconds: 5,
  steps: [
    { label: "Re-read the conversation", detail: "Plan, owners and proposed changes", icon: <ChatCircleText weight="duotone" /> },
    { label: "Checked team capacity", detail: "4 owners · 2 already at 3+ items", icon: <ListChecks weight="duotone" /> },
    { label: "Updated 3 items", detail: "Moved, reassigned and re-scored", icon: <TrendUp weight="duotone" /> },
  ],
  blocks: [
    { t: "p", text: "Done — I've rebalanced the work so nobody owns more than **two items a week**. The expected lift stays at **+4.6 pts** over 30 days." },
    {
      t: "plan",
      first: "Week",
      title: "Changed items · 3",
      rows: [
        { key: "W1", action: "Add Product / Offer schema to /pricing", detail: "Pulled forward from week 2 — it's under an hour", impact: "Medium", lift: "+1.1 pts", owner: "Sam Okafor" },
        { key: "W2", action: "Unblock GPTBot on 12 docs pages, add llms.txt", detail: "Moved to week 2 to free up Sam", impact: "High", lift: "+2.4 pts", owner: "Sam Okafor" },
        { key: "W3", action: "Rewrite 5 FAQ answers in extractable format", detail: "Reassigned from Ana to Leo", impact: "Medium", lift: "+1.2 pts", owner: "Leo Park" },
      ],
    },
    { t: "p", text: "Want me to post the updated plan to **#growth-ai** in Slack, or add it to the Weekly AI visibility digest?" },
  ],
};

const followUpCompetitor: Answer = {
  seconds: 6,
  steps: [
    { label: "Compared you with Orbit and Tidal", detail: "Visibility, share of voice and citations", icon: <Atom weight="duotone" /> },
    { label: "Checked 6 competitor pages", detail: "Comparison and pricing pages", icon: <Quotes weight="duotone" /> },
  ],
  blocks: [
    { t: "p", text: "Orbit is losing ground (**−1.4 pts**) while Tidal is flat. The gap to close is in comparison prompts, where Tidal's page is cited in 83% of answers [[tidal.dev]] [[orbit.io]]." },
    { t: "trend", title: "You vs Orbit vs Tidal · 14 days" },
    {
      t: "list",
      items: [
        "**Orbit** — dropping on Perplexity after its G2 rating slipped to 4.3 [[g2.com]].",
        "**Tidal** — stable, carried almost entirely by its own comparison page [[tidal.dev]].",
      ],
    },
  ],
};

export const SEED_PROMPTS: Record<string, string> = {
  a1: "Build a 30-day AI visibility agenda for Lumen (lumen.so), ranked by impact.",
  a2: "Why did our Perplexity visibility jump this week?",
  a3: "Draft a Lumen vs Tidal comparison page that AI engines will cite.",
  a4: "Audit lumen.so/pricing for AEO and tell me what to fix first.",
};

const byId: Record<string, Answer> = { a1: planAnswer, a2: perplexityAnswer, a3: tidalAnswer, a4: pricingAnswer };

/** First answer in a chat: by keyword when the user typed something, otherwise by chat id. */
export function firstAnswer(id: string, text?: string): Answer {
  if (text) {
    const t = text.toLowerCase();
    if (/perplexity|jump|spike|drop/.test(t)) return perplexityAnswer;
    if (/tidal|comparison page|draft|write/.test(t)) return tidalAnswer;
    if (/pricing|audit|schema|technical/.test(t)) return pricingAnswer;
    return planAnswer;
  }
  return byId[id] ?? planAnswer;
}

export function followUpAnswer(text: string): Answer {
  return /orbit|tidal|competitor|compare|vs\b/i.test(text) ? followUpCompetitor : followUpGeneric;
}

export function actionTitle(groups: { g: ActionGroup; n: number }[]) {
  const parts = groups
    .filter((x) => x.n > 0)
    .map((x, i) => `${i === 0 ? x.g.verb[0].toUpperCase() + x.g.verb.slice(1) : x.g.verb} ${x.n} ${x.n === 1 ? x.g.one : x.g.many}${x.g.suffix ?? ""}`);
  return parts.length ? parts.join(" and ") : "Nothing selected";
}

/** Strip inline markup for clipboard copy. */
export function plain(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\s*\[\[(.+?)\]\]/g, "").replace(/`(.+?)`/g, "$1");
}

export function answerToText(a: Answer) {
  return a.blocks
    .map((b) => {
      switch (b.t) {
        case "p":
          return plain(b.text);
        case "h":
          return `## ${b.text}`;
        case "list":
          return b.items.map((it, i) => `${b.ordered ? `${i + 1}.` : "-"} ${plain(it)}`).join("\n");
        case "kpis":
          return b.items.map((k) => `${k.label}: ${k.value} (${k.delta})`).join("\n");
        case "plan":
          return b.rows.map((r) => `${r.key} · ${r.action} · ${r.impact} ${r.lift} · ${r.owner}`).join("\n");
        case "action":
          return `Proposed: ${actionTitle(b.action.groups.map((g) => ({ g, n: g.items.length })))}`;
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}
