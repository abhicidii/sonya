import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Button — Figma "Button" (Type × Style × Size × State).
 * type: primary (ink) | secondary (neutral) | danger
 * variant: filled | outlined | link
 * size: md 40 · sm 32 (app default) · xs 28
 */
export type ButtonTone = "primary" | "secondary" | "danger";
export type ButtonVariant = "filled" | "outlined" | "link";
export type ButtonSize = "md" | "sm" | "xs";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
}

const sizes: Record<ButtonSize, string> = {
  md: "h-10 px-4 gap-2 rounded-[10px] t-label",
  sm: "h-8 px-3 gap-1.5 rounded-lg t-label",
  xs: "h-7 px-2.5 gap-1 rounded-md t-caption-medium",
};

const styles: Record<ButtonTone, Record<ButtonVariant, string>> = {
  primary: {
    filled:
      "bg-primary text-on-primary shadow-button-primary hover:bg-primary-hover active:bg-primary-pressed disabled:bg-subtle disabled:text-ink-3 disabled:shadow-none",
    outlined:
      "bg-surface text-ink shadow-control hover:bg-canvas active:bg-subtle disabled:text-ink-3 disabled:shadow-control-soft",
    link: "text-ink hover:bg-subtle active:bg-hover disabled:text-ink-3",
  },
  secondary: {
    filled: "bg-subtle text-ink-2 hover:bg-hover hover:text-ink active:bg-muted/60 disabled:text-ink-3",
    outlined:
      "bg-surface text-ink-2 shadow-control-soft hover:text-ink hover:bg-canvas active:bg-subtle disabled:text-ink-3",
    link: "text-ink-2 hover:text-ink hover:bg-subtle disabled:text-ink-3",
  },
  danger: {
    filled:
      "bg-[var(--red-600)] text-white shadow-[0_0_0_1px_var(--red-700),0_1px_2px_rgb(9_9_11/0.08)] hover:bg-[var(--red-700)] disabled:opacity-50",
    outlined: "bg-surface text-danger shadow-control-soft hover:bg-danger-subtle disabled:opacity-50",
    link: "text-danger hover:bg-danger-subtle disabled:opacity-50",
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { tone = "primary", variant = "filled", size = "sm", iconLeft, iconRight, loading, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] disabled:active:scale-100 [&_svg]:shrink-0",
        sizes[size],
        styles[tone][variant],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : iconLeft}
      {children}
      {iconRight}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  children: ReactNode;
}

const iconSizes: Record<ButtonSize, string> = {
  md: "size-10 rounded-[10px]",
  sm: "size-8 rounded-lg",
  xs: "size-7 rounded-md",
};

/** Icon-only button. `label` is required for screen readers and the native tooltip. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { tone = "secondary", variant = "outlined", size = "sm", label, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-grid shrink-0 place-items-center transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.96] after:absolute after:-inset-1 after:content-['']",
        iconSizes[size],
        styles[tone][variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("size-4 animate-[sy-spin_0.8s_linear_infinite]", className)} aria-hidden>
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
