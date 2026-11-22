import clsx, { type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about the kit's custom text-style and shadow utilities.
const twMerge = extendTailwindMerge<"text-style">({
  extend: {
    classGroups: {
      "text-style": [{ t: ["display", "title", "heading", "label", "body", "body-medium", "caption", "caption-medium", "micro", "num-xl", "num-lg", "num", "num-sm", "num-sm-medium", "wordmark"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmt = {
  int: (n: number) => n.toLocaleString("en-US"),
  pct: (n: number, digits = 1) => `${n.toFixed(digits)}%`,
  signedPct: (n: number, digits = 1) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(digits)}%`,
  signed: (n: number, digits = 1) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(digits)}`,
  compact: (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : `${n}`,
};
