import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CaretDown, Check, CheckCircle, Info, Warning, X } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { IconButton } from "./Button";

/* -------------------------------------------------------------------------- */
/* Popover                                                                     */
/* -------------------------------------------------------------------------- */

function useOutside(refs: React.RefObject<HTMLElement>[], open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (refs.every((r) => !r.current || !r.current.contains(e.target as Node))) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, refs]);
}

/**
 * Popover anchored to its trigger. `trigger` receives open state + toggle.
 * The panel renders in a portal with fixed positioning, so it is never clipped by
 * scrolling tables or cards; it flips above the trigger when there is no room below.
 */
export function Popover({
  trigger,
  children,
  align = "start",
  side = "bottom",
  className,
  open: controlled,
  onOpenChange,
  wrapperClassName,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "start" | "end";
  side?: "bottom" | "top";
  className?: string;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  wrapperClassName?: string;
}) {
  const [inner, setInner] = useState(false);
  const open = controlled ?? inner;
  const setOpen = useCallback((o: boolean) => (onOpenChange ? onOpenChange(o) : setInner(o)), [onOpenChange]);
  const ref = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const refs = useRef([ref, panel]).current;
  const close = useCallback(() => setOpen(false), [setOpen]);
  const [pos, setPos] = useState<React.CSSProperties | null>(null);
  const [placed, setPlaced] = useState<"bottom" | "top">(side);
  useOutside(refs, open, close);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const ph = panel.current?.offsetHeight ?? 280;
      const below = window.innerHeight - r.bottom;
      const s = side === "bottom" && below < ph + 12 && r.top > below ? "top" : side === "top" && r.top < ph + 12 && below > r.top ? "bottom" : side;
      setPlaced(s);
      setPos({
        position: "fixed",
        minWidth: Math.max(200, r.width),
        ...(align === "start" ? { left: Math.max(8, r.left) } : { right: Math.max(8, window.innerWidth - r.right) }),
        ...(s === "bottom" ? { top: r.bottom + 6 } : { bottom: window.innerHeight - r.top + 6 }),
      });
    };
    place();
    const raf = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, align, side]);

  return (
    <div ref={ref} className={cn("relative inline-flex", wrapperClassName)}>
      {trigger({ open, toggle: () => setOpen(!open) })}
      {open &&
        createPortal(
          <div
            ref={panel}
            style={pos ?? { position: "fixed", visibility: "hidden" }}
            className={cn(
              "z-[55] max-h-[min(420px,70vh)] overflow-y-auto rounded-xl bg-surface p-1 shadow-popover animate-[sy-pop-in_160ms_var(--ease-out)]",
              placed === "bottom" ? "origin-top" : "origin-bottom",
              className,
            )}
          >
            {typeof children === "function" ? children(close) : children}
          </div>,
          document.body,
        )}
    </div>
  );
}

export function MenuItem({
  icon,
  children,
  onClick,
  selected,
  danger,
  shortcut,
  description,
  className,
}: {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  danger?: boolean;
  shortcut?: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left t-body transition-colors duration-100",
        danger ? "text-danger hover:bg-danger-subtle" : "text-ink hover:bg-subtle",
        className,
      )}
    >
      {icon && <span className={cn("inline-flex shrink-0 [&>svg]:size-4", danger ? "text-danger" : "text-icon")}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{children}</span>
        {description && <span className="block truncate t-caption text-ink-3">{description}</span>}
      </span>
      {shortcut && <span className="t-caption text-ink-3">{shortcut}</span>}
      {selected && <Check weight="bold" className="size-3.5 shrink-0 text-ink" />}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2 pb-1 pt-2 t-caption text-ink-3">{children}</div>;
}

export function MenuDivider() {
  return <div className="mx-1 my-1 h-px bg-line" />;
}

/**
 * Select — Secondary Outlined button that opens a menu ("All sites ⌄", "Last 7 days ⌄").
 */
export function Select<T extends string>({
  value,
  options,
  onChange,
  icon,
  align = "start",
  size = "sm",
  className,
  renderValue,
  label,
  block,
}: {
  value: T;
  options: { value: T; label: ReactNode; icon?: ReactNode; description?: ReactNode }[];
  onChange: (v: T) => void;
  icon?: ReactNode;
  align?: "start" | "end";
  size?: "sm" | "xs";
  className?: string;
  renderValue?: (v: T) => ReactNode;
  label?: string;
  /** Stretch the trigger to the full width of its container (forms). */
  block?: boolean;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <Popover
      align={align}
      wrapperClassName={block ? "flex w-full" : undefined}
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={label}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg bg-surface text-ink shadow-control-soft transition-colors hover:bg-canvas [&>span>svg]:size-4",
            size === "sm" ? "h-8 px-2.5 t-label" : "h-7 px-2 t-caption-medium",
            open && "bg-canvas",
            block && "w-full justify-between [&>span:nth-last-child(2)]:flex-1 [&>span:nth-last-child(2)]:text-left",
            className,
          )}
        >
          {icon && <span className="text-icon">{icon}</span>}
          {current?.icon && !icon && <span className="text-icon">{current.icon}</span>}
          <span className="truncate">{renderValue ? renderValue(value) : current?.label}</span>
          <CaretDown className={cn("!size-3.5 text-icon-subtle transition-transform duration-150", open && "rotate-180")} />
        </button>
      )}
    >
      {(close) => (
        <div role="listbox" className="max-h-80 overflow-y-auto">
          {options.map((o) => (
            <MenuItem
              key={o.value}
              icon={o.icon}
              selected={o.value === value}
              description={o.description}
              onClick={() => {
                onChange(o.value);
                close();
              }}
            >
              {o.label}
            </MenuItem>
          ))}
        </div>
      )}
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialog                                                                      */
/* -------------------------------------------------------------------------- */

export function Dialog({
  open,
  onClose,
  children,
  className,
  title,
  description,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  const widths = { sm: "max-w-[420px]", md: "max-w-[560px]", lg: "max-w-[760px]", xl: "max-w-[1040px]" };
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-scrim backdrop-blur-[2px] animate-[sy-fade-in_160ms_ease-out]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative flex max-h-[min(88vh,820px)] w-full flex-col overflow-hidden rounded-2xl bg-surface shadow-popover animate-[sy-dialog-in_200ms_var(--ease-out)]",
          widths[size],
          className,
        )}
      >
        {title && (
          <div className="flex items-start gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0 flex-1">
              <h2 className="t-heading text-ink">{title}</h2>
              {description && <p className="mt-1 t-caption text-ink-2">{description}</p>}
            </div>
            <IconButton label="Close" variant="link" size="xs" onClick={onClose}>
              <X className="size-4" />
            </IconButton>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line bg-canvas px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */
/* Toast                                                                       */
/* -------------------------------------------------------------------------- */

type ToastTone = "success" | "info" | "warning";
interface ToastItem {
  id: number;
  title: ReactNode;
  description?: ReactNode;
  tone: ToastTone;
  action?: { label: string; onClick: () => void };
}

const ToastCtx = createContext<(t: Omit<ToastItem, "id" | "tone"> & { tone?: ToastTone }) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((t: Omit<ToastItem, "id" | "tone"> & { tone?: ToastTone }) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s.slice(-2), { id, tone: "success", ...t }]);
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-2" aria-live="polite">
          {items.map((t) => (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-2.5 rounded-xl bg-surface p-3 shadow-popover animate-[sy-toast-in_220ms_var(--ease-out)]"
            >
              <span className="mt-px">
                {t.tone === "success" && <CheckCircle weight="fill" className="size-[18px] text-[var(--status-success)]" />}
                {t.tone === "info" && <Info weight="fill" className="size-[18px] text-[var(--blue-500)]" />}
                {t.tone === "warning" && <Warning weight="fill" className="size-[18px] text-[var(--status-warning)]" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="t-body-medium text-ink">{t.title}</div>
                {t.description && <div className="mt-0.5 t-caption text-ink-2">{t.description}</div>}
              </div>
              {t.action && (
                <button onClick={t.action.onClick} className="t-caption-medium text-ink underline-offset-2 hover:underline">
                  {t.action.label}
                </button>
              )}
              <button aria-label="Dismiss" onClick={() => setItems((s) => s.filter((i) => i.id !== t.id))} className="text-icon-muted hover:text-ink">
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}
