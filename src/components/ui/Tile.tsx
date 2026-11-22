import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TileColor = "blue" | "orange" | "green" | "pink" | "purple" | "ink";

const sizes = {
  xs: "size-4 rounded-[4px] [&_svg]:size-2.5",
  sm: "size-5 rounded-[6px] [&_svg]:size-3",
  md: "size-6 rounded-[7px] [&_svg]:size-3.5",
  lg: "size-8 rounded-[9px] [&_svg]:size-[18px]",
  xl: "size-10 rounded-[10px] [&_svg]:size-5",
};

/** Coloured icon tile (Effects → Tile). Glyph is white. */
export function Tile({
  color = "blue",
  size = "md",
  children,
  className,
}: {
  color?: TileColor;
  size?: keyof typeof sizes;
  children?: ReactNode;
  className?: string;
}) {
  return <span className={cn("tile", `tile-${color}`, sizes[size], className)}>{children}</span>;
}

/** Site/brand marker — tile with 1–4 dots (Navigation → Site marker). */
export function DotMarker({ color = "blue", dots = 1, size = "sm" }: { color?: TileColor; dots?: 1 | 2 | 3 | 4; size?: "xs" | "sm" | "md" }) {
  const pos: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[35, 35], [65, 65]],
    3: [[50, 32], [33, 66], [67, 66]],
    4: [[34, 34], [66, 34], [34, 66], [66, 66]],
  };
  return (
    <Tile color={color} size={size}>
      <svg viewBox="0 0 100 100" className="!size-full">
        {pos[dots].map(([x, y], i) => (
          <rect key={i} x={x - 10} y={y - 10} width="20" height="20" rx="6" fill="white" />
        ))}
      </svg>
    </Tile>
  );
}
