import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChatCircleText, MagnifyingGlass, Moon, Plus, Sparkle } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { Kbd } from "@/components/ui";
import { prompts } from "@/data/mock";
import { useTheme } from "@/lib/theme";
import { dashboardNav, footerNav, kitNav } from "./nav";

interface Cmd {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  run: () => void;
}

/** ⌘K command palette: navigation, actions and tracked prompts. Arrow keys + Enter. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  const { toggle } = useTheme();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const all = useMemo<Cmd[]>(() => {
    const go = (to: string) => () => {
      nav(to);
      onClose();
    };
    return [
      { id: "ask", group: "Actions", label: "Ask the Sonya agent…", icon: <Sparkle weight="duotone" />, run: go("/agent") },
      { id: "add", group: "Actions", label: "Add prompt", icon: <Plus />, run: go("/prompts?add=1") },
      { id: "theme", group: "Actions", label: "Toggle dark mode", icon: <Moon />, run: () => { toggle(); onClose(); } },
      ...[...dashboardNav.flatMap((g) => g.items.map((i) => ({ ...i, g: g.label }))), ...footerNav.map((i) => ({ ...i, g: "Workspace" })), { ...kitNav, g: "Workspace" }].map((i) => ({
        id: i.to,
        group: "Go to",
        label: i.label,
        hint: i.g,
        icon: i.icon,
        run: go(i.to),
      })),
      ...prompts.slice(0, 12).map((p) => ({
        id: p.id,
        group: "Prompts",
        label: p.text,
        hint: p.topic,
        icon: <ChatCircleText />,
        run: go(`/prompts?p=${p.id}`),
      })),
    ];
  }, [nav, onClose, toggle]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? all.filter((c) => c.label.toLowerCase().includes(s) || c.hint?.toLowerCase().includes(s)) : all.filter((c) => c.group !== "Prompts" || all.indexOf(c) < 22);
  }, [q, all]);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      setTimeout(() => input.current?.focus(), 10);
    }
  }, [open]);
  useEffect(() => setIdx(0), [q]);
  useEffect(() => {
    list.current?.querySelector(`[data-idx="${idx}"]`)?.scrollIntoView({ block: "nearest" });
  }, [idx]);

  if (!open) return null;
  let last = "";
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-scrim animate-[sy-fade-in_140ms_ease-out]" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Command palette"
        className="relative w-full max-w-[600px] overflow-hidden rounded-2xl bg-surface shadow-popover animate-[sy-dialog-in_180ms_var(--ease-out)]"
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(results.length - 1, i + 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
          if (e.key === "Enter") results[idx]?.run();
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <MagnifyingGlass className="size-[18px] text-icon-muted" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search pages, prompts and actions…"
            className="h-13 min-w-0 flex-1 bg-transparent py-4 t-body text-[15px] text-ink outline-none placeholder:text-ink-3 focus-visible:shadow-none"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div ref={list} className="max-h-[420px] overflow-y-auto p-1.5">
          {results.length === 0 && <div className="px-3 py-10 text-center t-body text-ink-3">No results for “{q}”</div>}
          {results.map((c, i) => {
            const head = c.group !== last ? c.group : null;
            last = c.group;
            return (
              <div key={c.id}>
                {head && <div className="px-2.5 pb-1 pt-2.5 t-caption text-ink-3">{head}</div>}
                <button
                  data-idx={i}
                  onMouseMove={() => setIdx(i)}
                  onClick={c.run}
                  className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left t-body", i === idx ? "bg-subtle text-ink" : "text-ink-2")}
                >
                  <span className="text-icon [&_svg]:size-4">{c.icon}</span>
                  <span className="min-w-0 flex-1 truncate">{c.label}</span>
                  {c.hint && <span className="t-caption text-ink-3">{c.hint}</span>}
                  {i === idx && <ArrowRight className="size-3.5 text-icon" />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 border-t border-line bg-canvas px-4 py-2 t-caption text-ink-3">
          <span className="inline-flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
          <span className="inline-flex items-center gap-1"><Kbd>↵</Kbd> open</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
