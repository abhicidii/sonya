import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ChartLineUp,
  ChatCircle,
  ChatCircleText,
  Globe,
  Lightning,
  MagnifyingGlass,
  PencilLine,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import { Badge, Button, StatusDot, Tile } from "@/components/ui";
import { PageHeader } from "@/components/shell/PageHeader";
import { agentChats, prompts, user, workspace } from "@/data/mock";
import { cn } from "@/lib/cn";
import { Composer, type AgentMode } from "./Composer";

const suggestions = [
  { icon: <ChartLineUp weight="duotone" />, label: "Build a 30-day AI visibility plan", text: "Build a 30-day AI visibility agenda for Lumen (lumen.so), ranked by impact." },
  { icon: <Sparkle weight="duotone" />, label: "Why did Perplexity visibility jump?", text: "Why did our Perplexity visibility jump this week?" },
  { icon: <PencilLine weight="duotone" />, label: "Draft a Lumen vs Tidal page", text: "Draft a Lumen vs Tidal comparison page that AI engines will cite." },
  { icon: <MagnifyingGlass weight="duotone" />, label: "Audit /pricing for AEO", text: "Audit lumen.so/pricing for AEO and tell me what to fix first." },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening";
}

export default function AgentHome() {
  const nav = useNavigate();
  const loc = useLocation();
  const prefill = loc.state as { text?: string; skill?: string } | null;
  const [text, setText] = useState(prefill?.text ?? "");
  const [skill, setSkill] = useState<string | undefined>(prefill?.skill);
  const [mode, setMode] = useState<AgentMode>("research");
  const ta = useRef<HTMLTextAreaElement | null>(null);
  const first = user.name.split(" ")[0];

  const connected = [
    { key: "prompts", icon: <ChatCircleText weight="duotone" />, label: "Prompts", meta: `${prompts.length} tracked`, on: true, to: "/prompts" },
    { key: "site", icon: <Globe weight="duotone" />, label: "Site", meta: `${workspace.domain} · 84 pages`, on: true, to: "/site-health" },
    { key: "gsc", icon: <MagnifyingGlass weight="duotone" />, label: "Search Console", meta: "Not connected", on: false, to: "/settings/integrations" },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Agent"
        badge={<Badge tone="blue">Beta</Badge>}
        actions={
          <Button variant="outlined" tone="secondary" iconLeft={<Lightning weight="duotone" className="size-4" />} onClick={() => nav("/agent/skills")}>
            Skills
          </Button>
        }
      />

      <div className="flex flex-1 flex-col items-center px-4 pb-10 pt-[clamp(32px,10vh,112px)] sm:px-6">
        <div className="flex w-full max-w-[720px] flex-col">
          {/* Greeting */}
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="tile tile-ink mb-5 size-11 rounded-[13px] animate-[sy-pop-in_320ms_var(--ease-out)]">
              <svg viewBox="0 0 32 32" width={30} height={30} aria-hidden>
                <path d="M10 20.5c1.4 1.3 3.5 2 6 2 3.3 0 5.5-1.5 5.5-3.8 0-2.2-1.7-3.1-5-3.7-2.6-.5-3.6-1-3.6-2 0-1 1-1.7 2.8-1.7 1.6 0 3 .5 4 1.4" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
                <circle cx="23.5" cy="8.5" r="2" fill="#ffa100" />
              </svg>
            </span>
            <h2 className="text-balance font-display text-[26px] font-medium leading-[1.2] tracking-[-0.03em] text-ink sm:text-[30px]">
              {greeting()}, {first}.
              <span className="block text-ink-3">What should we improve today?</span>
            </h2>
          </div>

          {/* Composer */}
          {skill && (
            <div className="mb-2 flex items-center gap-2 self-start rounded-lg bg-brand-subtle px-2.5 py-1.5 t-caption-medium text-brand animate-[sy-fade-in_160ms_ease-out]">
              <Lightning weight="fill" className="size-3.5" />
              Using skill · {skill}
              <button aria-label="Remove skill" onClick={() => setSkill(undefined)} className="grid size-4 place-items-center rounded opacity-70 hover:opacity-100">
                <X className="size-3" />
              </button>
            </div>
          )}
          <Composer
            large
            autoFocus
            textareaRef={ta}
            value={text}
            onChange={setText}
            mode={mode}
            onModeChange={setMode}
            placeholder="Ask Sonya to analyse, plan or write…"
            onSubmit={(t, attachments) => nav("/agent/c/a1", { state: { text: t, mode, skill, attachments } })}
          />

          {/* Suggestions */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {suggestions.map((s) => (
              <button
                key={s.label}
                onClick={() => {
                  setText(s.text);
                  requestAnimationFrame(() => {
                    const el = ta.current;
                    if (!el) return;
                    el.focus();
                    el.setSelectionRange(el.value.length, el.value.length);
                  });
                }}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-3 t-caption-medium text-ink-2 shadow-control-soft transition-[background-color,color,box-shadow,transform] duration-150 hover:bg-canvas hover:text-ink active:scale-[0.98] [&_svg]:size-4 [&_svg]:text-icon",
                  text === s.text && "text-ink shadow-[0_0_0_1.5px_var(--text-primary)]",
                )}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>

          {/* Connected data */}
          <div className="mt-8 rounded-2xl bg-canvas p-1 shadow-card">
            <div className="flex items-center gap-2 px-3 pb-2 pt-2.5">
              <span className="t-caption-medium text-ink">Connected data</span>
              <span className="t-caption text-ink-3">Sonya reads these before answering</span>
              <span className="flex-1" />
              <Link to="/settings/integrations" className="hidden items-center gap-1 t-caption-medium text-ink-2 transition-colors hover:text-ink sm:inline-flex">
                Manage <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
              {connected.map((c) => (
                <Link
                  key={c.key}
                  to={c.to}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2.5 shadow-card transition-shadow hover:shadow-control",
                    !c.on && "bg-surface/60",
                  )}
                >
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg bg-subtle [&_svg]:size-4", c.on ? "text-icon-strong" : "text-icon-muted")}>{c.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 t-body-medium text-ink">
                      {c.label}
                      <StatusDot tone={c.on ? "success" : "neutral"} />
                    </span>
                    <span className={cn("block truncate t-caption", c.on ? "text-ink-3" : "text-ink-3")}>{c.meta}</span>
                  </span>
                  {c.on ? (
                    <ArrowRight className="size-3.5 text-icon-muted transition-transform group-hover:translate-x-0.5" />
                  ) : (
                    <span className="rounded-md bg-primary px-2 py-1 t-caption-medium text-on-primary">Connect</span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Recents */}
          <div className="mt-8">
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className="t-caption-medium text-ink">Recent chats</span>
              <span className="flex-1" />
              <span className="t-caption text-ink-3">{agentChats.length} chats</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {agentChats.map((c, i) => (
                <Link
                  key={c.id}
                  to={`/agent/c/${c.id}`}
                  className="group flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5 shadow-control-soft transition-[box-shadow,background-color] hover:bg-canvas hover:shadow-control"
                >
                  <Tile color={(["blue", "green", "purple", "orange"] as const)[i % 4]} size="md">
                    <ChatCircle weight="fill" />
                  </Tile>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate t-body-medium text-ink">{c.title}</span>
                    <span className="block t-caption text-ink-3">{c.time}</span>
                  </span>
                  <ArrowRight className="size-3.5 text-icon-muted opacity-0 transition-[opacity,transform] group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
