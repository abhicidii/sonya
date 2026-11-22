import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowSquareOut, CaretDown, CheckCircle, Circle, EnvelopeSimple, Play, RocketLaunch, Users, VideoCamera, X } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { Button, Dialog, IconButton, PillTabs, SonyaLogo } from "@/components/ui";
import { learnVideos } from "@/data/mock";

const steps = [
  { id: "s1", title: "Add your brand and competitors", done: true, body: "Sonya uses your domain and up to 10 competitors to compute share of voice.", cta: { label: "Edit brands", to: "/settings/brands" } },
  { id: "s2", title: "Track your first 10 prompts", done: true, body: "Pick from suggested prompts or write your own. Each prompt runs daily on every model.", cta: { label: "Open prompts", to: "/prompts" } },
  { id: "s3", title: "Ask your AI agent", done: true, body: "The agent reads your data and drafts plans, pages and fixes.", cta: { label: "Open agent", to: "/agent" } },
  { id: "s4", title: "Connect Google Search Console", done: false, body: "See which AI answers send traffic and which pages convert.", cta: { label: "Connect", to: "/settings/integrations" } },
  { id: "s5", title: "Invite team members", done: false, body: "Share dashboards and assign opportunities.", cta: { label: "Invite", to: "/settings/team" } },
];

/** Learn modal — Get started checklist + video tutorials (Searchable "Learn" flow). */
export function LearnModal({ open, onClose, tab, setTab }: { open: boolean; onClose: () => void; tab: "start" | "videos"; setTab: (t: "start" | "videos") => void }) {
  const nav = useNavigate();
  const [expanded, setExpanded] = useState<string | null>("s4");
  const [cat, setCat] = useState("all");
  const go = (to: string) => {
    onClose();
    nav(to);
  };
  const vids = cat === "all" ? learnVideos : learnVideos.filter((v) => v.kicker === cat);

  return (
    <Dialog open={open} onClose={onClose} size="xl" className="h-[min(88vh,640px)]">
      <div className="relative flex h-full min-h-0">
        <IconButton label="Close" variant="link" size="xs" onClick={onClose} className="absolute right-3 top-3 z-10">
          <X className="size-4" />
        </IconButton>
        <aside className="hidden w-52 shrink-0 flex-col gap-0.5 border-r border-line bg-canvas p-3 sm:flex">
          <div className="px-2 pb-1.5 pt-1 t-caption text-ink-3">Learn</div>
          <SideBtn active={tab === "start"} onClick={() => setTab("start")} icon={<RocketLaunch weight="duotone" />}>Get started</SideBtn>
          <SideBtn active={tab === "videos"} onClick={() => setTab("videos")} icon={<VideoCamera weight="duotone" />}>Video tutorials</SideBtn>
          <div className="px-2 pb-1.5 pt-4 t-caption text-ink-3">Resources</div>
          <SideBtn onClick={() => go("/knowledge")} icon={<Users weight="duotone" />} external>Community</SideBtn>
          <SideBtn onClick={() => go("/knowledge")} icon={<ArrowSquareOut weight="duotone" />} external>Documentation</SideBtn>
        </aside>
        <div className="min-w-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {tab === "start" ? (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="t-heading text-ink">Get started</h2>
                <p className="mt-1 t-caption text-ink-2">3 of 5 done. Finish setup to unlock traffic attribution.</p>
              </div>
              <div className="flex flex-col divide-y divide-line rounded-xl shadow-card">
                {steps.map((s) => {
                  const isOpen = expanded === s.id;
                  return (
                    <div key={s.id}>
                      <button onClick={() => setExpanded(isOpen ? null : s.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                        {s.done ? <CheckCircle weight="fill" className="size-5 text-[var(--status-success)]" /> : <Circle className="size-5 text-icon-muted" />}
                        <span className={cn("flex-1 t-body-medium", s.done ? "text-ink-2" : "text-ink")}>{s.title}</span>
                        <CaretDown className={cn("size-4 text-icon-subtle transition-transform duration-200", isOpen && "rotate-180")} />
                      </button>
                      {isOpen && (
                        <div className="flex items-center gap-3 px-4 pb-4 pl-12 animate-[sy-fade-in_160ms_ease-out]">
                          <p className="flex-1 t-caption text-ink-2">{s.body}</p>
                          <Button size="xs" variant={s.done ? "outlined" : "filled"} onClick={() => go(s.cta.to)}>
                            {s.cta.label}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="rounded-2xl bg-canvas p-1 shadow-card">
                <div className="px-3 py-2.5">
                  <div className="t-caption text-ink-3">Recommended next</div>
                  <div className="mt-1 t-heading text-ink">Video tutorials</div>
                </div>
                <div className="grid grid-cols-1 gap-3 rounded-xl bg-surface p-3 shadow-card sm:grid-cols-3">
                  {learnVideos.slice(0, 3).map((v) => (
                    <VideoCard key={v.id} v={v} compact />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl px-4 py-3 shadow-card">
                <EnvelopeSimple className="size-5 text-icon" />
                <div className="flex-1">
                  <div className="t-body-medium text-ink">Contact support</div>
                  <div className="t-caption text-ink-2">We usually reply within 2 hours.</div>
                </div>
                <Button variant="link" size="xs" iconRight={<ArrowRight className="size-3.5" />}>Email support</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="t-heading text-ink">Video tutorials</h2>
                <p className="mt-1 t-caption text-ink-2">Short walkthroughs for prompts, AI visibility, content and optimization.</p>
              </div>
              <PillTabs
                value={cat}
                onChange={setCat}
                options={[{ value: "all", label: "All videos" }, ...["Prompts", "AEO Insights", "Content", "Optimization"].map((c) => ({ value: c, label: c }))]}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {vids.map((v) => (
                  <VideoCard key={v.id} v={v} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function SideBtn({ active, onClick, icon, children, external }: { active?: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode; external?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-8 items-center gap-2 rounded-lg px-2 t-label transition-colors [&_svg]:size-4",
        active ? "bg-surface text-ink shadow-nav-active" : "text-ink-2 hover:bg-subtle hover:text-ink",
      )}
    >
      <span className="text-icon">{icon}</span>
      <span className="flex-1 text-left">{children}</span>
      {external && <ArrowSquareOut className="!size-3 text-icon-muted" />}
    </button>
  );
}

function VideoCard({ v, compact }: { v: (typeof learnVideos)[number]; compact?: boolean }) {
  const [a, b] = v.title.split(" ").length > 1 ? [v.title.split(" ")[0], v.title.split(" ").slice(1).join(" ")] : [v.title, ""];
  return (
    <button className="group text-left">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-[radial-gradient(120%_90%_at_85%_10%,#3a3a3f_0%,#151517_55%,#0c0c0d_100%)] p-3 shadow-card">
        <div className="flex items-center justify-between">
          <span className="[&_.t-wordmark]:!text-white [&_.t-wordmark]:text-[12px]">
            <SonyaLogo size={14} />
          </span>
          <span className="rounded border border-white/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/60">Platform overview</span>
        </div>
        <div className={cn("absolute bottom-3 left-3 font-medium leading-[0.95] tracking-[-0.03em]", compact ? "text-[20px]" : "text-[30px]")}>
          <div className="text-[var(--orange-400)]">{a}</div>
          {b && <div className="text-white">{b}</div>}
        </div>
        <span className="absolute bottom-3 right-3 rounded-md bg-black/50 px-1.5 py-0.5 t-micro text-white">{v.minutes} min</span>
        <span className="absolute left-1/2 top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 scale-90 place-items-center rounded-full bg-white/90 opacity-0 shadow-xs transition-[opacity,transform] duration-200 ease-out group-hover:scale-100 group-hover:opacity-100">
          <Play weight="fill" className="size-4 text-[var(--orange-500)]" />
        </span>
      </div>
      {!compact && <div className="mt-2.5 t-caption text-ink-3">{v.kicker}</div>}
      <div className={cn("t-body-medium text-ink", compact ? "mt-2" : "mt-0.5")}>{v.title}</div>
      <div className="mt-0.5 t-caption text-ink-2">{v.description}</div>
    </button>
  );
}
