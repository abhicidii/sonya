import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowsClockwise,
  ArrowUpRight,
  CaretDown,
  Check,
  CheckCircle,
  Copy,
  DownloadSimple,
  Globe,
  Lightning,
  LinkSimple,
  NotePencil,
  PencilSimple,
  ShareNetwork,
  ThumbsDown,
  ThumbsUp,
  X,
} from "@phosphor-icons/react";
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  DeltaText,
  DomainMark,
  IconButton,
  ModelMark,
  MODELS,
  Popover,
  Spinner,
  Table,
  Td,
  Th,
  THead,
  Tile,
  Toggle,
  Tooltip,
  Tr,
  useToast,
} from "@/components/ui";
import { Legend, LineChart, Sparkline } from "@/components/charts";
import { PageHeader } from "@/components/shell/PageHeader";
import { agentChats, brands, days14, models, sources, user } from "@/data/mock";
import { cn, fmt } from "@/lib/cn";
import { AttachmentChip, Composer, MODE_OPTIONS, type AgentMode, type Attachment } from "./Composer";
import {
  actionTitle,
  answerToText,
  firstAnswer,
  followUpAnswer,
  SEED_PROMPTS,
  type Answer,
  type Block,
  type PlanRow,
  type ProposedAction,
} from "./answers";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type Msg =
  | { id: string; role: "user"; text: string; attachments?: Attachment[] }
  | { id: string; role: "agent"; answer: Answer; animate: boolean; rev: number; done: boolean; stopped: boolean };

function scrollToBottom(force = false) {
  const el = document.getElementById("page-scroll");
  if (!el) return;
  const near = el.scrollHeight - el.scrollTop - el.clientHeight < 280;
  if (force || near) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
}

function deriveTitle(text: string) {
  const match = Object.entries(SEED_PROMPTS).find(([, p]) => p === text);
  if (match) return agentChats.find((c) => c.id === match[0])?.title ?? text;
  const t = text.replace(/[.?!]+$/, "");
  return t.length > 48 ? `${t.slice(0, 46).trimEnd()}…` : t;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function AgentChat() {
  const loc = useLocation();
  // Remount on every navigation so a new chat (or a different recent) starts fresh.
  return <ChatView key={loc.key} />;
}

function ChatView() {
  const { id = "a1" } = useParams();
  const loc = useLocation();
  const nav = useNavigate();
  const toast = useToast();
  const state = loc.state as { text?: string; mode?: AgentMode; skill?: string; attachments?: Attachment[] } | null;
  const typed = state?.text?.trim();
  const firstText = typed || SEED_PROMPTS[id] || agentChats.find((c) => c.id === id)?.title || SEED_PROMPTS.a1;
  const title = typed ? deriveTitle(typed) : agentChats.find((c) => c.id === id)?.title ?? "New chat";

  const [mode, setMode] = useState<AgentMode>(state?.mode ?? "research");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Msg[]>(() => [
    { id: "u0", role: "user", text: firstText, attachments: state?.attachments },
    { id: "g0", role: "agent", answer: firstAnswer(id, typed), animate: !!typed, rev: 0, done: !typed, stopped: false },
  ]);

  const working = messages.some((m) => m.role === "agent" && !m.done);
  const patch = useCallback(
    (mid: string, p: Partial<Extract<Msg, { role: "agent" }>>) =>
      setMessages((ms) => ms.map((m) => (m.id === mid && m.role === "agent" ? { ...m, ...p } : m))),
    [],
  );

  const send = (text: string, attachments: Attachment[]) => {
    const n = Date.now();
    setMessages((ms) => [
      ...ms,
      { id: `u${n}`, role: "user", text, attachments },
      { id: `g${n}`, role: "agent", answer: followUpAnswer(text), animate: true, rev: 0, done: false, stopped: false },
    ]);
    setDraft("");
    requestAnimationFrame(() => scrollToBottom(true));
  };

  const stop = () => {
    const live = messages.find((m) => m.role === "agent" && !m.done);
    if (live) patch(live.id, { stopped: true, done: true });
  };

  const regenerate = (mid: string) => {
    setMessages((ms) => ms.map((m) => (m.id === mid && m.role === "agent" ? { ...m, rev: m.rev + 1, animate: true, done: false, stopped: false } : m)));
  };

  const modeLabel = MODE_OPTIONS.find((m) => m.value === mode)?.label;

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        className="sticky top-0 z-20 bg-surface"
        title={title}
        badge={<Badge tone="outline">{modeLabel}</Badge>}
        actions={
          <>
            <SharePopover chatId={id} title={title} />
            <Button iconLeft={<NotePencil weight="bold" className="size-4" />} onClick={() => nav("/agent")}>
              New chat
            </Button>
          </>
        }
      />

      <div className="mx-auto flex w-full max-w-[780px] flex-1 flex-col gap-8 px-4 pb-6 pt-6 sm:px-6 sm:pt-8">
        {state?.skill && (
          <div className="flex items-center justify-center gap-1.5 t-caption text-ink-3">
            <Lightning weight="fill" className="size-3.5 text-[var(--blue-500)]" />
            Using skill <span className="t-caption-medium text-ink-2">{state.skill}</span>
          </div>
        )}
        {messages.map((m) =>
          m.role === "user" ? (
            <UserBubble key={m.id} text={m.text} attachments={m.attachments} />
          ) : (
            <AgentTurn
              key={`${m.id}-${m.rev}`}
              answer={m.answer}
              animate={m.animate}
              stopped={m.stopped}
              onDone={() => patch(m.id, { done: true })}
              onProgress={() => scrollToBottom()}
              onRegenerate={() => regenerate(m.id)}
              disabled={working}
              onCopied={() => toast({ title: "Response copied", description: "Paste it into a doc, Slack or a brief." })}
            />
          ),
        )}
      </div>

      {/* Sticky composer */}
      <div className="sticky bottom-0 z-10 bg-[linear-gradient(to_top,var(--bg-surface)_70%,transparent)] px-4 pb-3 pt-6 sm:px-6">
        <div className="mx-auto w-full max-w-[780px]">
          <Composer
            value={draft}
            onChange={setDraft}
            onSubmit={send}
            busy={working}
            onStop={stop}
            mode={mode}
            onModeChange={setMode}
            placeholder="Ask a follow up question or make changes…"
          />
          <p className="mt-2 text-center t-caption text-ink-3">Sonya can make mistakes. Check key numbers in AEO Insights.</p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Header · share                                                              */
/* -------------------------------------------------------------------------- */

function SharePopover({ chatId, title }: { chatId: string; title: string }) {
  const toast = useToast();
  const [workspaceAccess, setWorkspaceAccess] = useState(true);
  const link = `app.sonya.ai/share/${chatId}-7f3k`;
  return (
    <Popover
      align="end"
      className="w-[320px] p-0"
      trigger={({ open, toggle }) => (
        <Button variant="outlined" tone="secondary" iconLeft={<ShareNetwork className="size-4" />} onClick={toggle} aria-expanded={open}>
          Share
        </Button>
      )}
    >
      <div className="flex flex-col gap-3 p-3">
        <div>
          <div className="t-body-medium text-ink">Share chat</div>
          <div className="truncate t-caption text-ink-3">{title}</div>
        </div>
        <div className="flex items-center gap-2.5 rounded-lg bg-canvas px-2.5 py-2">
          <Globe weight="duotone" className="size-4 text-icon" />
          <div className="min-w-0 flex-1">
            <div className="t-caption-medium text-ink">Anyone at Lumen</div>
            <div className="t-caption text-ink-3">{workspaceAccess ? "Can view this chat" : "Only you can view"}</div>
          </div>
          <Toggle size="xs" checked={workspaceAccess} onChange={setWorkspaceAccess} />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-surface px-2.5 shadow-input">
            <LinkSimple className="size-3.5 shrink-0 text-icon-muted" />
            <span className={cn("truncate t-num-sm", workspaceAccess ? "text-ink-2" : "text-ink-3 line-through")}>{link}</span>
          </div>
          <Button
            size="sm"
            disabled={!workspaceAccess}
            onClick={() => {
              navigator.clipboard?.writeText(`https://${link}`).catch(() => {});
              toast({ title: "Link copied", description: "Teammates at Lumen can open this chat." });
            }}
          >
            Copy
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-line px-3 py-2.5">
        <Avatar name={user.name} size={20} />
        <span className="flex-1 t-caption text-ink-2">{user.name}</span>
        <span className="t-caption text-ink-3">Owner</span>
      </div>
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/* User bubble                                                                 */
/* -------------------------------------------------------------------------- */

function UserBubble({ text, attachments }: { text: string; attachments?: Attachment[] }) {
  return (
    <div className="flex flex-col items-end gap-1.5 animate-[sy-pop-in_220ms_var(--ease-out)]">
      {attachments && attachments.length > 0 && (
        <div className="flex flex-wrap justify-end gap-1.5">
          {attachments.map((a) => (
            <AttachmentChip key={a.id} item={a} />
          ))}
        </div>
      )}
      <div className="max-w-[min(85%,560px)] whitespace-pre-wrap rounded-2xl rounded-br-md bg-subtle px-4 py-2.5 t-body text-ink">{text}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Agent turn: thinking → steps → answer                                       */
/* -------------------------------------------------------------------------- */

type Phase = "thinking" | "steps" | "answer" | "done";

const T_THINK = 1600;
const T_STEP = 720;
const T_BLOCK = 260;

const shimmerStyle: CSSProperties = {
  backgroundImage: "linear-gradient(90deg, transparent, var(--text-primary), transparent), linear-gradient(var(--text-tertiary), var(--text-tertiary))",
  backgroundSize: "80px 100%, 100% 100%",
  backgroundRepeat: "no-repeat, repeat",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  animation: "sy-shimmer 1.6s ease-in-out infinite",
};

function AgentTurn({
  answer,
  animate,
  stopped,
  onDone,
  onProgress,
  onRegenerate,
  onCopied,
  disabled,
}: {
  answer: Answer;
  animate: boolean;
  stopped: boolean;
  onDone: () => void;
  onProgress: () => void;
  onRegenerate: () => void;
  onCopied: () => void;
  disabled: boolean;
}) {
  const { steps, blocks } = answer;
  const [phase, setPhase] = useState<Phase>(animate ? "thinking" : "done");
  const [stepIdx, setStepIdx] = useState(animate ? -1 : steps.length);
  const [shown, setShown] = useState(animate ? 0 : blocks.length);
  const [elapsed, setElapsed] = useState(animate ? 0 : answer.seconds);
  const [stepsOpen, setStepsOpen] = useState(animate);
  const timers = useRef<number[]>([]);
  const cbs = useRef({ onDone, onProgress });
  cbs.current = { onDone, onProgress };

  // Schedule the whole sequence once.
  useEffect(() => {
    if (!animate) return;
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    at(T_THINK, () => {
      setPhase("steps");
      setStepIdx(0);
    });
    steps.forEach((_, i) => at(T_THINK + (i + 1) * T_STEP, () => setStepIdx(i + 1)));
    const tAnswer = T_THINK + steps.length * T_STEP + 240;
    at(tAnswer, () => setPhase("answer"));
    blocks.forEach((_, i) => at(tAnswer + i * T_BLOCK, () => setShown(i + 1)));
    at(tAnswer + blocks.length * T_BLOCK + 120, () => {
      setPhase("done");
      setStepsOpen(false);
    });
    const list = timers.current;
    return () => {
      list.forEach(clearTimeout);
      timers.current = [];
    };
  }, [animate, steps, blocks]);

  // Stop requested: freeze where we are.
  useEffect(() => {
    if (!stopped) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("done");
  }, [stopped]);

  // Elapsed timer while working.
  useEffect(() => {
    if (phase === "done") return;
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (animate && phase === "done") cbs.current.onDone();
  }, [animate, phase]);

  useEffect(() => {
    if (animate) cbs.current.onProgress();
  }, [animate, phase, stepIdx, shown]);

  const working = phase !== "done";
  const visibleSteps = steps.slice(0, Math.min(Math.max(stepIdx + 1, 0), steps.length));
  const finished = phase === "done" && !stopped;

  return (
    <div className="flex gap-3">
      <span className="tile tile-ink mt-0.5 hidden size-7 rounded-[8px] sm:inline-grid" aria-hidden>
        <svg viewBox="0 0 32 32" width={20} height={20}>
          <path d="M10 20.5c1.4 1.3 3.5 2 6 2 3.3 0 5.5-1.5 5.5-3.8 0-2.2-1.7-3.1-5-3.7-2.6-.5-3.6-1-3.6-2 0-1 1-1.7 2.8-1.7 1.6 0 3 .5 4 1.4" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="23.5" cy="8.5" r="2" fill="#ffa100" />
        </svg>
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {/* Working header */}
        <div>
          <button
            type="button"
            onClick={() => phase !== "thinking" && setStepsOpen((o) => !o)}
            aria-expanded={stepsOpen}
            className="group flex h-7 w-full items-center gap-2 text-left"
          >
            <span className="inline-flex items-center gap-1.5 t-caption-medium text-ink-2 transition-colors group-hover:text-ink">
              {working ? <Spinner className="size-3.5 text-icon" /> : stopped ? <X weight="bold" className="size-3.5 text-icon" /> : <CheckCircle weight="fill" className="size-3.5 text-[var(--status-success)]" />}
              {working ? "Working for" : stopped ? "Stopped after" : "Worked for"} <span className="t-num-sm-medium">{elapsed}s</span>
              {phase !== "thinking" && <CaretDown className={cn("size-3 text-icon-muted transition-transform duration-150", stepsOpen && "rotate-180")} />}
            </span>
            <span className="h-px flex-1 bg-line" />
            {!working && <span className="t-caption text-ink-3">{steps.length} steps</span>}
          </button>

          {phase === "thinking" && (
            <div className="mt-2 t-body-medium" style={shimmerStyle}>
              Thinking…
            </div>
          )}

          {phase !== "thinking" && stepsOpen && visibleSteps.length > 0 && (
            <ol className="mt-2 flex flex-col rounded-xl bg-canvas p-1 animate-[sy-fade-in_160ms_ease-out]">
              {visibleSteps.map((s, i) => {
                const done = i < stepIdx || (phase === "done" && !stopped);
                const running = !done && i === stepIdx && !stopped;
                return (
                  <li key={s.label} className="relative flex items-start gap-2.5 rounded-lg px-2.5 py-2 animate-[sy-pop-in_200ms_var(--ease-out)]">
                    {i < visibleSteps.length - 1 && <span className="absolute bottom-[-6px] left-[19px] top-[30px] w-px bg-line" aria-hidden />}
                    <span className="mt-px grid size-[18px] shrink-0 place-items-center">
                      {done ? (
                        <CheckCircle weight="fill" className="size-[18px] text-[var(--status-success)]" />
                      ) : running ? (
                        <Spinner className="size-4 text-icon" />
                      ) : (
                        <span className="size-3 rounded-full border-[1.5px] border-line-strong" />
                      )}
                    </span>
                    <span className="mt-px text-icon [&_svg]:size-4">{s.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block t-body-medium", done || running ? "text-ink" : "text-ink-3")}>{s.label}</span>
                      <span className="block truncate t-caption text-ink-3">{s.detail}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Answer */}
        {blocks.slice(0, shown).map((b, i) => (
          <div key={i} className={cn(animate && "animate-[sy-pop-in_260ms_var(--ease-out)]")}>
            <AnswerBlock block={b} />
          </div>
        ))}

        {stopped && (
          <div className="flex items-center gap-2 rounded-lg bg-canvas px-3 py-2 t-caption text-ink-2">
            <X className="size-3.5 text-icon" /> You stopped this response.
            <button onClick={onRegenerate} className="ml-auto t-caption-medium text-ink underline-offset-2 hover:underline">
              Try again
            </button>
          </div>
        )}

        {phase === "done" && (shown > 0 || stopped) && (
          <FeedbackRow answer={answer} onRegenerate={onRegenerate} onCopied={onCopied} disabled={disabled} finished={finished} />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Feedback row                                                                */
/* -------------------------------------------------------------------------- */

function FeedbackRow({
  answer,
  onRegenerate,
  onCopied,
  disabled,
  finished,
}: {
  answer: Answer;
  onRegenerate: () => void;
  onCopied: () => void;
  disabled: boolean;
  finished: boolean;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const src = answer.blocks.find((b): b is Extract<Block, { t: "sources" }> => b.t === "sources");

  const copy = () => {
    navigator.clipboard?.writeText(answerToText(answer)).catch(() => {});
    setCopied(true);
    onCopied();
    window.setTimeout(() => setCopied(false), 1600);
  };

  const rate = (v: "up" | "down") => {
    const next = vote === v ? null : v;
    setVote(next);
    if (next) toast({ tone: "info", title: "Thanks for the feedback", description: next === "up" ? "Sonya will lean on answers like this." : "We'll use this to improve Sonya's plans." });
  };

  return (
    <div className="-ml-1.5 flex items-center gap-0.5">
      <IconButton label={copied ? "Copied" : "Copy"} size="xs" variant="link" onClick={copy}>
        {copied ? <Check weight="bold" className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      </IconButton>
      <IconButton label="Good response" size="xs" variant="link" aria-pressed={vote === "up"} onClick={() => rate("up")}>
        <ThumbsUp weight={vote === "up" ? "fill" : "regular"} className={cn("size-3.5", vote === "up" && "text-ink")} />
      </IconButton>
      <IconButton label="Bad response" size="xs" variant="link" aria-pressed={vote === "down"} onClick={() => rate("down")}>
        <ThumbsDown weight={vote === "down" ? "fill" : "regular"} className={cn("size-3.5", vote === "down" && "text-ink")} />
      </IconButton>
      <IconButton label="Regenerate" size="xs" variant="link" disabled={disabled} onClick={onRegenerate}>
        <ArrowsClockwise className="size-3.5" />
      </IconButton>
      <span className="flex-1" />
      {finished && src && (
        <span className="inline-flex items-center gap-1.5 t-caption text-ink-3">
          <span className="flex -space-x-1">
            {src.domains.slice(0, 3).map((d) => (
              <span key={d} className="rounded-[5px] ring-2 ring-surface">
                <DomainMark domain={d} size={14} />
              </span>
            ))}
          </span>
          <span className="t-num-sm">{src.total}</span> sources
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Answer blocks                                                               */
/* -------------------------------------------------------------------------- */

function Citation({ domain }: { domain: string }) {
  const s = sources.find((x) => x.domain === domain);
  return (
    <Tooltip content={s ? `${domain} · used in ${s.used}% of answers` : `${domain} · your site`}>
      <a
        href={`https://${domain}`}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.preventDefault()}
        className="mx-0.5 inline-flex h-5 translate-y-[-1px] items-center gap-1 rounded-full bg-subtle py-0.5 pl-0.5 pr-1.5 align-middle text-[11px] font-medium leading-none text-ink-2 transition-colors hover:bg-hover hover:text-ink"
      >
        <DomainMark domain={domain} size={14} />
        {domain.replace(/\.(com|so|io|dev|org|app|ai)$/, "")}
      </a>
    </Tooltip>
  );
}

/** Tiny inline markup: **bold**, [[domain]] citations, `code`. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[\[[^\]]+\]\]|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**")) return <strong key={i} className="font-medium text-ink">{p.slice(2, -2)}</strong>;
        if (p.startsWith("[[")) return <Citation key={i} domain={p.slice(2, -2)} />;
        if (p.startsWith("`")) return <code key={i} className="rounded bg-subtle px-1 font-mono text-[12.5px] text-ink">{p.slice(1, -1)}</code>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

function AnswerBlock({ block }: { block: Block }) {
  switch (block.t) {
    case "p":
      return (
        <p className="text-[15px] leading-[1.6] tracking-[-0.012em] text-ink-2">
          <Rich text={block.text} />
        </p>
      );
    case "h":
      return <h3 className="pt-1 text-[16px] font-medium leading-tight tracking-[-0.02em] text-ink">{block.text}</h3>;
    case "list":
      return (
        <ul className="flex flex-col gap-2.5">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-[1.6] tracking-[-0.012em] text-ink-2">
              {block.ordered ? (
                <span className="mt-[3px] grid size-5 shrink-0 place-items-center rounded-md bg-subtle t-num-sm-medium text-ink-2">{i + 1}</span>
              ) : (
                <span className="mt-[10px] size-1.5 shrink-0 rounded-full bg-icon-muted" />
              )}
              <span className="min-w-0">
                <Rich text={it} />
              </span>
            </li>
          ))}
        </ul>
      );
    case "kpis":
      return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {block.items.map((k) => (
            <div key={k.label} className="rounded-xl bg-canvas px-3.5 py-3 shadow-card">
              <div className="t-caption text-ink-2">{k.label}</div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="t-num-lg text-ink">{k.value}</span>
                <DeltaText value={k.delta} good={k.good} />
              </div>
            </div>
          ))}
        </div>
      );
    case "trend":
      return <TrendBlock title={block.title} />;
    case "models":
      return <ModelsBlock />;
    case "plan":
      return <PlanBlock first={block.first} title={block.title} rows={block.rows} />;
    case "action":
      return <ActionCard action={block.action} />;
    case "sources":
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 t-caption-medium text-ink-2">Sources</span>
          {block.domains.map((d) => (
            <a
              key={d}
              href={`https://${d}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.preventDefault()}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-surface px-2 t-caption-medium text-ink-2 shadow-control-soft transition-colors hover:bg-canvas hover:text-ink"
            >
              <DomainMark domain={d} size={14} />
              {d}
            </a>
          ))}
          {block.total > block.domains.length && <span className="t-caption text-ink-3">+{block.total - block.domains.length} more</span>}
        </div>
      );
  }
}

function TrendBlock({ title }: { title: string }) {
  const color = (c: string, you?: boolean) => (you ? "var(--data-1)" : c === "#141414" ? "#737373" : c);
  const series = brands.slice(0, 3).map((b) => ({ id: b.id, label: b.name, values: b.trend, color: color(b.color, b.you), emphasis: !!b.you }));
  const target = { id: "target", label: "30-day target", values: days14.map((_, i) => 34 + (i * 12.5) / 13), color: "var(--data-target)", dashed: true };
  return (
    <div className="rounded-xl bg-surface p-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="t-caption-medium text-ink">{title}</span>
        <span className="flex-1" />
        <Legend items={[...series.map((s) => ({ label: s.label, color: s.color })), { label: "Target path", color: "var(--data-target)", dashed: true }]} />
      </div>
      <LineChart labels={days14} series={[...series, target]} height={168} yMin={20} yMax={50} format={(v) => `${Math.round(v)}%`} />
    </div>
  );
}

function trendFor(vis: number, delta: number, seed: number) {
  return Array.from({ length: 14 }, (_, i) => vis - delta + (delta * i) / 13 + Math.sin(i * 1.3 + seed) * 0.6);
}

function ModelsBlock() {
  const rows = [...models].sort((a, b) => b.delta - a.delta);
  return (
    <div className="overflow-hidden rounded-xl bg-surface shadow-card">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="t-caption-medium text-ink">Visibility by model · week over week</span>
        <span className="flex-1" />
        <Link to="/llm" className="inline-flex items-center gap-1 t-caption-medium text-ink-2 hover:text-ink">
          LLM Analytics <ArrowUpRight className="size-3" />
        </Link>
      </div>
      {rows.map((m, i) => (
        <div key={m.id} className={cn("flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0", i === 0 && "bg-brand-subtle")}>
          <ModelMark id={m.id} size={22} className="rounded-full" />
          <span className="min-w-0 flex-1 truncate t-body-medium text-ink">{MODELS[m.id].name}</span>
          <span className="hidden sm:block">
            <Sparkline values={trendFor(m.visibility, m.delta, i)} color={m.delta >= 0 ? "var(--status-success)" : "var(--status-danger)"} width={88} height={22} />
          </span>
          <span className="w-14 text-right t-num text-ink">{fmt.pct(m.visibility)}</span>
          <DeltaText value={fmt.signed(m.delta)} good={m.delta >= 0} className="w-10 text-right" />
        </div>
      ))}
    </div>
  );
}

const impactTone = { High: "green", Medium: "orange", Low: "neutral" } as const;

function PlanBlock({ first, title, rows }: { first: string; title: string; rows: PlanRow[] }) {
  const toast = useToast();
  const [done, setDone] = useState<Set<number>>(new Set());
  return (
    <div className="overflow-hidden rounded-xl bg-canvas p-1 shadow-card">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="t-caption-medium text-ink">{title}</span>
        {done.size > 0 && <Badge tone="green">{done.size} done</Badge>}
        <span className="flex-1" />
        <Button
          size="xs"
          variant="link"
          tone="secondary"
          iconLeft={<DownloadSimple className="size-3.5" />}
          onClick={() => toast({ title: "Plan exported", description: `${rows.length} rows saved as CSV.` })}
        >
          Export
        </Button>
      </div>
      <div className="rounded-lg bg-surface px-1 shadow-card">
        <Table>
          <THead>
            <tr>
              <Th className="w-10" />
              <Th className="w-16">{first}</Th>
              <Th>Action</Th>
              <Th>Impact</Th>
              <Th className="hidden md:table-cell">Owner</Th>
            </tr>
          </THead>
          <tbody>
            {rows.map((r, i) => {
              const isDone = done.has(i);
              return (
                <Tr key={i}>
                  <Td className="pr-0">
                    <Checkbox
                      checked={isDone}
                      onChange={(v) =>
                        setDone((s) => {
                          const n = new Set(s);
                          if (v) n.add(i);
                          else n.delete(i);
                          return n;
                        })
                      }
                    />
                  </Td>
                  <Td>
                    <span className="inline-grid h-6 place-items-center rounded-md bg-subtle px-1.5 t-num-sm-medium text-ink-2">{r.key}</span>
                  </Td>
                  <Td className="min-w-[240px] py-2.5">
                    <div className={cn("t-body-medium text-ink transition-colors", isDone && "text-ink-3 line-through")}>{r.action}</div>
                    <div className="t-caption text-ink-3">{r.detail}</div>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <Badge tone={impactTone[r.impact]}>{r.impact}</Badge>
                      <span className="t-num-sm text-ink-2">{r.lift}</span>
                    </span>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <Avatar name={r.owner} size={20} />
                      <span className="t-body text-ink-2">{r.owner.split(" ")[0]}</span>
                    </span>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Proposed action card                                                        */
/* -------------------------------------------------------------------------- */

type ActionState = "idle" | "editing" | "approving" | "approved" | "dismissed";

function ActionCard({ action }: { action: ProposedAction }) {
  const toast = useToast();
  const nav = useNavigate();
  const [state, setState] = useState<ActionState>("idle");
  const [selected, setSelected] = useState<boolean[][]>(() => action.groups.map((g) => g.items.map(() => true)));
  const counts = useMemo(() => action.groups.map((g, gi) => ({ g, n: selected[gi].filter(Boolean).length })), [action.groups, selected]);
  const total = counts.reduce((a, c) => a + c.n, 0);
  const title = actionTitle(counts);

  const approve = () => {
    setState("approving");
    window.setTimeout(() => {
      setState("approved");
      toast({
        title: "Changes applied",
        description: title,
        action: { label: "View", onClick: () => nav(action.links[0].to) },
      });
    }, 900);
  };

  if (state === "dismissed") {
    return (
      <div className="flex items-center gap-2.5 rounded-xl bg-canvas px-3 py-2.5 shadow-card animate-[sy-fade-in_160ms_ease-out]">
        <X className="size-4 text-icon-muted" />
        <span className="flex-1 t-caption text-ink-2">Dismissed — Sonya won't make these changes.</span>
        <Button size="xs" variant="link" onClick={() => setState("idle")}>
          Undo
        </Button>
      </div>
    );
  }

  const status =
    state === "approved" ? (
      <Badge tone="green">
        <Check weight="bold" className="size-2.5" /> Approved
      </Badge>
    ) : (
      <Badge tone="orange">Needs approval</Badge>
    );

  return (
    <div className="rounded-2xl bg-canvas p-1 shadow-card">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Tile color={state === "approved" ? "green" : "purple"} size="sm">
          {state === "approved" ? <Check weight="bold" /> : <Lightning weight="fill" />}
        </Tile>
        <span className="flex-1 t-caption-medium text-ink">Proposed action</span>
        {status}
      </div>
      <div className="rounded-xl bg-surface p-4 shadow-card">
        {state === "approved" ? (
          <div className="flex flex-col gap-3 animate-[sy-pop-in_220ms_var(--ease-out)]">
            <div className="flex items-start gap-3">
              <CheckCircle weight="fill" className="mt-0.5 size-5 shrink-0 text-[var(--status-success)]" />
              <div className="min-w-0">
                <div className="t-body-medium text-ink">{title}</div>
                <div className="mt-0.5 t-caption text-ink-3">Approved by {user.name} · just now</div>
              </div>
            </div>
            <ul className="flex flex-col gap-1.5 pl-8">
              {counts
                .filter((c) => c.n > 0)
                .map((c) => (
                  <li key={c.g.one} className="flex items-center gap-2 t-caption text-ink-2">
                    <Check weight="bold" className="size-3 text-success" />
                    <span className="t-num-sm-medium text-ink">{c.n}</span> {c.n === 1 ? c.g.one : c.g.many}
                    {c.g.verb === "add" ? " added" : c.g.verb === "open" ? " opened" : " created"}
                  </li>
                ))}
            </ul>
            <div className="flex flex-wrap gap-2 pl-8">
              {action.links.map((l, i) => (
                <Button key={l.to} size="xs" variant="outlined" tone={i === 0 ? "primary" : "secondary"} iconRight={<ArrowUpRight className="size-3" />} onClick={() => nav(l.to)}>
                  {l.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="t-body-medium text-ink">{title}</div>
            <p className="mt-1 t-caption text-ink-2">{action.note}</p>
            <div className="mt-3 flex flex-col gap-3">
              {action.groups.map((g, gi) => (
                <div key={gi}>
                  <div className="mb-1.5 flex items-center gap-1.5 t-caption-medium text-ink-2">
                    {g.many[0].toUpperCase() + g.many.slice(1)}
                    <span className="t-num-sm text-ink-3">
                      {counts[gi].n}/{g.items.length}
                    </span>
                  </div>
                  <div className={cn("flex", g.items.length > 3 ? "flex-wrap gap-1.5" : "flex-col gap-1")}>
                    {g.items.map((it, ii) => {
                      const on = selected[gi][ii];
                      const toggle = (v: boolean) => setSelected((s) => s.map((row, r) => (r === gi ? row.map((x, c) => (c === ii ? v : x)) : row)));
                      if (state === "editing") {
                        return (
                          <Checkbox
                            key={it}
                            checked={on}
                            onChange={toggle}
                            label={<span className={cn("t-caption", on ? "text-ink" : "text-ink-3 line-through")}>{it}</span>}
                            className="rounded-lg bg-canvas px-2 py-1.5"
                          />
                        );
                      }
                      if (!on) return null;
                      return g.items.length > 3 ? (
                        <span key={it} className="inline-flex h-7 items-center rounded-lg bg-canvas px-2.5 t-caption text-ink-2">
                          {it}
                        </span>
                      ) : (
                        <span key={it} className="flex items-center gap-2 rounded-lg bg-canvas px-2.5 py-1.5 t-caption text-ink">
                          <NotePencil className="size-3.5 shrink-0 text-icon" />
                          <span className="truncate">{it}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <Button onClick={approve} loading={state === "approving"} disabled={total === 0} iconLeft={state === "approving" ? undefined : <Check weight="bold" className="size-3.5" />}>
                {state === "approving" ? "Applying…" : "Approve"}
              </Button>
              <Button
                variant="outlined"
                tone="secondary"
                disabled={state === "approving"}
                iconLeft={state === "editing" ? <Check className="size-3.5" /> : <PencilSimple className="size-3.5" />}
                onClick={() => setState(state === "editing" ? "idle" : "editing")}
              >
                {state === "editing" ? "Done editing" : "Edit"}
              </Button>
              <Button variant="link" tone="secondary" disabled={state === "approving"} onClick={() => setState("dismissed")}>
                Dismiss
              </Button>
              <span className="ml-auto hidden t-caption text-ink-3 sm:block">Nothing changes until you approve</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

