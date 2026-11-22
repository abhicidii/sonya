import type { ReactNode } from "react";
import {
  Atom,
  BookOpen,
  ChartLineUp,
  ChatCircleText,
  FileText,
  GearSix,
  Heartbeat,
  Lightbulb,
  Lightning,
  MagnifyingGlass,
  NotePencil,
  Path,
  PencilLine,
  SquaresFour,
  UserPlus,
  WarningCircle,
} from "@phosphor-icons/react";

export interface NavItemDef {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: { label: string; tone?: "blue" | "green" | "neutral" | "inverse" };
  count?: number;
  match?: string;
}

export interface NavGroupDef {
  label: string;
  items: NavItemDef[];
}

const i = (C: typeof SquaresFour) => <C weight="duotone" />;

export const dashboardNav: NavGroupDef[] = [
  {
    label: "Analytics",
    items: [
      { to: "/insights/visibility", match: "/insights", label: "AEO Insights", icon: i(ChartLineUp) },
      { to: "/llm", label: "LLM Analytics", icon: i(Atom) },
      { to: "/traffic", label: "Traffic", icon: i(Path) },
      { to: "/reports", label: "Reports", icon: i(FileText), badge: { label: "Beta", tone: "green" } },
    ],
  },
  {
    label: "Prompts",
    items: [
      { to: "/prompts", label: "Your Prompts", icon: i(ChatCircleText) },
      { to: "/prompts/research", label: "Prompt Research", icon: i(MagnifyingGlass) },
    ],
  },
  {
    label: "Actions",
    items: [
      { to: "/content", label: "Content", icon: i(PencilLine) },
      { to: "/opportunities", label: "Opportunities", icon: i(Lightbulb), count: 5 },
    ],
  },
  {
    label: "On page",
    items: [
      { to: "/site-health", label: "Site Health", icon: i(Heartbeat) },
      { to: "/issues", label: "Issues", icon: i(WarningCircle), count: 6 },
    ],
  },
];

export const footerNav: NavItemDef[] = [
  { to: "/knowledge", label: "Knowledge Base", icon: i(BookOpen) },
  { to: "/settings/team", label: "Invite team", icon: i(UserPlus) },
  { to: "/settings/general", match: "/settings", label: "Settings", icon: i(GearSix) },
];

export const agentNav: NavItemDef[] = [
  { to: "/agent", label: "New chat", icon: i(NotePencil) },
  { to: "/agent/skills", label: "Skills", icon: i(Lightning), badge: { label: "New", tone: "blue" } },
];

export const kitNav: NavItemDef = { to: "/kit", label: "UI Kit", icon: i(SquaresFour) };
