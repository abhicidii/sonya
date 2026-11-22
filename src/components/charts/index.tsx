import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/* Shared ----------------------------------------------------------------- */

/** Measure an element's width so SVG charts render 1:1 (no stretched text or dots). */
function useWidth<T extends HTMLElement>(fallback = 800) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(120, Math.round(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function Legend({ items, className }: { items: { label: ReactNode; color: string; dashed?: boolean }[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5", className)}>
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 t-caption text-ink-2">
          {it.dashed ? (
            <span className="w-4 border-t border-dashed" style={{ borderColor: it.color }} />
          ) : (
            <span className="size-2.5 rounded-[3px]" style={{ background: it.color }} />
          )}
          {it.label}
        </span>
      ))}
    </div>
  );
}

function ChartTooltip({ x, y, children, flip }: { x: number | string; y: number; children: ReactNode; flip?: boolean }) {
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-lg bg-inverse px-2.5 py-2 text-on-inverse shadow-tooltip animate-[sy-fade-in_100ms_ease-out]"
      style={{ left: x, top: y, transform: `translate(${flip ? "calc(-100% - 12px)" : "12px"}, -50%)` }}
    >
      {children}
    </div>
  );
}

/* Dot matrix ------------------------------------------------------------- */

/**
 * Card/Chart · dot matrix. Each column is a period; dots stack bottom-up.
 * series[0] is the darker primary series, series[1] stacks above it.
 * Empty cells render as ghost dots. Optional dashed target line.
 */
export function DotMatrix({
  labels,
  series,
  target,
  rows = 16,
  cols = 5,
  max,
  height = 220,
  selected,
  onSelect,
  formatTip,
}: {
  labels: string[];
  series: { values: (number | null)[]; color: string; highlight?: string }[];
  target?: number[];
  rows?: number;
  cols?: number;
  max?: number;
  height?: number;
  selected?: number;
  onSelect?: (i: number) => void;
  formatTip?: (i: number) => ReactNode;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [ref, W] = useWidth<HTMLDivElement>();
  const totals = labels.map((_, i) => series.reduce((a, s) => a + (s.values[i] ?? 0), 0));
  const top = max ?? Math.max(...totals, ...(target ?? [0])) * 1.08;
  const active = hover ?? selected ?? null;
  const groupW = W / labels.length;
  const gap = 3;
  const dot = Math.max(3, Math.min((groupW - 14 - gap * (cols - 1)) / cols, (height - gap * (rows - 1)) / rows));
  const innerW = cols * dot + (cols - 1) * gap;
  const innerH = rows * dot + (rows - 1) * gap;
  const yFor = (v: number) => innerH - (v / top) * innerH;

  return (
    <div ref={ref} className="relative w-full select-none" onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 -6 ${W} ${innerH + 34}`} width={W} height={innerH + 34} className="block">
        {labels.map((label, i) => {
          const gx = i * groupW + (groupW - innerW) / 2;
          const hasData = series.some((s) => s.values[i] !== null && s.values[i] !== undefined);
          const filledCells: string[] = [];
          let cursor = 0;
          series.forEach((s) => {
            const v = s.values[i] ?? 0;
            const cells = Math.round((v / top) * rows * cols);
            const color = active === i && s.highlight ? s.highlight : s.color;
            for (let k = 0; k < cells; k++) filledCells[cursor + k] = color;
            cursor += cells;
          });
          return (
            <g key={label} onMouseEnter={() => setHover(i)} onClick={() => onSelect?.(i)} className={onSelect ? "cursor-pointer" : undefined}>
              <rect x={i * groupW} y={0} width={groupW} height={innerH + 28} fill="transparent" />
              {active === i && (
                <rect x={gx - 5} y={-5} width={innerW + 10} height={innerH + 10} rx={6} fill="var(--bg-brand-subtle)" stroke="var(--border-brand)" strokeWidth={1.5} />
              )}
              {Array.from({ length: rows * cols }).map((_, k) => {
                const r = Math.floor(k / cols);
                const c = k % cols;
                const fill = filledCells[k];
                return (
                  <rect
                    key={k}
                    x={gx + c * (dot + gap)}
                    y={innerH - (r + 1) * dot - r * gap}
                    width={dot}
                    height={dot}
                    rx={dot * 0.28}
                    fill={fill ?? "var(--data-ghost)"}
                    stroke={fill ? undefined : "var(--data-ghost-ring)"}
                    strokeWidth={fill ? 0 : 1}
                   
                    opacity={!hasData ? 0.7 : 1}
                  />
                );
              })}
              <text x={i * groupW + groupW / 2} y={innerH + 22} textAnchor="middle" className="fill-[var(--text-secondary)]" style={{ fontSize: 12 }}>
                {label}
              </text>
            </g>
          );
        })}
        {target && (
          <polyline
            points={target.map((t, i) => `${i * groupW + groupW / 2},${yFor(t)}`).join(" ")}
            fill="none"
            stroke="var(--data-target)"
            strokeWidth={1.25}
            strokeDasharray="4 4"
           
          />
        )}
      </svg>
      {active !== null && formatTip && (
        <ChartTooltip x={(active + 0.5) * groupW + (active > labels.length / 2 ? -innerW / 2 : innerW / 2)} y={Math.max(24, yFor(totals[active]) + 6)} flip={active > labels.length / 2}>
          {formatTip(active)}
        </ChartTooltip>
      )}
    </div>
  );
}

/* Line chart ------------------------------------------------------------- */

export interface LineSeries {
  id: string;
  label: string;
  values: number[];
  color: string;
  emphasis?: boolean;
  dashed?: boolean;
}

/**
 * Multi-series line chart with a hover crosshair. Brand line = emphasis (thicker + area fill).
 */
export function LineChart({
  labels,
  series,
  height = 240,
  yMin,
  yMax,
  yTicks = 4,
  format = (v: number) => `${Math.round(v)}`,
  area = true,
  className,
}: {
  labels: string[];
  series: LineSeries[];
  height?: number;
  yMin?: number;
  yMax?: number;
  yTicks?: number;
  format?: (v: number) => string;
  area?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const [ref, W] = useWidth<HTMLDivElement>();
  const all = series.flatMap((s) => s.values);
  const lo = yMin ?? Math.floor(Math.min(...all) * 0.9);
  const rawHi = yMax ?? Math.ceil(Math.max(...all) * 1.08);
  const hi = rawHi > lo ? rawHi : lo + 1; // flat series (e.g. all zeros) still get a valid scale
  const H = height;
  const padL = 40;
  const padB = 26;
  const padT = 8;
  const plotW = W - padL - 8;
  const plotH = H - padB - padT;
  const x = (i: number) => padL + (labels.length === 1 ? plotW / 2 : (i / (labels.length - 1)) * plotW);
  const y = (v: number) => padT + plotH - ((v - lo) / (hi - lo)) * plotH;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => lo + ((hi - lo) / yTicks) * i);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  const step = Math.ceil(labels.length / Math.max(2, Math.floor(W / 90)));

  return (
    <div ref={ref} className={cn("relative w-full", className)} onMouseLeave={() => setHover(null)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="block"
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((px - padL) / plotW) * (labels.length - 1));
          setHover(Math.max(0, Math.min(labels.length - 1, i)));
        }}
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={s.id} id={`g-${uid}-${s.id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.16} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - 8} y1={y(t)} y2={y(t)} stroke="var(--data-grid)" strokeDasharray="3 4" />
            <text x={padL - 10} y={y(t) + 4} textAnchor="end" className="fill-[var(--text-tertiary)] font-mono" style={{ fontSize: 11 }}>
              {format(t)}
            </text>
          </g>
        ))}
        {labels.map((l, i) =>
          i % step === 0 || i === labels.length - 1 ? (
            <text key={l + i} x={x(i)} y={H - 6} textAnchor="middle" className="fill-[var(--text-tertiary)]" style={{ fontSize: 11 }}>
              {l}
            </text>
          ) : null,
        )}
        {area &&
          series
            .filter((s) => s.emphasis)
            .map((s) => (
              <path key={`a-${s.id}`} d={`${path(s.values)} L${x(s.values.length - 1)},${padT + plotH} L${x(0)},${padT + plotH} Z`} fill={`url(#g-${uid}-${s.id})`} />
            ))}
        {series.map((s) => (
          <path
            key={s.id}
            d={path(s.values)}
            fill="none"
            stroke={s.color}
            strokeWidth={s.emphasis ? 2.25 : 1.5}
            strokeOpacity={hover !== null || s.emphasis ? 1 : 0.85}
            strokeDasharray={s.dashed ? "5 5" : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
           
          />
        ))}
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + plotH} stroke="var(--border-strong)" />
        )}
      </svg>
      {hover !== null &&
        series.map((s) => (
          <span
            key={s.id}
            className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface"
            style={{ left: x(hover), top: y(s.values[hover]), background: s.color }}
          />
        ))}
      {hover !== null && (
        <ChartTooltip x={x(hover)} y={H / 2 - 10} flip={hover > labels.length / 2}>
          <div className="mb-1.5 t-caption opacity-70">{labels[hover]}</div>
          <div className="flex flex-col gap-1">
            {[...series]
              .sort((a, b) => b.values[hover] - a.values[hover])
              .slice(0, 6)
              .map((s) => (
                <div key={s.id} className="flex items-center gap-2 t-caption">
                  <span className="size-2 rounded-[2px]" style={{ background: s.color }} />
                  <span className="flex-1 pr-3">{s.label}</span>
                  <span className="t-num-sm-medium">{format(s.values[hover])}</span>
                </div>
              ))}
          </div>
        </ChartTooltip>
      )}
    </div>
  );
}

/* Donut ------------------------------------------------------------------ */

export function Donut({
  data,
  size = 180,
  thickness = 22,
  center,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  center?: ReactNode;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = size / 2 - thickness / 2 - 2;
  const c = 2 * Math.PI * r;
  const gapLen = 3;
  let offset = 0;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--data-ghost)" strokeWidth={thickness} />
        {data.map((d, i) => {
          const len = (d.value / total) * c;
          const el = (
            <circle
              key={d.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={hover === i ? thickness + 4 : thickness}
              strokeDasharray={`${Math.max(0, len - gapLen)} ${c}`}
              strokeDashoffset={-offset}
              className="transition-[stroke-width] duration-150"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        {hover !== null ? (
          <div>
            <div className="t-num-lg text-ink">{((data[hover].value / total) * 100).toFixed(1)}%</div>
            <div className="t-caption text-ink-2">{data[hover].label}</div>
          </div>
        ) : (
          center
        )}
      </div>
    </div>
  );
}

/* Sparkline -------------------------------------------------------------- */

export function Sparkline({
  values,
  color = "var(--data-1)",
  width = 80,
  height = 24,
  area = true,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  area?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const { d, a } = useMemo(() => {
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const pts = values.map((v, i) => [(i / (values.length - 1)) * width, height - 2 - ((v - lo) / (hi - lo || 1)) * (height - 4)]);
    const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    return { d, a: `${d} L${width},${height} L0,${height} Z` };
  }, [values, width, height]);
  return (
    <svg width={width} height={height} className="block overflow-visible">
      <defs>
        <linearGradient id={`s-${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {area && <path d={a} fill={`url(#s-${uid})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Bars ------------------------------------------------------------------- */

/** Vertical bar chart (traffic per day, mentions per model). */
export function BarChart({
  labels,
  series,
  height = 200,
  stacked = true,
  format = (v: number) => `${v}`,
}: {
  labels: string[];
  series: { label: string; values: number[]; color: string }[];
  height?: number;
  stacked?: boolean;
  format?: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const totals = labels.map((_, i) => (stacked ? series.reduce((a, s) => a + s.values[i], 0) : Math.max(...series.map((s) => s.values[i]))));
  const top = Math.max(...totals) * 1.1;
  const step = Math.ceil(labels.length / 10);
  return (
    <div className="relative" onMouseLeave={() => setHover(null)}>
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {labels.map((l, i) => (
          <div key={l + i} className="group relative flex h-full flex-1 flex-col justify-end" onMouseEnter={() => setHover(i)}>
            <div className={cn("flex w-full flex-col-reverse overflow-hidden rounded-[4px] transition-opacity", hover !== null && hover !== i && "opacity-50")}>
              {series.map((s) => (
                <div key={s.label} style={{ height: (s.values[i] / top) * height, background: s.color }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[3px]">
        {labels.map((l, i) => (
          <div key={l + i} className="flex-1 text-center t-caption text-ink-3">
            {i % step === 0 ? l : ""}
          </div>
        ))}
      </div>
      {hover !== null && (
        <ChartTooltip x={`${((hover + 0.5) / labels.length) * 100}%`} y={height / 2} flip={hover > labels.length / 2}>
          <div className="mb-1.5 t-caption opacity-70">{labels[hover]}</div>
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-2 t-caption">
              <span className="size-2 rounded-[2px]" style={{ background: s.color }} />
              <span className="flex-1 pr-3">{s.label}</span>
              <span className="t-num-sm-medium">{format(s.values[hover])}</span>
            </div>
          ))}
        </ChartTooltip>
      )}
    </div>
  );
}

/** 100% stacked horizontal bar (sentiment split, domain types). */
export function SplitBar({ parts, height = 8, className }: { parts: { value: number; color: string; label?: string }[]; height?: number; className?: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  return (
    <div className={cn("flex w-full gap-[2px] overflow-hidden rounded-[3px]", className)} style={{ height }}>
      {parts.map((p, i) => (
        <div key={i} title={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
      ))}
    </div>
  );
}

/** Heat grid (Location × Model visibility). */
export function HeatCell({ value, max = 100 }: { value: number; max?: number }) {
  const t = value / max;
  return (
    <span
      className="inline-grid h-8 w-full place-items-center rounded-md t-num-sm-medium"
      style={{
        background: `color-mix(in oklab, var(--blue-500) ${Math.round(t * 85)}%, var(--bg-canvas))`,
        color: t > 0.5 ? "#fff" : "var(--text-primary)",
      }}
    >
      {value}%
    </span>
  );
}
