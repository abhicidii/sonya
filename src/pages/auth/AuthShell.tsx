import { forwardRef, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChatCircleDots, Eye, EyeSlash } from "@phosphor-icons/react";
import {
  Avatar,
  Badge,
  BrandMark,
  Card,
  CardHeader,
  CardPanel,
  DeltaText,
  Input,
  KpiCard,
  SonyaLogo,
  StatusDot,
  StatusPill,
  useToast,
  type InputProps,
} from "@/components/ui";
import { LineChart } from "@/components/charts";
import { brands, days14 } from "@/data/mock";
import { cn, fmt } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/* Helpers shared by Sign in / Sign up / Onboarding                            */
/* -------------------------------------------------------------------------- */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const DOMAIN_RE = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
export const FREE_MAIL = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "proton.me", "aol.com"];

/** Strip protocol, www and paths: "https://www.Lumen.so/pricing" → "lumen.so". */
export function normalizeDomain(v: string) {
  return v
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

/** setTimeout that is cleared automatically when the page unmounts. */
export function useDelayed() {
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);
  return useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
}

/** Password input with a show / hide toggle in the trailing slot. */
export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false);
  return (
    <Input
      ref={ref}
      {...props}
      type={show ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="-mr-1 grid size-7 place-items-center rounded-md text-icon-subtle transition-colors hover:bg-subtle hover:text-ink"
        >
          {show ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
    />
  );
});

/** Neutral four-colour "G" glyph — not the vendor logo; swap in the real one in your product. */
export function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" className={cn("size-4", className)} aria-hidden fill="none" strokeWidth="2.6">
      <path d="M13.98 4.82A6.5 6.5 0 0 0 3.37 5.75" stroke="#ea4335" />
      <path d="M3.37 5.75a6.5 6.5 0 0 0 0 6.5" stroke="#fbbc05" />
      <path d="M3.37 12.25a6.5 6.5 0 0 0 10.61.93" stroke="#34a853" />
      <path d="M13.98 13.18A6.5 6.5 0 0 0 15.5 9H9" stroke="#4285f4" />
    </svg>
  );
}

export function OrDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 t-caption text-ink-3">
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/** Dot-matrix field used behind showcase panels. Masked so it fades at the edges. */
export function DotField({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]",
        className,
      )}
      style={{
        backgroundImage: "radial-gradient(var(--border-strong) 1px, transparent 1.2px)",
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                      */
/* -------------------------------------------------------------------------- */

export function AuthLayout({
  children,
  topRight,
  headline,
  sub,
}: {
  children: ReactNode;
  topRight?: ReactNode;
  headline: ReactNode;
  sub: ReactNode;
}) {
  const toast = useToast();
  const legal = (label: string) => () => toast({ tone: "info", title: label, description: "Placeholder link — point it at your own page." });
  return (
    <div className="flex min-h-dvh bg-surface">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 px-5 sm:px-8">
          <Link to="/signin" aria-label="Sonya home" className="rounded-lg">
            <SonyaLogo size={26} />
          </Link>
          <div className="t-caption text-ink-2">{topRight}</div>
        </header>
        <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[380px]">{children}</div>
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-2 px-5 pb-5 t-caption text-ink-3 sm:px-8">
          <span>© 2026 Sonya</span>
          <span className="flex items-center gap-3">
            <button type="button" onClick={legal("Privacy policy")} className="transition-colors hover:text-ink">
              Privacy
            </button>
            <button type="button" onClick={legal("Terms of service")} className="transition-colors hover:text-ink">
              Terms
            </button>
          </span>
        </footer>
      </div>
      <AuthShowcase headline={headline} sub={sub} />
    </div>
  );
}

/** Text link styled for auth copy ("Create account", "Sign in"). */
export function AuthLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="t-caption-medium text-ink underline decoration-line-strong underline-offset-[3px] transition-colors hover:decoration-[var(--text-primary)]">
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Showcase panel — a floating mini dashboard built from real components       */
/* -------------------------------------------------------------------------- */

const seriesColor = (c: string, you?: boolean) => (you ? "var(--data-1)" : c === "#141414" ? "#737373" : c);

function AuthShowcase({ headline, sub }: { headline: ReactNode; sub: ReactNode }) {
  const series = brands.slice(0, 3).map((b) => ({
    id: b.id,
    label: b.name,
    values: b.trend,
    color: seriesColor(b.color, b.you),
    emphasis: b.you,
  }));

  return (
    <aside className="sticky top-3 m-3 ml-0 hidden h-[calc(100dvh-24px)] w-[52%] max-w-[840px] shrink-0 flex-col self-start overflow-hidden rounded-[20px] bg-canvas shadow-inner-ring lg:flex">
      <DotField size={18} />

      <div className="relative z-10 px-10 pt-10 xl:px-12 xl:pt-12">
        <span className="inline-flex h-7 items-center gap-2 rounded-full bg-surface px-2.5 t-caption-medium text-ink-2 shadow-control-soft">
          <StatusDot tone="success" />
          Tracking 6 AI answer engines
        </span>
        <h2 className="mt-4 max-w-[460px] text-[28px] font-medium leading-[1.15] tracking-[-0.03em] text-ink [text-wrap:balance]">{headline}</h2>
        <p className="mt-3 max-w-[420px] t-body text-ink-2">{sub}</p>
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="absolute left-10 top-8 w-[600px] animate-[sy-pop-in_500ms_var(--ease-out)] xl:left-12">
          {/* Window */}
          <div className="rounded-[18px] bg-surface p-1.5 shadow-panel">
            <div className="flex items-center gap-2 px-2.5 py-2">
              <SonyaLogo size={20} wordmark={false} />
              <span className="t-label text-ink">AEO Insights</span>
              <span className="t-caption text-ink-3">/ Visibility</span>
              <span className="flex-1" />
              <StatusPill tone="success">Live</StatusPill>
            </div>
            <div className="grid grid-cols-2 gap-2 p-1.5">
              <KpiCard label="Visibility score" icon={<Eye weight="fill" />} tile="blue" value="41.8%" unit="of answers" delta={{ value: "+3.2 pts", direction: "up" }} />
              <KpiCard label="Share of voice" icon={<ChatCircleDots weight="fill" />} tile="orange" value="18.4%" unit="of mentions" delta={{ value: "+1.3 pts", direction: "up" }} />
            </div>
            <div className="p-1.5 pt-0.5">
              <Card>
                <CardHeader title="Visibility trend" description="Last 14 days · share of answers" className="min-h-0 py-2" />
                <CardPanel className="px-3 pb-2 pt-3">
                  <LineChart labels={days14} series={series} height={150} yTicks={3} format={(v) => `${Math.round(v)}%`} />
                </CardPanel>
              </Card>
            </div>
          </div>

          {/* Floating rankings card */}
          <div className="absolute left-[300px] top-[236px] w-[300px] animate-[sy-pop-in_600ms_120ms_var(--ease-out)_both]">
            <Card className="shadow-popover">
              <CardHeader title={<span className="t-label">Rankings</span>} meta="This week" className="min-h-0 py-2" />
              <CardPanel flush className="px-3 py-1">
                {brands.slice(0, 4).map((b, i) => (
                  <div key={b.id} className="flex items-center gap-2.5 border-b border-line py-2.5 last:border-b-0">
                    <span className="w-3 t-num-sm text-ink-3">{i + 1}</span>
                    <BrandMark brand={b} size={20} />
                    <span className="t-body-medium text-ink">{b.name}</span>
                    {b.you && <Badge tone="inverse">You</Badge>}
                    <span className="flex-1" />
                    <span className="t-num-sm-medium text-ink">{fmt.pct(b.visibility)}</span>
                    <DeltaText value={fmt.signed(b.visDelta)} good={b.visDelta >= 0} className="w-9 text-right" />
                  </div>
                ))}
              </CardPanel>
            </Card>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-linear-to-t from-canvas from-40% to-transparent" />
      <figure className="absolute inset-x-0 bottom-0 z-10 px-10 pb-10 xl:px-12 xl:pb-12">
        <blockquote className="max-w-[480px] t-body-medium text-ink [text-wrap:pretty]">
          “Sonya showed us we were invisible in Perplexity for our ten biggest buying questions. Six weeks later we’re cited in seven of them.”
        </blockquote>
        <figcaption className="mt-4 flex items-center gap-2.5">
          <Avatar name="Priya Natarajan" size={32} />
          <span>
            <span className="block t-caption-medium text-ink">Priya Natarajan</span>
            <span className="block t-caption text-ink-3">Head of Content, Fernly</span>
          </span>
        </figcaption>
      </figure>
    </aside>
  );
}
