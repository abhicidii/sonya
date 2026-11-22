import { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sun } from "@phosphor-icons/react";
import { Badge, Segmented } from "@/components/ui";
import { PageHeader } from "@/components/shell/PageHeader";
import { useTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/cn";
import { KIT_SECTIONS, type KitSectionId } from "./KitParts";
import { ColourSection, EffectsSection, LayoutSection, OverviewSection, TypographySection } from "./KitFoundations";
import { ActionsSection, InputsSection, NavigationSection } from "./KitComponents";
import { ChartsSection, DataSection, FeedbackSection, MarksSection } from "./KitData";

/**
 * /kit — the UI kit documentation a buyer browses. Mirrors the Figma Documentation frame:
 * foundations (colour, type, effects, layout) then components, charts and marks.
 */
export default function KitPage() {
  const { theme, setTheme } = useTheme();
  const [active, setActive] = useState<KitSectionId>("overview");
  const lockRef = useRef(0);
  const barRef = useRef<HTMLDivElement>(null);

  // Scroll-spy on the shell's scroll container.
  useEffect(() => {
    const root = document.getElementById("page-scroll");
    if (!root) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      if (Date.now() < lockRef.current) return;
      const top = root.getBoundingClientRect().top;
      const anchors = Array.from(root.querySelectorAll<HTMLElement>("[data-kit-anchor]"));
      let current = anchors[0]?.dataset.kitAnchor as KitSectionId | undefined;
      for (const a of anchors) if (a.getBoundingClientRect().top - top <= 140) current = a.dataset.kitAnchor as KitSectionId;
      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 4) current = anchors[anchors.length - 1]?.dataset.kitAnchor as KitSectionId;
      if (current) setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      root.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Keep the active pill visible in the mobile bar.
  useEffect(() => {
    const bar = barRef.current;
    const el = bar?.querySelector<HTMLElement>(`[data-nav="${active}"]`);
    if (!bar || !el) return;
    const left = el.offsetLeft - bar.clientWidth / 2 + el.clientWidth / 2;
    bar.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  const go = useCallback((id: KitSectionId) => {
    setActive(id);
    lockRef.current = Date.now() + 700; // don't let the spy flicker during smooth scroll
    document.getElementById(`kit-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>
      <PageHeader
        title="UI Kit"
        badge={<Badge tone="outline">v1.0</Badge>}
        actions={
          <>
            <span className="hidden t-caption text-ink-3 sm:inline">Theme</span>
            <Segmented<Theme>
              value={theme}
              onChange={setTheme}
              options={[
                { value: "light", label: "Light", icon: <Sun /> },
                { value: "dark", label: "Dark", icon: <Moon /> },
              ]}
            />
          </>
        }
      />

      {/* Mobile / tablet: horizontal sticky bar */}
      <div className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur lg:hidden">
        <div ref={barRef} className="flex gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
          {KIT_SECTIONS.map((s) => (
            <button
              key={s.id}
              data-nav={s.id}
              type="button"
              onClick={() => go(s.id)}
              aria-current={active === s.id ? "true" : undefined}
              className={cn(
                "h-7 shrink-0 rounded-full px-3 t-caption-medium transition-colors duration-150",
                active === s.id ? "bg-primary text-on-primary" : "text-ink-2 hover:bg-subtle hover:text-ink",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-1">
        {/* Desktop: sticky in-page nav */}
        <aside className="hidden w-56 shrink-0 border-r border-line lg:block">
          <nav className="sticky top-0 flex flex-col gap-0.5 p-3" aria-label="On this page">
            <div className="px-2 pb-2 pt-2 t-caption text-ink-3">On this page</div>
            {KIT_SECTIONS.map((s, i) => {
              const on = active === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(s.id)}
                  aria-current={on ? "true" : undefined}
                  className={cn(
                    "group flex h-8 items-center gap-2.5 rounded-lg px-2 text-left t-label transition-[background-color,color,box-shadow] duration-150",
                    on ? "bg-canvas text-ink shadow-nav-active" : "text-ink-2 hover:bg-subtle hover:text-ink",
                  )}
                >
                  <span className={cn("w-5 t-num-sm transition-colors", on ? "text-ink-2" : "text-ink-3")}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 truncate">{s.label}</span>
                </button>
              );
            })}
            <div className="mx-2 mt-4 rounded-xl bg-canvas p-3 shadow-card">
              <div className="t-caption-medium text-ink">Building with Sonya</div>
              <p className="mt-1 t-caption text-ink-2">Every block shows its component name. Click the copy icon to grab it.</p>
            </div>
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <OverviewSection />
          <ColourSection theme={theme} />
          <TypographySection />
          <EffectsSection />
          <LayoutSection />
          <ActionsSection />
          <InputsSection />
          <NavigationSection />
          <DataSection />
          <FeedbackSection />
          <ChartsSection />
          <MarksSection />
        </div>
      </div>
    </>
  );
}
