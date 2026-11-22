import { BookOpen, BracketsCurly, Browser, Question, Scales } from "@phosphor-icons/react";
import { Badge, StatusPill, type BadgeTone, type StatusTone, type TileColor } from "@/components/ui";
import { contentItems } from "@/data/mock";

export type ContentItem = (typeof contentItems)[number];
export type ContentStatus = "Brief" | "Draft" | "In review" | "Published";
export const contentStatuses: ContentStatus[] = ["Brief", "Draft", "In review", "Published"];

const statusTone: Record<ContentStatus, StatusTone> = {
  Brief: "neutral",
  Draft: "warning",
  "In review": "info",
  Published: "success",
};

export function ContentStatusPill({ status }: { status: ContentStatus }) {
  return <StatusPill tone={statusTone[status]}>{status}</StatusPill>;
}

export const contentTypes: { id: string; label: string; description: string; icon: JSX.Element; tile: TileColor; badge: BadgeTone }[] = [
  { id: "Comparison", label: "Comparison", description: "You vs a competitor, with a verdict table", icon: <Scales weight="fill" />, tile: "orange", badge: "orange" },
  { id: "Guide", label: "Guide", description: "How-to with a direct answer up top", icon: <BookOpen weight="fill" />, tile: "blue", badge: "blue" },
  { id: "Docs", label: "Docs", description: "Reference page engines can quote", icon: <BracketsCurly weight="fill" />, tile: "purple", badge: "purple" },
  { id: "Landing page", label: "Landing page", description: "Use-case page with proof and FAQs", icon: <Browser weight="fill" />, tile: "green", badge: "green" },
  { id: "FAQ", label: "FAQ", description: "Question-led page with FAQPage schema", icon: <Question weight="fill" />, tile: "pink", badge: "pink" },
];

export function TypeBadge({ type }: { type: string }) {
  const t = contentTypes.find((c) => c.id === type);
  return <Badge tone={t?.badge ?? "neutral"}>{type}</Badge>;
}
