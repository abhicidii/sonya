import { cn } from "@/lib/cn";

/**
 * Generic marks for AI engines and (fictional) brands.
 * These are neutral glyphs, not the vendors' trademarks — swap in real logos in your product.
 */
export type ModelId = "chatgpt" | "perplexity" | "gemini" | "claude" | "aio" | "copilot" | "grok";

export const MODELS: Record<ModelId, { name: string; color: string; short: string }> = {
  chatgpt: { name: "ChatGPT", color: "#10a37f", short: "GP" },
  perplexity: { name: "Perplexity", color: "#1f8a8a", short: "PX" },
  gemini: { name: "Gemini", color: "#4f7cff", short: "GM" },
  claude: { name: "Claude", color: "#d97757", short: "CL" },
  aio: { name: "AI Overviews", color: "#ea4335", short: "AO" },
  copilot: { name: "Copilot", color: "#0a84d6", short: "CP" },
  grok: { name: "Grok", color: "#3a3a3a", short: "GK" },
};

const glyphs: Record<ModelId, JSX.Element> = {
  chatgpt: <path d="M8 2.5a3 3 0 0 1 2.9 2.2 3 3 0 0 1 2.2 4.1 3 3 0 0 1-2.3 4.6 3 3 0 0 1-5.2.6 3 3 0 0 1-3-4.2 3 3 0 0 1 2.4-4.9A3 3 0 0 1 8 2.5Z" fill="none" stroke="#fff" strokeWidth="1.4" />,
  perplexity: <path d="M8 2v12M3.5 5.5 8 8l4.5-2.5M3.5 5.5v5L8 8m4.5-2.5v5L8 8M5 3l3 2.5L11 3" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" />,
  gemini: <path d="M8 2c.4 3.2 2.8 5.6 6 6-3.2.4-5.6 2.8-6 6-.4-3.2-2.8-5.6-6-6 3.2-.4 5.6-2.8 6-6Z" fill="#fff" />,
  claude: <path d="M8 2.5v11M2.5 8h11M4.1 4.1l7.8 7.8M11.9 4.1 4.1 11.9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />,
  aio: <path d="M8 3a5 5 0 1 0 4.8 6.3H8.2V7.4h6.6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />,
  copilot: <path d="M4 11.5c-1.4 0-2-1-1.5-2.4L4 4.5h5l-1.6 5c-.4 1.2-1.4 2-2.6 2H4Zm8-7c1.4 0 2 1 1.5 2.4L12 11.5H7l1.6-5c.4-1.2 1.4-2 2.6-2h.8Z" fill="#fff" />,
  grok: <path d="M3.5 12.5 12.5 3.5M6 3.5h6.5V10" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />,
};

export function ModelMark({ id, size = 20, className }: { id: ModelId; size?: number; className?: string }) {
  const m = MODELS[id];
  return (
    <span
      title={m.name}
      className={cn("inline-grid shrink-0 place-items-center shadow-[inset_0_-1px_0_rgb(0_0_0/0.12),0_0_0_1px_rgb(0_0_0/0.04)]", className)}
      style={{ width: size, height: size, borderRadius: size * 0.3, background: m.color }}
    >
      <svg viewBox="0 0 16 16" width={size * 0.66} height={size * 0.66}>
        {glyphs[id]}
      </svg>
    </span>
  );
}

export interface BrandDef {
  id: string;
  name: string;
  domain: string;
  color: string;
  shape: "circle" | "square" | "diamond" | "bolt" | "ring" | "stack" | "wave" | "triangle";
}

const shapes: Record<BrandDef["shape"], JSX.Element> = {
  circle: <circle cx="8" cy="8" r="3.6" fill="#fff" />,
  square: <rect x="4.5" y="4.5" width="7" height="7" rx="1.8" fill="#fff" />,
  diamond: <path d="M8 3.5 12.5 8 8 12.5 3.5 8Z" fill="#fff" />,
  bolt: <path d="M9 2.8 4.5 9h3l-.5 4.2L11.5 7h-3Z" fill="#fff" />,
  ring: <circle cx="8" cy="8" r="3.6" fill="none" stroke="#fff" strokeWidth="2" />,
  stack: <path d="M4 6h8M4 8.5h8M4 11h5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />,
  wave: <path d="M3 9c1.2-2 2.3-2 3.5 0s2.3 2 3.5 0 2.3-2 3 0" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />,
  triangle: <path d="M8 4 12.5 12h-9Z" fill="#fff" />,
};

export function BrandMark({ brand, size = 20, className }: { brand: BrandDef; size?: number; className?: string }) {
  return (
    <span
      title={brand.name}
      className={cn("inline-grid shrink-0 place-items-center shadow-[inset_0_-1px_0_rgb(0_0_0/0.14),0_0_0_1px_var(--ring-1)]", className)}
      style={{ width: size, height: size, borderRadius: size * 0.28, background: brand.color }}
    >
      <svg viewBox="0 0 16 16" width={size * 0.75} height={size * 0.75}>
        {shapes[brand.shape]}
      </svg>
    </span>
  );
}

/** Domain favicon placeholder for sources (reddit.com, g2.com …). */
export function DomainMark({ domain, size = 18 }: { domain: string; size?: number }) {
  const palette = ["#ff4500", "#0a66c2", "#ff0033", "#16b364", "#7b42ff", "#141414", "#ff8000", "#2e90fa", "#e708a4"];
  const c = palette[[...domain].reduce((a, ch) => a + ch.charCodeAt(0), 0) % palette.length];
  return (
    <span
      className="inline-grid shrink-0 place-items-center font-semibold text-white"
      style={{ width: size, height: size, borderRadius: size * 0.28, background: c, fontSize: size * 0.5 }}
    >
      {domain[0].toUpperCase()}
    </span>
  );
}

/** Sonya logo tile + wordmark. */
export function SonyaLogo({ size = 28, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="tile tile-ink" style={{ width: size, height: size, borderRadius: size * 0.28 }}>
        <svg viewBox="0 0 32 32" width={size * 0.72} height={size * 0.72}>
          <path d="M10 20.5c1.4 1.3 3.5 2 6 2 3.3 0 5.5-1.5 5.5-3.8 0-2.2-1.7-3.1-5-3.7-2.6-.5-3.6-1-3.6-2 0-1 1-1.7 2.8-1.7 1.6 0 3 .5 4 1.4" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="23.5" cy="8.5" r="2" fill="#ffa100" />
        </svg>
      </span>
      {wordmark && <span className="t-wordmark text-ink">Sonya</span>}
    </span>
  );
}
