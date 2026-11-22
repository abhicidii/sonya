import { useState, type ReactNode } from "react";
import { CalendarBlank, Cpu, Funnel, GlobeHemisphereWest, Hash, Tag } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { BrandMark, ModelMark, Select, type ModelId } from "@/components/ui";
import { brands, locations, topics } from "@/data/mock";

export interface Filters {
  brand: string;
  range: string;
  granularity: string;
  branded: string;
  model: "all" | ModelId;
  topic: string;
  location: string;
}

export const defaultFilters: Filters = {
  brand: "lumen",
  range: "7d",
  granularity: "daily",
  branded: "all",
  model: "all",
  topic: "all",
  location: "all",
};

export function useFilters(initial: Partial<Filters> = {}) {
  return useState<Filters>({ ...defaultFilters, ...initial });
}

type Key = keyof Filters;

/**
 * Filter bar used across Analytics pages: brand · range · granularity on the left,
 * branded/model/topic/location on the right. Pass `show` to pick which filters render.
 */
export function FilterBar({
  value,
  onChange,
  show = ["brand", "range", "granularity", "branded", "model", "topic", "location"],
  className,
  trailing,
}: {
  value: Filters;
  onChange: (f: Filters) => void;
  show?: Key[];
  className?: string;
  trailing?: ReactNode;
}) {
  const set = <K extends Key>(k: K) => (v: Filters[K]) => onChange({ ...value, [k]: v });
  const has = (k: Key) => show.includes(k);
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {has("brand") && (
        <Select
          label="Brand"
          value={value.brand}
          onChange={set("brand")}
          options={brands.map((b) => ({ value: b.id, label: b.name, icon: <BrandMark brand={b} size={16} />, description: b.domain }))}
        />
      )}
      {has("range") && (
        <Select
          label="Date range"
          icon={<CalendarBlank />}
          value={value.range}
          onChange={set("range")}
          options={[
            { value: "24h", label: "Last 24 hours" },
            { value: "7d", label: "Last 7 days" },
            { value: "30d", label: "Last 30 days" },
            { value: "90d", label: "Last 90 days" },
            { value: "ytd", label: "Year to date" },
          ]}
        />
      )}
      {has("granularity") && (
        <Select
          label="Granularity"
          value={value.granularity}
          onChange={set("granularity")}
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
          ]}
        />
      )}
      <div className="flex-1" />
      {has("branded") && (
        <Select
          label="Branded"
          icon={<Tag />}
          value={value.branded}
          onChange={set("branded")}
          options={[
            { value: "all", label: "Branded & Unbranded" },
            { value: "branded", label: "Branded only" },
            { value: "unbranded", label: "Unbranded only" },
          ]}
        />
      )}
      {has("model") && (
        <Select
          label="Model"
          icon={value.model === "all" ? <Cpu /> : undefined}
          value={value.model}
          onChange={set("model")}
          options={[
            { value: "all", label: "All models" },
            ...(["chatgpt", "perplexity", "aio", "gemini", "claude", "copilot"] as ModelId[]).map((m) => ({
              value: m,
              label: { chatgpt: "ChatGPT", perplexity: "Perplexity", aio: "AI Overviews", gemini: "Gemini", claude: "Claude", copilot: "Copilot", grok: "Grok" }[m],
              icon: <ModelMark id={m} size={16} />,
            })),
          ]}
        />
      )}
      {has("topic") && (
        <Select
          label="Topic"
          icon={<Hash />}
          value={value.topic}
          onChange={set("topic")}
          align="end"
          options={[{ value: "all", label: "All topics" }, ...topics.map((t) => ({ value: t.id, label: t.name }))]}
        />
      )}
      {has("location") && (
        <Select
          label="Location"
          icon={<GlobeHemisphereWest />}
          value={value.location}
          onChange={set("location")}
          align="end"
          options={[{ value: "all", label: "All locations" }, ...locations.map((l) => ({ value: l.code, label: `${l.flag}  ${l.name}` }))]}
        />
      )}
      {trailing}
    </div>
  );
}

export function FilterIcon() {
  return <Funnel className="size-4" />;
}
