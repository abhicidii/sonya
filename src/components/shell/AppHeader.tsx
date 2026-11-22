import { useNavigate } from "react-router-dom";
import { Bell, CaretUpDown, GraduationCap, List, Moon, Plus, Question, SignOut, Sun, User } from "@phosphor-icons/react";
import { Avatar, Badge, BrandMark, IconButton, MenuDivider, MenuItem, MenuLabel, Popover, SonyaLogo } from "@/components/ui";
import { brands, user, workspace } from "@/data/mock";
import { useTheme } from "@/lib/theme";
import { useShell } from "./ShellContext";

/** App header — 32px tall: logo, workspace switcher, learn, help, notifications, theme, avatar. */
export function AppHeader({ onMenu }: { onMenu: () => void }) {
  const { theme, toggle } = useTheme();
  const { openLearn } = useShell();
  const nav = useNavigate();
  return (
    <header className="flex h-8 shrink-0 items-center gap-3">
      <IconButton label="Open menu" variant="link" className="lg:hidden" onClick={onMenu}>
        <List className="size-4" />
      </IconButton>
      <SonyaLogo size={28} />
      <span className="hidden h-5 w-px bg-line-strong sm:block" />
      <Popover
        trigger={({ toggle: t, open }) => (
          <button
            onClick={t}
            aria-expanded={open}
            className="hidden h-8 items-center gap-2 rounded-lg bg-surface pl-1.5 pr-2 shadow-control-soft transition-colors hover:bg-canvas sm:inline-flex"
          >
            <BrandMark brand={brands[0]} size={20} />
            <span className="t-label text-ink">{workspace.name}</span>
            <Badge tone="inverse">{workspace.plan}</Badge>
            <CaretUpDown className="size-3.5 text-icon-subtle" />
          </button>
        )}
        className="w-64"
      >
        {(close) => (
          <>
            <MenuLabel>Projects</MenuLabel>
            <MenuItem icon={<BrandMark brand={brands[0]} size={18} />} selected description="lumen.so" onClick={close}>
              Lumen
            </MenuItem>
            <MenuItem icon={<BrandMark brand={brands[4]} size={18} />} description="lumen-labs.dev" onClick={close}>
              Lumen Labs
            </MenuItem>
            <MenuDivider />
            <MenuItem
              icon={<Plus />}
              onClick={() => {
                close();
                nav("/onboarding");
              }}
            >
              New project
            </MenuItem>
          </>
        )}
      </Popover>

      <div className="flex-1" />

      <button
        onClick={() => openLearn("start")}
        className="hidden h-8 items-center gap-1.5 rounded-lg bg-surface px-2.5 t-label text-ink shadow-control-soft transition-colors hover:bg-canvas md:inline-flex"
      >
        <GraduationCap weight="duotone" className="size-4 text-icon" /> Learn
      </button>
      <IconButton label="Help" onClick={() => nav("/knowledge")} className="hidden sm:inline-grid">
        <Question className="size-4" />
      </IconButton>
      <Popover
        align="end"
        className="w-80"
        trigger={({ toggle: t }) => (
          <IconButton label="Notifications" onClick={t}>
            <Bell className="size-4" />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full dot-warning" />
          </IconButton>
        )}
      >
        <div className="px-2 pb-1 pt-1.5 t-caption-medium text-ink">Notifications</div>
        {[
          { t: "Perplexity visibility up 5.1 pts", d: "Driven by /compare/orbit citations", time: "12m" },
          { t: "Weekly digest is ready", d: "Nov 3 – Nov 9 · PDF", time: "2h" },
          { t: "2 critical issues found", d: "Site audit · lumen.so", time: "1d" },
        ].map((n) => (
          <div key={n.t} className="flex gap-2.5 rounded-lg px-2 py-2 hover:bg-subtle">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--blue-500)]" />
            <div className="min-w-0 flex-1">
              <div className="t-body text-ink">{n.t}</div>
              <div className="t-caption text-ink-3">{n.d}</div>
            </div>
            <span className="t-caption text-ink-3">{n.time}</span>
          </div>
        ))}
      </Popover>
      <IconButton label={theme === "dark" ? "Switch to light" : "Switch to dark"} onClick={toggle}>
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </IconButton>
      <Popover
        align="end"
        className="w-60"
        trigger={({ toggle: t }) => (
          <button onClick={t} aria-label="Account" className="rounded-full transition-transform active:scale-95">
            <Avatar name={user.name} size={32} />
          </button>
        )}
      >
        {(close) => (
          <>
            <div className="px-2 py-1.5">
              <div className="t-body-medium text-ink">{user.name}</div>
              <div className="t-caption text-ink-3">{user.email}</div>
            </div>
            <MenuDivider />
            <MenuItem icon={<User />} onClick={() => { close(); nav("/settings/general"); }}>Account settings</MenuItem>
            <MenuItem icon={<GraduationCap />} onClick={() => { close(); openLearn("videos"); }}>Video tutorials</MenuItem>
            <MenuDivider />
            <MenuItem icon={<SignOut />} onClick={() => { close(); nav("/signin"); }}>Log out</MenuItem>
          </>
        )}
      </Popover>
    </header>
  );
}
