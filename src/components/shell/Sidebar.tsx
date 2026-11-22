import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChatCircle, ClockCounterClockwise, Sidebar as SidebarIcon, MagnifyingGlass } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { Badge, Kbd, Progress, Segmented } from "@/components/ui";
import { agentChats } from "@/data/mock";
import { agentNav, dashboardNav, footerNav, kitNav, type NavItemDef } from "./nav";
import { useShell } from "./ShellContext";

/**
 * Sidebar — 240px (minimized 64px rail). bg-canvas, radius 16, padding 12.
 * Dashboard/Agent switch at the top (Searchable flow), grouped nav, setup card and footer links.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { minimized, setMinimized, openCommand, openLearn } = useShell();
  const loc = useLocation();
  const nav = useNavigate();
  const mode = loc.pathname.startsWith("/agent") ? "agent" : "dashboard";

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col rounded-2xl bg-canvas transition-[width] duration-200 ease-out",
        minimized ? "w-16 items-center px-2 py-3" : "w-60 p-3",
      )}
    >
      {/* Search + collapse */}
      <div className={cn("flex items-center gap-1.5", minimized && "flex-col")}>
        {minimized ? (
          <>
            <RailButton label="Expand sidebar" onClick={() => setMinimized(false)}>
              <SidebarIcon weight="duotone" />
            </RailButton>
            <RailButton label="Search" onClick={openCommand}>
              <MagnifyingGlass weight="duotone" />
            </RailButton>
          </>
        ) : (
          <>
            <button
              onClick={openCommand}
              className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg bg-surface px-2.5 text-ink-3 shadow-control-soft transition-colors hover:text-ink-2"
            >
              <MagnifyingGlass className="size-4" />
              <span className="flex-1 truncate text-left t-body">Search…</span>
              <Kbd>⌘K</Kbd>
            </button>
            <button
              aria-label="Minimize sidebar"
              title="Minimize sidebar"
              onClick={() => setMinimized(true)}
              className="hidden size-8 place-items-center rounded-lg text-icon-subtle transition-colors hover:bg-subtle hover:text-ink lg:grid"
            >
              <SidebarIcon weight="duotone" className="size-4" />
            </button>
          </>
        )}
      </div>

      {!minimized && (
        <Segmented
          className="mt-3"
          stretch
          size="xs"
          value={mode}
          onChange={(v) => {
            nav(v === "agent" ? "/agent" : "/insights/visibility");
            onNavigate?.();
          }}
          options={[
            { value: "dashboard", label: "Dashboard" },
            { value: "agent", label: "Agent" },
          ]}
        />
      )}

      <nav className={cn("mt-2 flex min-h-0 w-full flex-1 flex-col overflow-y-auto", minimized ? "items-center" : "-mx-1 px-1")}>
        {mode === "dashboard" ? (
          dashboardNav.map((g) => (
            <div key={g.label} className="flex w-full flex-col">
              {minimized ? <span className="mx-auto my-2 h-px w-5 bg-line" /> : <div className="px-2 pb-1.5 pt-4 t-caption text-ink-3">{g.label}</div>}
              <div className={cn("flex flex-col gap-0.5", minimized && "items-center")}>
                {g.items.map((it) => (
                  <NavItem key={it.to} item={it} minimized={minimized} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex w-full flex-col">
            <div className={cn("mt-2 flex flex-col gap-0.5", minimized && "items-center")}>
              {agentNav.map((it) => (
                <NavItem key={it.to} item={it} minimized={minimized} onNavigate={onNavigate} end />
              ))}
            </div>
            {!minimized && (
              <>
                <div className="flex items-center gap-1.5 px-2 pb-1.5 pt-5 t-caption text-ink-3">
                  <ClockCounterClockwise className="size-3.5" /> Recents
                </div>
                <div className="flex flex-col gap-0.5">
                  {agentChats.map((c) => (
                    <NavLink
                      key={c.id}
                      to={`/agent/c/${c.id}`}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "flex h-8 items-center gap-2 rounded-lg px-2 t-body transition-colors",
                          isActive ? "bg-surface text-ink shadow-nav-active" : "text-ink-2 hover:bg-subtle hover:text-ink",
                        )
                      }
                    >
                      <ChatCircle className="size-3.5 shrink-0 text-icon-muted" />
                      <span className="truncate">{c.title}</span>
                    </NavLink>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Setup progress card (opens Learn → Get started) */}
      {!minimized && mode === "dashboard" && (
        <button
          onClick={() => openLearn("start")}
          className="mb-2 mt-3 w-full rounded-xl bg-surface p-3 text-left shadow-card transition-shadow hover:shadow-control"
        >
          <div className="flex items-center justify-between t-caption-medium text-ink">
            Get set up <span className="t-num-sm text-ink-3">3/5</span>
          </div>
          <Progress value={3} max={5} tone="blue" className="mt-2" />
          <p className="mt-2 t-caption text-ink-2">Connect Search Console and invite your team.</p>
        </button>
      )}

      <div className={cn("flex w-full flex-col gap-0.5 pt-1", minimized && "items-center")}>
        <NavItem item={kitNav} minimized={minimized} onNavigate={onNavigate} />
        {footerNav.map((it) => (
          <NavItem key={it.to} item={it} minimized={minimized} onNavigate={onNavigate} />
        ))}
      </div>
    </aside>
  );
}

function NavItem({ item, minimized, onNavigate, end }: { item: NavItemDef; minimized: boolean; onNavigate?: () => void; end?: boolean }) {
  const loc = useLocation();
  const active = end ? loc.pathname === item.to : loc.pathname === item.to || loc.pathname.startsWith((item.match ?? item.to) + "/") || (item.match ? loc.pathname.startsWith(item.match) : false);
  // Exact match wins for nested siblings (/prompts vs /prompts/research)
  const exactSibling = item.to === "/prompts" && loc.pathname.startsWith("/prompts/research");
  const isActive = active && !exactSibling;

  if (minimized) {
    return (
      <NavLink
        to={item.to}
        onClick={onNavigate}
        title={item.label}
        aria-label={item.label}
        className={cn(
          "relative grid size-8 place-items-center rounded-lg transition-colors [&_svg]:size-4",
          isActive ? "bg-surface text-icon-strong shadow-nav-active" : "text-icon hover:bg-subtle hover:text-ink",
        )}
      >
        {item.icon}
        {item.count ? <span className="absolute right-1 top-1 size-1.5 rounded-full dot-warning" /> : null}
      </NavLink>
    );
  }

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "group flex h-8 items-center gap-2 rounded-lg px-2 t-label transition-[background-color,color,box-shadow] duration-150 [&>svg]:size-4",
        isActive ? "bg-surface text-ink shadow-nav-active" : "text-ink-2 hover:bg-subtle hover:text-ink",
      )}
    >
      <span className={cn("[&_svg]:size-4", isActive ? "text-icon-strong" : "text-icon")}>{item.icon}</span>
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && <Badge tone={item.badge.tone ?? "neutral"}>{item.badge.label}</Badge>}
      {item.count !== undefined && <span className="rounded bg-surface px-1.5 t-num-sm text-ink-2 shadow-control-soft">{item.count}</span>}
    </NavLink>
  );
}

function RailButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className="grid size-8 place-items-center rounded-lg text-icon transition-colors hover:bg-subtle hover:text-ink [&_svg]:size-4">
      {children}
    </button>
  );
}
