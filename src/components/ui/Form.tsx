import { createContext, forwardRef, useContext, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

/** Field passes its label/hint ids down so Input/Textarea get an accessible name automatically. */
const FieldCtx = createContext<{ labelId: string; hintId: string } | null>(null);
import { Check, MagnifyingGlass, Minus } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { Kbd } from "./Misc";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  iconLeft?: ReactNode;
  trailing?: ReactNode;
  size?: "md" | "sm";
  invalid?: boolean;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { iconLeft, trailing, size = "sm", invalid, className, wrapperClassName, ...rest },
  ref,
) {
  const field = useContext(FieldCtx);
  return (
    <label
      className={cn(
        "group flex items-center gap-2 bg-surface text-ink shadow-input transition-shadow duration-150 focus-within:shadow-[0_0_0_1px_var(--border-brand),0_0_0_4px_rgb(83_177_253/0.18)]",
        size === "md" ? "h-10 rounded-[10px] px-3" : "h-8 rounded-lg px-2.5",
        invalid && "shadow-[0_0_0_1px_var(--red-500)] focus-within:shadow-[0_0_0_1px_var(--red-500),0_0_0_4px_rgb(240_68_56/0.16)]",
        rest.disabled && "opacity-60",
        wrapperClassName,
      )}
    >
      {iconLeft && <span className="inline-flex text-icon-muted [&>svg]:size-4">{iconLeft}</span>}
      <input
        ref={ref}
        aria-labelledby={field && !rest["aria-label"] ? field.labelId : undefined}
        aria-describedby={field?.hintId}
        aria-invalid={invalid || undefined}
        className={cn(
          "min-w-0 flex-1 bg-transparent t-body text-[14px] outline-none placeholder:text-ink-3 focus-visible:shadow-none",
          className,
        )}
        {...rest}
      />
      {trailing}
    </label>
  );
});

export function SearchInput({ shortcut, ...props }: InputProps & { shortcut?: string }) {
  return (
    <Input
      iconLeft={<MagnifyingGlass />}
      placeholder="Search…"
      trailing={shortcut ? <Kbd>{shortcut}</Kbd> : undefined}
      {...props}
    />
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...rest },
  ref,
) {
  const field = useContext(FieldCtx);
  return (
    <textarea
      ref={ref}
      aria-labelledby={field && !rest["aria-label"] ? field.labelId : undefined}
      aria-describedby={field?.hintId}
      className={cn(
        "w-full resize-none rounded-[10px] bg-surface px-3 py-2.5 t-body text-ink shadow-input outline-none transition-shadow placeholder:text-ink-3 focus:shadow-[0_0_0_1px_var(--border-brand),0_0_0_4px_rgb(83_177_253/0.18)]",
        className,
      )}
      {...rest}
    />
  );
});

export function Field({
  label,
  hint,
  error,
  children,
  aside,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const ctx = { labelId: `${id}-label`, hintId: `${id}-hint` };
  return (
    <FieldCtx.Provider value={ctx}>
      <div role="group" aria-labelledby={ctx.labelId} className={cn("flex flex-col gap-1.5", className)}>
        <div className="flex items-center justify-between">
          <span id={ctx.labelId} className="t-caption-medium text-ink">
            {label}
          </span>
          {aside}
        </div>
        {children}
        {error ? (
          <span id={ctx.hintId} role="alert" className="t-caption text-danger">
            {error}
          </span>
        ) : hint ? (
          <span id={ctx.hintId} className="t-caption text-ink-3">
            {hint}
          </span>
        ) : null}
      </div>
    </FieldCtx.Provider>
  );
}

export function Checkbox({
  checked,
  indeterminate,
  onChange,
  label,
  disabled,
  className,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange?: (v: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const on = checked || indeterminate;
  return (
    <label htmlFor={id} className={cn("inline-flex cursor-pointer items-center gap-2 t-body text-ink", disabled && "cursor-not-allowed opacity-50", className)}>
      <span className="relative inline-grid size-4 place-items-center">
        <input
          id={id}
          type="checkbox"
          className="peer absolute inset-0 cursor-pointer opacity-0"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <span
          className={cn(
            "pointer-events-none grid size-4 place-items-center rounded-[5px] transition-colors duration-100 peer-focus-visible:shadow-focus",
            on ? "bg-primary text-on-primary shadow-button-primary" : "bg-surface shadow-control",
          )}
        >
          {indeterminate ? <Minus weight="bold" className="size-2.5" /> : checked ? <Check weight="bold" className="size-2.5" /> : null}
        </span>
      </span>
      {label}
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  size = "sm",
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  size?: "sm" | "xs";
  disabled?: boolean;
}) {
  const w = size === "sm" ? "w-8 h-[18px]" : "w-7 h-4";
  const k = size === "sm" ? "size-3.5" : "size-3";
  const x = size === "sm" ? "translate-x-[14px]" : "translate-x-3";
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 t-caption-medium text-ink-2", disabled && "opacity-50")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-out",
          w,
          checked ? "bg-[var(--blue-600)]" : "bg-muted",
        )}
      >
        <span className={cn("rounded-full bg-white shadow-xs transition-transform duration-200 ease-out", k, checked && x)} />
      </button>
      {label}
    </label>
  );
}

/** Radio-like selectable card / chip used in onboarding and filters. */
export function ChoiceChip({
  selected,
  onClick,
  children,
  icon,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-lg px-3 t-label transition-[box-shadow,background-color,color] duration-150",
        selected
          ? "bg-surface text-ink shadow-[0_0_0_1.5px_var(--text-primary),0_1px_2px_rgb(40_40_40/0.08)]"
          : "bg-surface text-ink-2 shadow-control hover:text-ink",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}
