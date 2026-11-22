import { useEffect, useState } from "react";
import { GlobeHemisphereWest, MapPin, Plus, Sparkle } from "@phosphor-icons/react";
import {
  Badge,
  BrandMark,
  Card,
  CardFooter,
  CardHeader,
  CardPanel,
  CountChip,
  DeltaPill,
  DeltaText,
  MenuItem,
  MenuLabel,
  ModelMark,
  MODELS,
  Popover,
  Skeleton,
  StatusPill,
  Table,
  Td,
  Th,
  THead,
  TickMeter,
  Tr,
  useToast,
  type ModelId,
} from "@/components/ui";
import { HeatCell } from "@/components/charts";
import { PageSection } from "@/components/shell/PageHeader";
import type { Filters } from "@/components/shell/FilterBar";
import { brands, locations, models } from "@/data/mock";
import { cn, fmt } from "@/lib/cn";
import { rand, selectedBrand, sortHeader, type SortDir } from "./_shared";

type Loc = (typeof locations)[number] & { pending?: boolean };
type SortKey = "visibility" | "delta" | "prompts" | "position";

const AVAILABLE = [
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
];

const GRID_MODELS: ModelId[] = models.map((m) => m.id);

/** Visibility for a location on one model, derived from both averages. */
function cell(loc: Loc, model: ModelId) {
  const m = models.find((x) => x.id === model)!;
  const v = loc.visibility * (m.visibility / 41.8) * (0.85 + rand(`${loc.code}-${model}`) * 0.3);
  return Math.max(0, Math.min(99, Math.round(v)));
}

export default function LocationTab({ filters }: { filters: Filters }) {
  const toast = useToast();
  const brand = selectedBrand(filters);
  const brandScale = brand.visibility / 41.8;
  const [extra, setExtra] = useState<Loc[]>([]);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "visibility", dir: "desc" });
  const [focus, setFocus] = useState<string>(filters.location === "all" ? "US" : filters.location);
  const th = sortHeader(sort, setSort);
  useEffect(() => {
    if (filters.location !== "all") setFocus(filters.location);
  }, [filters.location]);

  const all: Loc[] = [...locations.map((l) => ({ ...l, visibility: Math.round(l.visibility * brandScale) })), ...extra];
  const rows = [...all].sort((a, b) => {
    if (a.pending !== b.pending) return a.pending ? 1 : -1;
    const d = a[sort.key] - b[sort.key];
    return sort.dir === "desc" ? -d : d;
  });
  const active = all.find((l) => l.code === focus && !l.pending) ?? all[0];
  const remaining = AVAILABLE.filter((a) => !extra.some((e) => e.code === a.code));
  const leader = [...all].filter((l) => !l.pending).sort((a, b) => b.visibility - a.visibility)[0];
  const best = all
    .filter((l) => !l.pending)
    .flatMap((l) => GRID_MODELS.map((m) => ({ loc: l, model: m, v: cell(l, m) })))
    .sort((a, b) => b.v - a.v)[0];

  const addLocation = (a: (typeof AVAILABLE)[number]) => {
    setExtra((e) => [...e, { ...a, visibility: 0, delta: 0, prompts: 22, position: 0, pending: true }]);
    toast({ title: `${a.flag}  ${a.name} added`, description: "We’ll run your 22 prompts from this location. First results in about 24 hours." });
  };

  return (
    <>
      <PageSection className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,9fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader
            title={
              <>
                Countries <CountChip>{all.length}</CountChip>
              </>
            }
            description="Visibility when prompts run from each location · click a row to inspect"
            actions={<AddLocation remaining={remaining} onAdd={addLocation} />}
          />
          <CardPanel flush className="p-2">
            <Table className="min-w-[620px]">
              <THead>
                <tr>
                  <Th>Location</Th>
                  <Th {...th("visibility")}>Visibility</Th>
                  <Th align="right" {...th("delta")}>
                    Change
                  </Th>
                  <Th align="right" {...th("prompts")}>
                    Prompts
                  </Th>
                  <Th align="right" {...th("position")}>
                    Avg. pos.
                  </Th>
                </tr>
              </THead>
              <tbody>
                {rows.map((l) => (
                  <Tr key={l.code} interactive={!l.pending} selected={l.code === active.code} onClick={() => !l.pending && setFocus(l.code)}>
                    <Td>
                      <span className="flex items-center gap-2.5">
                        <span className="text-[18px] leading-none">{l.flag}</span>
                        <span className="t-body-medium">{l.name}</span>
                        <span className="t-caption text-ink-3">{l.code}</span>
                        {l.pending && <Badge tone="blue">Collecting</Badge>}
                      </span>
                    </Td>
                    <Td>
                      {l.pending ? (
                        <Skeleton className="h-2 w-32" />
                      ) : (
                        <span className="flex items-center gap-3">
                          <TickMeter value={l.visibility} max={60} className="w-24" />
                          <span className="t-num">{l.visibility}%</span>
                        </span>
                      )}
                    </Td>
                    <Td align="right">
                      {l.pending ? <span className="t-num-sm text-ink-3">—</span> : <DeltaText value={fmt.signed(l.delta) + " pts"} good={l.delta >= 0} />}
                    </Td>
                    <Td align="right" className="t-num text-ink-2">
                      {l.prompts}
                    </Td>
                    <Td align="right" className="t-num text-ink-2">
                      {l.pending ? "—" : `#${l.position.toFixed(1)}`}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </CardPanel>
        </Card>

        <Card className="self-start">
          <CardHeader
            icon={<span className="text-[18px] leading-none">{active.flag}</span>}
            title={active.name}
            description={`${active.prompts} prompts · ${models.length} models`}
            actions={active.code === leader.code ? <StatusPill tone="success">Top market</StatusPill> : undefined}
          />
          <CardPanel className="flex flex-col gap-4">
            <div className="flex items-baseline gap-2">
              <span className="t-num-lg text-ink">{active.visibility}%</span>
              <span className="t-caption text-ink-2">visibility</span>
              <span className="flex-1" />
              <DeltaPill value={fmt.signed(active.delta) + " pts"} direction={active.delta >= 0 ? "up" : "down"} size="xs" />
            </div>
            <div className="flex flex-col gap-2.5">
              {GRID_MODELS.map((m) => {
                const v = cell(active, m);
                return (
                  <div key={m} className={cn("flex items-center gap-2.5", filters.model !== "all" && filters.model !== m && "opacity-40")}>
                    <ModelMark id={m} size={18} className="rounded-full" />
                    <span className="w-24 truncate t-caption text-ink-2">{MODELS[m].name}</span>
                    <TickMeter value={v} max={80} color={MODELS[m].color} className="flex-1" />
                    <span className="w-9 text-right t-num-sm-medium text-ink">{v}%</span>
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl bg-canvas p-3">
              <div className="mb-2 t-caption-medium text-ink-2">Local leaders</div>
              {brands.slice(0, 3).map((b, i) => {
                const v = Math.round(b.visibility * (active.visibility / 44) * (0.9 + rand(`${active.code}-${b.id}`) * 0.2));
                return (
                  <div key={b.id} className="flex items-center gap-2 py-1">
                    <span className="w-3 t-num-sm text-ink-3">{i + 1}</span>
                    <BrandMark brand={b} size={16} />
                    <span className="flex-1 t-caption text-ink">{b.name}</span>
                    <span className="t-num-sm-medium text-ink">{v}%</span>
                  </div>
                );
              })}
            </div>
          </CardPanel>
        </Card>
      </PageSection>

      <PageSection>
        <Card>
          <CardHeader
            icon={<GlobeHemisphereWest weight="fill" />}
            tile="blue"
            title="Model × country"
            description="Visibility for each AI model in each market"
            meta={
              <span className="hidden items-center gap-2 sm:flex">
                <span>0%</span>
                <span className="h-2 w-20 rounded-full bg-[linear-gradient(90deg,var(--bg-canvas),var(--blue-500))] shadow-control-soft" />
                <span>80%+</span>
              </span>
            }
          />
          <CardPanel className="overflow-x-auto">
            <div className="grid min-w-[720px] gap-1.5" style={{ gridTemplateColumns: `minmax(150px,1.4fr) repeat(${GRID_MODELS.length}, minmax(72px,1fr))` }}>
              <span />
              {GRID_MODELS.map((m) => (
                <div
                  key={m}
                  className={cn(
                    "flex items-center justify-center gap-1.5 pb-1 t-caption-medium text-ink-2",
                    filters.model !== "all" && filters.model !== m && "opacity-40",
                  )}
                >
                  <ModelMark id={m} size={16} className="rounded-full" />
                  <span className="truncate">{MODELS[m].name}</span>
                </div>
              ))}
              {rows.map((l) => (
                <Row key={l.code} loc={l} active={l.code === active.code} filterModel={filters.model} onFocus={() => !l.pending && setFocus(l.code)} />
              ))}
              {remaining.length > 0 && (
                <div className="col-span-full mt-1 [&>div]:flex [&>div]:w-full">
                  <AddLocation
                    remaining={remaining}
                    onAdd={addLocation}
                    trigger={(toggle) => (
                      <button
                        type="button"
                        onClick={toggle}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong t-caption-medium text-ink-2 transition-colors hover:border-line-brand hover:bg-brand-subtle hover:text-ink"
                      >
                        <Plus weight="bold" className="size-3.5" />
                        Add location
                        <span className="text-ink-3">· {remaining.length} available</span>
                      </button>
                    )}
                  />
                </div>
              )}
            </div>
          </CardPanel>
          <CardFooter>
            <span className="flex items-center gap-1.5 t-caption text-ink-2">
              <Sparkle weight="fill" className="size-3.5 text-brand" />
              {MODELS[best.model].name} in {best.loc.name} gives you the strongest coverage · {best.v}%
            </span>
            <span className="t-caption text-ink-3">Updated daily</span>
          </CardFooter>
        </Card>
      </PageSection>
    </>
  );
}

function Row({ loc, active, filterModel, onFocus }: { loc: Loc; active: boolean; filterModel: Filters["model"]; onFocus: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onFocus}
        className={cn("flex h-8 items-center gap-2 rounded-md px-2 text-left transition-colors", active ? "bg-brand-subtle" : "hover:bg-canvas")}
      >
        <span className="text-[16px] leading-none">{loc.flag}</span>
        <span className="truncate t-caption-medium text-ink">{loc.name}</span>
      </button>
      {GRID_MODELS.map((m) => (
        <span key={m} className={cn("transition-opacity", filterModel !== "all" && filterModel !== m && "opacity-30")}>
          {loc.pending ? <Skeleton className="h-8 w-full" /> : <HeatCell value={cell(loc, m)} max={80} />}
        </span>
      ))}
    </>
  );
}

function AddLocation({
  remaining,
  onAdd,
  trigger,
}: {
  remaining: typeof AVAILABLE;
  onAdd: (a: (typeof AVAILABLE)[number]) => void;
  trigger?: (toggle: () => void) => JSX.Element;
}) {
  if (remaining.length === 0) return null;
  return (
    <Popover
      align={trigger ? "start" : "end"}
      trigger={({ toggle }) =>
        trigger ? (
          trigger(toggle)
        ) : (
          <button
            type="button"
            onClick={toggle}
            className="inline-flex h-7 items-center gap-1 rounded-md bg-surface px-2.5 t-caption-medium text-ink-2 shadow-control-soft transition-colors hover:bg-canvas hover:text-ink"
          >
            <Plus weight="bold" className="size-3" />
            Add location
          </button>
        )
      }
    >
      {(close) => (
        <>
          <MenuLabel>Add a market to track</MenuLabel>
          {remaining.map((a) => (
            <MenuItem
              key={a.code}
              icon={<MapPin />}
              description={`${a.code} · runs all prompts locally`}
              onClick={() => {
                onAdd(a);
                close();
              }}
            >
              {a.flag}&nbsp;&nbsp;{a.name}
            </MenuItem>
          ))}
        </>
      )}
    </Popover>
  );
}
