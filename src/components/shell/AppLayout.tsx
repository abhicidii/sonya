import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/cn";
import { AppHeader } from "./AppHeader";
import { CommandPalette } from "./CommandPalette";
import { LearnModal } from "./LearnModal";
import { ShellContext } from "./ShellContext";
import { Sidebar } from "./Sidebar";

/**
 * App frame — 12px outer gutter, 32px app header, 12px gap,
 * sidebar (240 / 64) + 8px gap + elevated main panel (radius 16, Elevation/Panel).
 * Below lg the sidebar becomes a drawer.
 */
export function AppLayout() {
  const [minimized, setMinimized] = useState(false);
  const [cmd, setCmd] = useState(false);
  const [learn, setLearn] = useState<{ open: boolean; tab: "start" | "videos" }>({ open: false, tab: "start" });
  const [drawer, setDrawer] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setDrawer(false), [loc.pathname]);

  const openLearn = useCallback((tab: "start" | "videos" = "start") => setLearn({ open: true, tab }), []);
  const api = useMemo(() => ({ openLearn, openCommand: () => setCmd(true), minimized, setMinimized }), [openLearn, minimized]);

  return (
    <ShellContext.Provider value={api}>
      <div className="flex h-dvh flex-col gap-3 bg-frame p-2 sm:p-3">
        <AppHeader onMenu={() => setDrawer(true)} />
        <div className="flex min-h-0 flex-1 gap-2">
          <div className="hidden lg:block">
            <Sidebar />
          </div>
          <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-surface shadow-panel">
            <div id="page-scroll" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <Suspense fallback={<div className="flex-1" />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-40 lg:hidden", drawer ? "pointer-events-auto" : "pointer-events-none")}>
        <div className={cn("absolute inset-0 bg-scrim transition-opacity duration-200", drawer ? "opacity-100" : "opacity-0")} onClick={() => setDrawer(false)} />
        <div className={cn("absolute inset-y-2 left-2 transition-transform duration-300 ease-out", drawer ? "translate-x-0" : "-translate-x-[110%]")}>
          <div className="h-full shadow-popover rounded-2xl">
            <ShellContext.Provider value={{ ...api, minimized: false }}>
              <Sidebar onNavigate={() => setDrawer(false)} />
            </ShellContext.Provider>
          </div>
        </div>
      </div>

      <CommandPalette open={cmd} onClose={() => setCmd(false)} />
      <LearnModal open={learn.open} tab={learn.tab} setTab={(t) => setLearn({ open: true, tab: t })} onClose={() => setLearn((l) => ({ ...l, open: false }))} />
    </ShellContext.Provider>
  );
}
