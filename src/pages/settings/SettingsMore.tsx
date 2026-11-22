import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowsClockwise,
  ArticleMedium,
  BookOpen,
  Browsers,
  ChartBar,
  ChatsCircle,
  Check,
  CheckCircle,
  Copy,
  CreditCard,
  DotsThree,
  DownloadSimple,
  Eye,
  EyeSlash,
  Key,
  Lightning,
  MagnifyingGlass,
  Plus,
  Trash,
  Warning,
} from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardPanel,
  Dialog,
  Field,
  IconButton,
  Input,
  MenuDivider,
  MenuItem,
  Popover,
  PillTabs,
  Segmented,
  Select,
  StatusPill,
  Table,
  Td,
  Th,
  THead,
  TickMeter,
  Toggle,
  Tr,
  useToast,
  type TileColor,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { SectionIntro, SettingRow, SettingsCard } from "./parts";

/* -------------------------------------------------------------------------- */
/* Integrations                                                                */
/* -------------------------------------------------------------------------- */

type IntCat = "all" | "data" | "alerts" | "cms";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  tile: TileColor;
  cat: Exclude<IntCat, "all">;
  connected: boolean;
  account?: string;
  synced?: string;
  recommended?: boolean;
}

const initialIntegrations: Integration[] = [
  { id: "gsc", name: "Google Search Console", description: "Clicks and impressions from AI Overviews and search, per page.", icon: <MagnifyingGlass weight="bold" />, tile: "blue", cat: "data", connected: false, recommended: true },
  { id: "ga", name: "Google Analytics", description: "Sessions and conversions from AI referrers like ChatGPT and Perplexity.", icon: <ChartBar weight="fill" />, tile: "orange", cat: "data", connected: true, account: "lumen.so · GA4", synced: "12 min ago" },
  { id: "slack", name: "Slack", description: "Visibility alerts, weekly digests and Agent approvals in a channel.", icon: <ChatsCircle weight="fill" />, tile: "purple", cat: "alerts", connected: true, account: "#growth-ai", synced: "1 h ago" },
  { id: "webflow", name: "Webflow", description: "Publish briefs and drafts from Content straight to your CMS.", icon: <Browsers weight="fill" />, tile: "ink", cat: "cms", connected: false },
  { id: "wordpress", name: "WordPress", description: "Push drafts and update schema on existing posts.", icon: <ArticleMedium weight="fill" />, tile: "green", cat: "cms", connected: false },
  { id: "zapier", name: "Zapier", description: "Trigger 6,000+ apps when visibility or sentiment changes.", icon: <Lightning weight="fill" />, tile: "pink", cat: "alerts", connected: false },
];

export function IntegrationsSection() {
  const toast = useToast();
  const [items, setItems] = useState(initialIntegrations);
  const [busy, setBusy] = useState<string | null>(null);
  const [cat, setCat] = useState<IntCat>("all");
  const shown = items.filter((i) => cat === "all" || i.cat === cat);
  const connectedCount = items.filter((i) => i.connected).length;

  const connect = (it: Integration) => {
    setBusy(it.id);
    window.setTimeout(() => {
      setItems((s) => s.map((x) => (x.id === it.id ? { ...x, connected: true, account: it.id === "gsc" ? "sc-domain:lumen.so" : "lumen.so", synced: "Just now" } : x)));
      setBusy(null);
      toast({ title: `${it.name} connected`, description: "First sync runs in the background — usually under 5 minutes." });
    }, 1100);
  };

  const disconnect = (it: Integration) => {
    setItems((s) => s.map((x) => (x.id === it.id ? { ...x, connected: false, account: undefined, synced: undefined } : x)));
    toast({ tone: "info", title: `${it.name} disconnected`, action: { label: "Undo", onClick: () => setItems((s) => s.map((x) => (x.id === it.id ? it : x))) } });
  };

  return (
    <>
      <SectionIntro title="Integrations" description={`Connect your stack so Sonya can see traffic and act for you. ${connectedCount} of ${items.length} connected.`} />
      <PillTabs
        value={cat}
        onChange={setCat}
        options={[
          { value: "all", label: "All", count: items.length },
          { value: "data", label: "Data", count: items.filter((i) => i.cat === "data").length },
          { value: "alerts", label: "Alerts & automation", count: items.filter((i) => i.cat === "alerts").length },
          { value: "cms", label: "CMS", count: items.filter((i) => i.cat === "cms").length },
        ]}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {shown.map((it) => (
          <Card key={it.id}>
            <CardHeader
              icon={it.icon}
              tile={it.tile}
              title={
                <>
                  <span className="truncate">{it.name}</span>
                  {it.recommended && !it.connected && <Badge tone="blue">Recommended</Badge>}
                </>
              }
              actions={it.connected ? <StatusPill tone="success">Connected</StatusPill> : <StatusPill tone="neutral">Off</StatusPill>}
            />
            <CardPanel className="flex flex-1 flex-col gap-4">
              <p className="min-h-[40px] t-body text-ink-2">{it.description}</p>
              <div className="mt-auto flex items-center gap-2 border-t border-line pt-3">
                {it.connected ? (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="truncate t-caption-medium text-ink">{it.account}</div>
                      <div className="t-caption text-ink-3">Synced {it.synced}</div>
                    </div>
                    <Popover
                      align="end"
                      trigger={({ toggle, open }) => (
                        <Button size="xs" variant="outlined" tone="secondary" onClick={toggle} aria-expanded={open} iconRight={<DotsThree weight="bold" className="size-3.5" />}>
                          Manage
                        </Button>
                      )}
                    >
                      {(close) => (
                        <>
                          <MenuItem
                            icon={<ArrowsClockwise />}
                            onClick={() => {
                              close();
                              setItems((s) => s.map((x) => (x.id === it.id ? { ...x, synced: "Just now" } : x)));
                              toast({ title: `${it.name} synced` });
                            }}
                          >
                            Sync now
                          </MenuItem>
                          <MenuItem icon={<BookOpen />} onClick={close}>
                            Setup guide
                          </MenuItem>
                          <MenuDivider />
                          <MenuItem
                            danger
                            icon={<Trash />}
                            onClick={() => {
                              close();
                              disconnect(it);
                            }}
                          >
                            Disconnect
                          </MenuItem>
                        </>
                      )}
                    </Popover>
                  </>
                ) : (
                  <>
                    <span className="flex-1 t-caption text-ink-3">Takes about a minute</span>
                    <Button size="xs" loading={busy === it.id} disabled={!!busy && busy !== it.id} onClick={() => connect(it)}>
                      {busy === it.id ? "Connecting…" : "Connect"}
                    </Button>
                  </>
                )}
              </div>
            </CardPanel>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-canvas px-4 py-3 shadow-card">
        <Key weight="duotone" className="size-5 text-icon" />
        <div className="min-w-0 flex-1">
          <div className="t-body-medium text-ink">Need something custom?</div>
          <div className="t-caption text-ink-2">Use the REST API and webhooks to pull visibility data into your warehouse.</div>
        </div>
        <ApiLinkButton />
      </div>
    </>
  );
}

function ApiLinkButton() {
  const nav = useNavigate();
  return (
    <Button size="sm" variant="outlined" tone="secondary" onClick={() => nav("/settings/api")}>
      API keys
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/* Billing                                                                     */
/* -------------------------------------------------------------------------- */

const plans = [
  { id: "starter", name: "Starter", price: 99, prompts: 25, models: 3, seats: 2, blurb: "For a single brand getting started" },
  { id: "pro", name: "Pro", price: 249, prompts: 50, models: 6, seats: 5, blurb: "For growth teams shipping weekly" },
  { id: "scale", name: "Scale", price: 649, prompts: 200, models: 7, seats: 15, blurb: "For multiple brands and agencies" },
];

const invoices = [
  { id: "INV-2026-011", date: "Nov 1, 2026", amount: 249, status: "Paid" },
  { id: "INV-2026-010", date: "Oct 1, 2026", amount: 249, status: "Paid" },
  { id: "INV-2026-009", date: "Sep 1, 2026", amount: 249, status: "Paid" },
  { id: "INV-2026-008", date: "Aug 1, 2026", amount: 99, status: "Paid" },
  { id: "INV-2026-007", date: "Jul 1, 2026", amount: 99, status: "Refunded" },
];

export function BillingSection() {
  const toast = useToast();
  const [planId, setPlanId] = useState("pro");
  const [annual, setAnnual] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [pick, setPick] = useState("pro");
  const plan = plans.find((p) => p.id === planId)!;

  const usage = [
    { label: "Tracked prompts", used: 49, max: plan.prompts, hint: "Suggested prompts don't count" },
    { label: "AI models", used: Math.min(6, plan.models), max: plan.models, hint: "ChatGPT, Perplexity, AIO, Gemini, Claude, Copilot" },
    { label: "Seats", used: 4, max: plan.seats, hint: "1 pending invite" },
    { label: "Agent credits", used: 1240, max: 2000, hint: "Resets Dec 1" },
  ];

  return (
    <>
      <SectionIntro title="Billing" description="Your plan, usage and invoices." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader icon={<Lightning weight="fill" />} tile="ink" title="Current plan" actions={<Badge tone="green">Active</Badge>} />
          <CardPanel className="flex flex-col gap-4">
            <div className="flex items-baseline gap-2">
              <span className="t-heading text-ink">{plan.name}</span>
              <span className="flex-1" />
              <span className="t-num-xl text-ink">${annual ? Math.round(plan.price * 0.83) : plan.price}</span>
              <span className="t-caption text-ink-3">/ mo</span>
            </div>
            <p className="t-body text-ink-2">{plan.blurb}. Renews on <span className="t-body-medium text-ink">Dec 1, 2026</span>.</p>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {[`${plan.prompts} tracked prompts`, `${plan.models} AI models`, `${plan.seats} seats`, "Agent & Skills", "Daily refresh", "Slack alerts"].map((f) => (
                <li key={f} className="flex items-center gap-1.5 t-caption text-ink-2">
                  <Check weight="bold" className="size-3 text-success" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <Button
                onClick={() => {
                  setPick(planId);
                  setChoosing(true);
                }}
              >
                Change plan
              </Button>
              <Toggle size="xs" checked={annual} onChange={(v) => { setAnnual(v); toast({ tone: "info", title: v ? "Switched to annual billing" : "Switched to monthly billing", description: v ? "You save 17% — starting next renewal." : "Takes effect on Dec 1." }); }} label="Annual · save 17%" />
            </div>
          </CardPanel>
        </Card>

        <Card>
          <CardHeader icon={<CreditCard weight="fill" />} tile="blue" title="Payment method" />
          <CardPanel className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl bg-canvas p-3">
              <span className="grid h-8 w-12 place-items-center rounded-md bg-inverse t-micro text-on-inverse">VISA</span>
              <div className="min-w-0 flex-1">
                <div className="t-body-medium text-ink">
                  Visa ending in <span className="t-num">4242</span>
                </div>
                <div className="t-caption text-ink-3">Expires 08/28</div>
              </div>
              <Badge tone="outline">Default</Badge>
            </div>
            <SettingRow label="Billing email" className="md:[&>div:first-child]:w-28">
              <span className="t-body text-ink-2">billing@lumen.so</span>
            </SettingRow>
            <div className="mt-auto flex gap-2 border-t border-line pt-3">
              <Button variant="outlined" tone="secondary" onClick={() => toast({ tone: "info", title: "Opening secure billing portal…" })}>
                Update card
              </Button>
              <Button variant="link" tone="secondary" onClick={() => toast({ tone: "info", title: "Opening secure billing portal…" })}>
                Edit billing details
              </Button>
            </div>
          </CardPanel>
        </Card>
      </div>

      <SettingsCard title="Usage" description="Billing period Nov 1 – Nov 30, 2026">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {usage.map((u) => {
            const pct = u.used / u.max;
            const tone = pct >= 1 ? "var(--status-danger)" : pct >= 0.9 ? "var(--status-warning)" : "var(--data-1)";
            return (
              <div key={u.label} className="flex flex-col gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="flex-1 t-body-medium text-ink">{u.label}</span>
                  <span className="t-num-sm-medium text-ink">
                    {u.used.toLocaleString()}
                    <span className="text-ink-3"> / {u.max.toLocaleString()}</span>
                  </span>
                </div>
                <TickMeter value={u.used} max={u.max} color={tone} />
                <div className="flex items-center gap-1.5 t-caption text-ink-3">
                  {pct >= 0.9 && <Warning weight="fill" className="size-3 text-[var(--status-warning)]" />}
                  {pct >= 1 ? "Limit reached · " : pct >= 0.9 ? "Almost full · " : ""}
                  {u.hint}
                </div>
              </div>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard
        title="Invoices"
        description="Sent to billing@lumen.so"
        flush
        actions={
          <Button size="xs" variant="outlined" tone="secondary" iconLeft={<DownloadSimple className="size-3.5" />} onClick={() => toast({ title: "Exporting invoices", description: `${invoices.length} PDFs bundled as a .zip` })}>
            Download all
          </Button>
        }
      >
        <div className="-mx-2 py-1">
          <Table>
            <THead>
              <tr>
                <Th>Invoice</Th>
                <Th>Date</Th>
                <Th align="right">Amount</Th>
                <Th>Status</Th>
                <Th className="w-10" />
              </tr>
            </THead>
            <tbody>
              {invoices.map((inv) => (
                <Tr key={inv.id}>
                  <Td className="t-num-sm text-ink">{inv.id}</Td>
                  <Td className="whitespace-nowrap text-ink-2">{inv.date}</Td>
                  <Td align="right" className="t-num">
                    ${inv.amount.toFixed(2)}
                  </Td>
                  <Td>
                    <StatusPill tone={inv.status === "Paid" ? "success" : "neutral"}>{inv.status}</StatusPill>
                  </Td>
                  <Td>
                    <IconButton label={`Download ${inv.id}`} size="xs" variant="link" onClick={() => toast({ title: `Downloading ${inv.id}.pdf` })}>
                      <DownloadSimple className="size-3.5" />
                    </IconButton>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      </SettingsCard>

      <Dialog
        open={choosing}
        onClose={() => setChoosing(false)}
        size="lg"
        title="Change plan"
        description="Upgrades apply immediately and are prorated. Downgrades apply at renewal."
        footer={
          <>
            <Button variant="outlined" tone="secondary" onClick={() => setChoosing(false)}>
              Cancel
            </Button>
            <Button
              disabled={pick === planId}
              onClick={() => {
                const p = plans.find((x) => x.id === pick)!;
                setPlanId(pick);
                setChoosing(false);
                toast({ title: `Switched to ${p.name}`, description: p.price > plan.price ? "Your new limits are live now." : "Your plan changes on Dec 1." });
              }}
            >
              {pick === planId ? "Current plan" : `Switch to ${plans.find((x) => x.id === pick)?.name}`}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
          {plans.map((p) => {
            const active = pick === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPick(p.id)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col gap-3 rounded-xl bg-surface p-4 text-left transition-shadow",
                  active ? "shadow-[0_0_0_1.5px_var(--text-primary),0_1px_2px_rgb(40_40_40/0.08)]" : "shadow-control hover:shadow-control",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="t-heading text-ink">{p.name}</span>
                  {p.id === planId && <Badge tone="neutral">Current</Badge>}
                  <span className="flex-1" />
                  <span className={cn("grid size-4 place-items-center rounded-full", active ? "bg-primary text-on-primary" : "shadow-control")}>
                    {active && <Check weight="bold" className="size-2.5" />}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="t-num-lg text-ink">${p.price}</span>
                  <span className="t-caption text-ink-3">/ mo</span>
                </div>
                <p className="t-caption text-ink-2">{p.blurb}</p>
                <ul className="flex flex-col gap-1 border-t border-line pt-3">
                  {[`${p.prompts} prompts`, `${p.models} models`, `${p.seats} seats`].map((f) => (
                    <li key={f} className="flex items-center gap-1.5 t-caption text-ink-2">
                      <Check weight="bold" className="size-3 text-success" /> {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </Dialog>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                               */
/* -------------------------------------------------------------------------- */

type Channel = "email" | "slack" | "app";

const events: { id: string; group: string; label: string; hint: string; defaults: Record<Channel, boolean> }[] = [
  { id: "drop", group: "Visibility", label: "Visibility drops", hint: "When any model falls more than 5 pts in a day", defaults: { email: true, slack: true, app: true } },
  { id: "gain", group: "Visibility", label: "Big gains", hint: "When visibility rises more than 5 pts", defaults: { email: false, slack: true, app: true } },
  { id: "competitor", group: "Visibility", label: "New competitor detected", hint: "A brand starts appearing next to you", defaults: { email: true, slack: false, app: true } },
  { id: "sentiment", group: "Visibility", label: "Negative sentiment", hint: "A cited source describes you negatively", defaults: { email: true, slack: true, app: true } },
  { id: "agent", group: "Agent & content", label: "Agent needs approval", hint: "Proposed actions waiting for you", defaults: { email: false, slack: true, app: true } },
  { id: "published", group: "Agent & content", label: "Content published", hint: "A draft goes live on your CMS", defaults: { email: false, slack: false, app: true } },
  { id: "issues", group: "Site", label: "New critical issues", hint: "After each weekly crawl", defaults: { email: true, slack: false, app: true } },
];

export function NotificationsSection() {
  const toast = useToast();
  const [prefs, setPrefs] = useState(() => Object.fromEntries(events.map((e) => [e.id, { ...e.defaults }])) as Record<string, Record<Channel, boolean>>);
  const [digest, setDigest] = useState("weekly");
  const [quiet, setQuiet] = useState(true);
  const [paused, setPaused] = useState(false);
  const groups = useMemo(() => [...new Set(events.map((e) => e.group))], []);
  const channels: { key: Channel; label: string }[] = [
    { key: "email", label: "Email" },
    { key: "slack", label: "Slack" },
    { key: "app", label: "In-app" },
  ];

  const setPref = (id: string, ch: Channel, v: boolean) => setPrefs((p) => ({ ...p, [id]: { ...p[id], [ch]: v } }));
  const setColumn = (ch: Channel, v: boolean) => setPrefs((p) => Object.fromEntries(Object.entries(p).map(([k, x]) => [k, { ...x, [ch]: v }])));

  return (
    <>
      <SectionIntro
        title="Notifications"
        description="Choose what Sonya tells you about, and where."
        actions={<Toggle checked={paused} onChange={(v) => { setPaused(v); toast({ tone: "info", title: v ? "Notifications paused" : "Notifications resumed" }); }} label="Pause all" />}
      />

      <Card className={cn("transition-opacity", paused && "pointer-events-none opacity-50")}>
        <CardHeader title="Alerts" description="Slack alerts post to #growth-ai" />
        <CardPanel flush className="px-2 py-1">
          <Table>
            <THead>
              <tr>
                <Th>Event</Th>
                {channels.map((c) => {
                  const all = events.every((e) => prefs[e.id][c.key]);
                  return (
                    <Th key={c.key} align="center" className="w-20">
                      <button onClick={() => setColumn(c.key, !all)} className="inline-flex items-center gap-1 hover:text-ink" title={all ? `Turn off all ${c.label}` : `Turn on all ${c.label}`}>
                        {c.label}
                      </button>
                    </Th>
                  );
                })}
              </tr>
            </THead>
            <tbody>
              {groups.map((g) => (
                <GroupRows key={g} group={g}>
                  {events
                    .filter((e) => e.group === g)
                    .map((e) => (
                      <Tr key={e.id}>
                        <Td className="py-2.5">
                          <div className="t-body-medium text-ink">{e.label}</div>
                          <div className="t-caption text-ink-3">{e.hint}</div>
                        </Td>
                        {channels.map((c) => (
                          <Td key={c.key} align="center">
                            <span className="inline-flex">
                              <Toggle size="xs" checked={prefs[e.id][c.key]} onChange={(v) => setPref(e.id, c.key, v)} />
                            </span>
                          </Td>
                        ))}
                      </Tr>
                    ))}
                </GroupRows>
              ))}
            </tbody>
          </Table>
        </CardPanel>
      </Card>

      <SettingsCard title="Digest & schedule" className={cn("transition-opacity", paused && "pointer-events-none opacity-50")}>
        <SettingRow label="Visibility digest" hint="A summary of visibility, citations and competitor moves">
          <Segmented
            value={digest}
            onChange={setDigest}
            options={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "off", label: "Off" },
            ]}
          />
        </SettingRow>
        <SettingRow label="Delivery time" hint="In your time zone">
          <Select
            value="mon9"
            onChange={() => toast({ title: "Delivery time updated" })}
            options={[
              { value: "mon9", label: "Monday · 9:00 AM" },
              { value: "mon8", label: "Monday · 8:00 AM" },
              { value: "fri4", label: "Friday · 4:00 PM" },
            ]}
          />
        </SettingRow>
        <SettingRow label="Quiet hours" hint="No Slack or in-app alerts 8 PM – 8 AM">
          <Toggle checked={quiet} onChange={setQuiet} label={quiet ? "On" : "Off"} />
        </SettingRow>
      </SettingsCard>
    </>
  );
}

function GroupRows({ group, children }: { group: string; children: ReactNode }) {
  return (
    <>
      <tr>
        <td colSpan={4} className="border-b border-line px-3 pb-1.5 pt-4 t-caption-medium text-ink-3">
          {group}
        </td>
      </tr>
      {children}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* API keys                                                                    */
/* -------------------------------------------------------------------------- */

interface ApiKey {
  id: string;
  name: string;
  value: string;
  scope: "read" | "write";
  created: string;
  lastUsed: string;
  by: string;
}

function makeKey() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 32; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `sy_live_${s}`;
}

const mask = (v: string) => `${v.slice(0, 8)}${"•".repeat(16)}${v.slice(-4)}`;

export function ApiKeysSection() {
  const toast = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([
    { id: "k1", name: "Warehouse sync", value: "sy_live_8f2kq9x7m3v1c0d6p4r5t2w8y9z3f9a", scope: "read", created: "Sep 14, 2026", lastUsed: "4 min ago", by: "Leo Park" },
    { id: "k2", name: "Looker dashboard", value: "sy_live_3n7b1v6c8x2z4l5k9j0h3g7f2d1b44e", scope: "read", created: "Aug 2, 2026", lastUsed: "Yesterday", by: "Maya Chen" },
    { id: "k3", name: "Zapier automation", value: "sy_live_q1w2e3r4t5y6u7i8o9p0a1s2d3f4c07", scope: "write", created: "Jun 20, 2026", lastUsed: "Never", by: "Maya Chen" },
  ]);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"read" | "write">("read");
  const [created, setCreated] = useState<ApiKey | null>(null);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);

  const copy = (v: string) => {
    navigator.clipboard?.writeText(v).catch(() => {});
    toast({ title: "Key copied", description: "Store it somewhere safe." });
  };

  const closeCreate = () => {
    setCreating(false);
    setCreated(null);
    setName("");
    setScope("read");
  };

  return (
    <>
      <SectionIntro
        title="API keys"
        description="Use keys to read visibility data or automate Sonya from your own tools."
        actions={
          <Button iconLeft={<Plus weight="bold" className="size-3.5" />} onClick={() => setCreating(true)}>
            Create key
          </Button>
        }
      />

      <SettingsCard
        title={
          <>
            Active keys <span className="t-num-sm text-ink-3">{keys.length}</span>
          </>
        }
        description="Keys have the same access as the workspace, limited by scope"
        flush
      >
        {keys.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Key weight="duotone" className="size-6 text-icon" />
            <div className="t-body text-ink-2">No API keys yet.</div>
            <Button size="sm" onClick={() => setCreating(true)}>
              Create your first key
            </Button>
          </div>
        ) : (
          keys.map((k) => (
            <div key={k.id} className="flex flex-col gap-2 border-b border-line py-3.5 last:border-b-0 md:flex-row md:items-center md:gap-4">
              <div className="min-w-0 md:w-48 md:shrink-0">
                <div className="flex items-center gap-1.5 t-body-medium text-ink">
                  <span className="truncate">{k.name}</span>
                  <Badge tone={k.scope === "write" ? "orange" : "neutral"}>{k.scope === "write" ? "Read & write" : "Read only"}</Badge>
                </div>
                <div className="t-caption text-ink-3">
                  Created {k.created} · {k.by}
                </div>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-1 rounded-lg bg-canvas py-1 pl-2.5 pr-1">
                <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-2">{revealed === k.id ? k.value : mask(k.value)}</code>
                <IconButton label={revealed === k.id ? "Hide key" : "Reveal key"} size="xs" variant="link" onClick={() => setRevealed(revealed === k.id ? null : k.id)}>
                  {revealed === k.id ? <EyeSlash className="size-3.5" /> : <Eye className="size-3.5" />}
                </IconButton>
                <IconButton label="Copy key" size="xs" variant="link" onClick={() => copy(k.value)}>
                  <Copy className="size-3.5" />
                </IconButton>
              </div>
              <div className="flex items-center gap-3 md:w-40 md:justify-end">
                <span className="flex-1 t-caption text-ink-3 md:flex-none">Used {k.lastUsed.toLowerCase() === "never" ? "never" : k.lastUsed}</span>
                <Button size="xs" variant="link" tone="danger" onClick={() => setRevoking(k)}>
                  Revoke
                </Button>
              </div>
            </div>
          ))
        )}
      </SettingsCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SettingsCard title="Rate limit" description="Requests in the last 24 hours">
          <div className="flex items-baseline gap-2">
            <span className="t-num-lg text-ink">18,420</span>
            <span className="t-caption text-ink-3">/ 100,000</span>
          </div>
          <TickMeter value={18420} max={100000} className="mt-3" />
        </SettingsCard>
        <SettingsCard title="Quick start" description="List visibility by model">
          <pre className="overflow-x-auto rounded-lg bg-canvas p-3 font-mono text-[12px] leading-relaxed text-ink-2">
            {`curl https://api.sonya.ai/v1/visibility \\
  -H "Authorization: Bearer $SONYA_KEY"`}
          </pre>
        </SettingsCard>
      </div>

      {/* Create */}
      <Dialog
        open={creating}
        onClose={closeCreate}
        size="sm"
        title={created ? "Key created" : "Create API key"}
        description={created ? "Copy it now — you won't be able to see it again." : "Name the key after the tool that will use it."}
        footer={
          created ? (
            <Button onClick={closeCreate}>Done</Button>
          ) : (
            <>
              <Button variant="outlined" tone="secondary" onClick={closeCreate}>
                Cancel
              </Button>
              <Button
                disabled={!name.trim()}
                onClick={() => {
                  const k: ApiKey = { id: `k${Date.now()}`, name: name.trim(), value: makeKey(), scope, created: "Nov 6, 2026", lastUsed: "Never", by: "Maya Chen" };
                  setKeys((s) => [k, ...s]);
                  setCreated(k);
                }}
              >
                Create key
              </Button>
            </>
          )
        }
      >
        <div className="flex flex-col gap-4 p-5">
          {created ? (
            <>
              <div className="flex items-center gap-2 rounded-lg bg-success-subtle px-3 py-2 t-caption-medium text-success">
                <CheckCircle weight="fill" className="size-4" /> {created.name} is ready to use
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-canvas py-1.5 pl-3 pr-1.5">
                <code className="min-w-0 flex-1 break-all font-mono text-[12px] text-ink">{created.value}</code>
                <Button size="xs" iconLeft={<Copy className="size-3.5" />} onClick={() => copy(created.value)}>
                  Copy
                </Button>
              </div>
            </>
          ) : (
            <>
              <Field label="Name">
                <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BigQuery export" maxLength={40} />
              </Field>
              <Field label="Scope" hint={scope === "write" ? "Can add prompts, create content and approve actions." : "Can read visibility, prompts and citations."}>
                <Segmented
                  stretch
                  value={scope}
                  onChange={setScope}
                  options={[
                    { value: "read", label: "Read only" },
                    { value: "write", label: "Read & write" },
                  ]}
                />
              </Field>
            </>
          )}
        </div>
      </Dialog>

      {/* Revoke */}
      <Dialog
        open={!!revoking}
        onClose={() => setRevoking(null)}
        size="sm"
        title={`Revoke “${revoking?.name ?? ""}”?`}
        description="Any tool using this key will stop working immediately."
        footer={
          <>
            <Button variant="outlined" tone="secondary" onClick={() => setRevoking(null)}>
              Cancel
            </Button>
            <Button
              tone="danger"
              onClick={() => {
                if (!revoking) return;
                setKeys((s) => s.filter((x) => x.id !== revoking.id));
                toast({ tone: "warning", title: "Key revoked", description: revoking.name });
                setRevoking(null);
              }}
            >
              Revoke key
            </Button>
          </>
        }
      />
    </>
  );
}
