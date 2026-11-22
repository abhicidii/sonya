import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  ArrowUp,
  Binoculars,
  ChatCircleText,
  FileText,
  Lightning,
  LinkSimple,
  PencilLine,
  Plus,
  Stop,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { IconButton, Kbd, MenuDivider, MenuItem, MenuLabel, Popover, Select } from "@/components/ui";
import { cn } from "@/lib/cn";

export type AgentMode = "quick" | "research" | "write";

export const MODE_OPTIONS: { value: AgentMode; label: string; icon: ReactNode; description: string }[] = [
  { value: "quick", label: "Quick answer", icon: <Lightning />, description: "Fast reply from your dashboard data" },
  { value: "research", label: "Deep research", icon: <Binoculars />, description: "Reads prompts, models and sources" },
  { value: "write", label: "Write content", icon: <PencilLine />, description: "Drafts briefs and pages for review" },
];

export interface Attachment {
  id: string;
  label: string;
  kind: "file" | "url" | "prompts" | "report";
}

const ATTACH_PRESETS: (Omit<Attachment, "id"> & { menu: string; description: string; icon: ReactNode })[] = [
  { kind: "file", label: "Q4-growth-notes.pdf", menu: "Upload a file", description: "PDF, CSV or DOCX up to 20 MB", icon: <UploadSimple /> },
  { kind: "url", label: "lumen.so/pricing", menu: "Add a page URL", description: "Sonya crawls it before answering", icon: <LinkSimple /> },
  { kind: "prompts", label: "22 tracked prompts", menu: "Attach prompt set", description: "From Your Prompts", icon: <ChatCircleText /> },
  { kind: "report", label: "Weekly AI visibility digest", menu: "Attach a report", description: "Latest export from Reports", icon: <FileText /> },
];

export function attachmentIcon(kind: Attachment["kind"]) {
  return ATTACH_PRESETS.find((p) => p.kind === kind)?.icon ?? <FileText />;
}

export function AttachmentChip({ item, onRemove }: { item: Attachment; onRemove?: () => void }) {
  return (
    <span className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-lg bg-surface pl-2 pr-1.5 t-caption-medium text-ink-2 shadow-control-soft [&>svg]:size-3.5">
      <span className="text-icon [&_svg]:size-3.5">{attachmentIcon(item.kind)}</span>
      <span className="truncate">{item.label}</span>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${item.label}`}
          onClick={onRemove}
          className="grid size-4 place-items-center rounded text-icon-muted transition-colors hover:bg-subtle hover:text-ink"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

/**
 * Agent composer — auto-growing textarea, + attach menu, mode select and send/stop button.
 * Enter sends, Shift+Enter adds a new line.
 */
export function Composer({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask Sonya anything…",
  large,
  busy,
  onStop,
  mode,
  onModeChange,
  autoFocus,
  className,
  textareaRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (text: string, attachments: Attachment[]) => void;
  placeholder?: string;
  large?: boolean;
  busy?: boolean;
  onStop?: () => void;
  mode?: AgentMode;
  onModeChange?: (m: AgentMode) => void;
  autoFocus?: boolean;
  className?: string;
  textareaRef?: React.MutableRefObject<HTMLTextAreaElement | null>;
}) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const inner = useRef<HTMLTextAreaElement | null>(null);
  const canSend = value.trim().length > 0 && !busy;

  // Auto-grow
  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, large ? 280 : 200)}px`;
  }, [value, large]);

  const submit = () => {
    if (!canSend) return;
    onSubmit(value.trim(), attachments);
    setAttachments([]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const addAttachment = (p: (typeof ATTACH_PRESETS)[number]) => {
    setAttachments((a) => (a.some((x) => x.kind === p.kind) ? a : [...a, { id: `${p.kind}-${Date.now()}`, kind: p.kind, label: p.label }]));
    inner.current?.focus();
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl bg-surface shadow-card transition-shadow duration-150 focus-within:shadow-[0_0_0_1px_var(--border-brand),0_0_0_4px_rgb(83_177_253/0.14),var(--fx-card)]",
        large ? "gap-2 p-3" : "gap-1.5 p-2.5",
        className,
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) inner.current?.focus();
      }}
    >
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1 pt-0.5">
          {attachments.map((a) => (
            <AttachmentChip key={a.id} item={a} onRemove={() => setAttachments((s) => s.filter((x) => x.id !== a.id))} />
          ))}
        </div>
      )}
      <textarea
        ref={(el) => {
          inner.current = el;
          if (textareaRef) textareaRef.current = el;
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={large ? 3 : 1}
        aria-label="Message Sonya"
        className={cn(
          "w-full resize-none bg-transparent px-1.5 text-ink outline-none placeholder:text-ink-3 focus-visible:shadow-none",
          large ? "min-h-[76px] pt-1 text-[15px] leading-[1.5] tracking-[-0.015em]" : "min-h-[28px] py-1 t-body",
        )}
      />
      <div className="flex items-center gap-1.5">
        <Popover
          side={large ? "bottom" : "top"}
          className="w-[280px]"
          trigger={({ open, toggle }) => (
            <IconButton label="Attach" size="xs" variant="outlined" tone="secondary" onClick={toggle} aria-expanded={open} className={cn(open && "bg-canvas text-ink")}>
              <Plus weight="bold" className={cn("size-3.5 transition-transform duration-150", open && "rotate-45")} />
            </IconButton>
          )}
        >
          {(close) => (
            <>
              <MenuLabel>Add context</MenuLabel>
              {ATTACH_PRESETS.slice(0, 2).map((p) => (
                <MenuItem
                  key={p.kind}
                  icon={p.icon}
                  description={p.description}
                  onClick={() => {
                    addAttachment(p);
                    close();
                  }}
                >
                  {p.menu}
                </MenuItem>
              ))}
              <MenuDivider />
              <MenuLabel>From Sonya</MenuLabel>
              {ATTACH_PRESETS.slice(2).map((p) => (
                <MenuItem
                  key={p.kind}
                  icon={p.icon}
                  description={p.description}
                  onClick={() => {
                    addAttachment(p);
                    close();
                  }}
                >
                  {p.menu}
                </MenuItem>
              ))}
            </>
          )}
        </Popover>
        {mode && onModeChange && (
          <Select
            size="xs"
            label="Agent mode"
            value={mode}
            onChange={onModeChange}
            options={MODE_OPTIONS}
            className="shadow-none hover:bg-subtle"
          />
        )}
        <span className="flex-1" />
        {large && !busy && (
          <span className="hidden items-center gap-1 t-caption text-ink-3 sm:inline-flex">
            <Kbd>↵</Kbd> to send · <Kbd>⇧</Kbd>
            <Kbd>↵</Kbd> new line
          </span>
        )}
        {busy ? (
          <IconButton label="Stop generating" size="sm" tone="primary" variant="filled" onClick={onStop} className="rounded-full">
            <Stop weight="fill" className="size-3.5" />
          </IconButton>
        ) : (
          <IconButton
            label="Send"
            size="sm"
            tone="primary"
            variant="filled"
            disabled={!canSend}
            onClick={submit}
            className="rounded-full"
          >
            <ArrowUp weight="bold" className="size-4" />
          </IconButton>
        )}
      </div>
    </div>
  );
}
