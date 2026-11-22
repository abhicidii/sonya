import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Navigate, NavLink, useParams } from "react-router-dom";
import {
  Bell,
  CreditCard,
  DotsThree,
  EnvelopeSimple,
  GearSix,
  Key,
  Monitor,
  Moon,
  PaperPlaneTilt,
  Plugs,
  Plus,
  Sparkle,
  Sun,
  Target,
  Trash,
  UploadSimple,
  Users,
  Warning,
} from "@phosphor-icons/react";
import {
  Avatar,
  Badge,
  BrandMark,
  Button,
  Dialog,
  DomainMark,
  Field,
  IconButton,
  Input,
  MenuDivider,
  MenuItem,
  Popover,
  Progress,
  Segmented,
  Select,
  Table,
  Td,
  Th,
  THead,
  Tr,
  useToast,
  type BrandDef,
} from "@/components/ui";
import { PageHeader } from "@/components/shell/PageHeader";
import { useShell } from "@/components/shell/ShellContext";
import { brands, team, user, workspace, you } from "@/data/mock";
import { useTheme } from "@/lib/theme";
import { cn, fmt } from "@/lib/cn";
import { SectionIntro, SettingRow, SettingsCard, Tag } from "./parts";
import { ApiKeysSection, BillingSection, IntegrationsSection, NotificationsSection } from "./SettingsMore";

const sections: { key: string; label: string; icon: ReactNode }[] = [
  { key: "general", label: "General", icon: <GearSix weight="duotone" /> },
  { key: "brands", label: "Brands & competitors", icon: <Target weight="duotone" /> },
  { key: "team", label: "Team", icon: <Users weight="duotone" /> },
  { key: "integrations", label: "Integrations", icon: <Plugs weight="duotone" /> },
  { key: "billing", label: "Billing", icon: <CreditCard weight="duotone" /> },
  { key: "notifications", label: "Notifications", icon: <Bell weight="duotone" /> },
  { key: "api", label: "API keys", icon: <Key weight="duotone" /> },
];

export default function SettingsPage() {
  const { section = "general" } = useParams();
  if (!sections.some((s) => s.key === section)) return <Navigate to="/settings/general" replace />;

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title="Settings" badge={<span className="t-caption text-ink-3">{workspace.name} workspace</span>} />
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sub-nav */}
        <nav
          aria-label="Settings sections"
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-4 py-2 [scrollbar-width:none] md:sticky md:top-0 md:w-60 md:flex-col md:self-start md:overflow-visible md:border-b-0 md:px-3 md:py-4"
        >
          <div className="hidden px-2 pb-1.5 t-caption text-ink-3 md:block">Workspace</div>
          {sections.map((s) => (
            <NavLink
              key={s.key}
              to={`/settings/${s.key}`}
              className={({ isActive }) =>
                cn(
                  "flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-2.5 t-label transition-[background-color,color,box-shadow] duration-150 [&_svg]:size-4",
                  isActive ? "bg-surface text-ink shadow-nav-active [&_svg]:text-icon-strong" : "text-ink-2 hover:bg-subtle hover:text-ink [&_svg]:text-icon",
                )
              }
            >
              {s.icon}
              {s.label}
            </NavLink>
          ))}
        </nav>

        <div className="min-w-0 flex-1 border-line p-4 sm:p-6 md:border-l">
          <div className="mx-auto flex w-full max-w-[880px] flex-col gap-5">
            {section === "general" && <GeneralSection />}
            {section === "brands" && <BrandsSection />}
            {section === "team" && <TeamSection />}
            {section === "integrations" && <IntegrationsSection />}
            {section === "billing" && <BillingSection />}
            {section === "notifications" && <NotificationsSection />}
            {section === "api" && <ApiKeysSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* General                                                                     */
/* -------------------------------------------------------------------------- */

function GeneralSection() {
  const toast = useToast();
  const { pref, setPref, theme } = useTheme();
  const { minimized, setMinimized } = useShell();
  const initial = { name: workspace.name, domain: workspace.domain, industry: "saas", timezone: "pt", language: "en", dateFormat: "mdy", weekStart: "mon" };
  const [saved, setSaved] = useState(initial);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [logo, setLogo] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const domainInvalid = form.domain.length > 0 && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(form.domain);

  const save = () => {
    if (domainInvalid || !form.name.trim()) return;
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setSaved(form);
      toast({ title: "Settings saved", description: "Workspace details were updated." });
    }, 700);
  };

  return (
    <>
      <SectionIntro title="General" description="Workspace details, appearance and regional formats." />

      <SettingsCard title="Workspace" description="Shown in reports, shared chats and invites">
        <SettingRow label="Logo" hint="Square PNG or SVG, at least 128 px">
          {logo ? <BrandMark brand={you} size={44} className="rounded-xl" /> : <span className="grid size-11 place-items-center rounded-xl bg-subtle t-heading text-ink-3">{form.name[0] ?? "?"}</span>}
          <Button variant="outlined" tone="secondary" iconLeft={<UploadSimple className="size-4" />} onClick={() => { setLogo(true); toast({ title: "Logo uploaded", description: "lumen-logo.svg · 4 KB" }); }}>
            Upload
          </Button>
          {logo && (
            <Button variant="link" tone="secondary" onClick={() => setLogo(false)}>
              Remove
            </Button>
          )}
        </SettingRow>
        <SettingRow label="Workspace name">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} invalid={!form.name.trim()} wrapperClassName="w-full max-w-sm" />
        </SettingRow>
        <SettingRow label="Primary domain" hint="Used to detect owned citations">
          <div className="flex w-full max-w-sm flex-col gap-1">
            <Input
              value={form.domain}
              onChange={(e) => set("domain", e.target.value.trim())}
              invalid={domainInvalid}
              iconLeft={<span className="t-body text-ink-3">https://</span>}
            />
            {domainInvalid && <span className="t-caption text-danger">Enter a domain like lumen.so</span>}
          </div>
        </SettingRow>
        <SettingRow label="Industry" hint="Helps Sonya suggest prompts">
          <Select
            value={form.industry}
            onChange={(v) => set("industry", v)}
            options={[
              { value: "saas", label: "B2B SaaS" },
              { value: "ecom", label: "E-commerce" },
              { value: "fin", label: "Fintech" },
              { value: "health", label: "Health" },
              { value: "agency", label: "Agency" },
            ]}
          />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Appearance" description="Only affects your account">
        <SettingRow label="Theme" hint={pref === "system" ? `Following your OS · ${theme}` : undefined}>
          <Segmented
            value={pref}
            onChange={setPref}
            options={[
              { value: "light", label: "Light", icon: <Sun /> },
              { value: "dark", label: "Dark", icon: <Moon /> },
              { value: "system", label: "System", icon: <Monitor /> },
            ]}
          />
        </SettingRow>
        <SettingRow label="Sidebar" hint="Minimized shows icons only">
          <Segmented
            value={minimized ? "min" : "full"}
            onChange={(v) => setMinimized(v === "min")}
            options={[
              { value: "full", label: "Expanded" },
              { value: "min", label: "Minimized" },
            ]}
          />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Language & region" description="Formats used in tables, charts and exports">
        <SettingRow label="Language">
          <Select
            value={form.language}
            onChange={(v) => set("language", v)}
            options={[
              { value: "en", label: "English (US)" },
              { value: "en-gb", label: "English (UK)" },
              { value: "de", label: "Deutsch" },
              { value: "fr", label: "Français" },
              { value: "es", label: "Español" },
              { value: "ja", label: "日本語" },
            ]}
          />
        </SettingRow>
        <SettingRow label="Time zone">
          <Select
            value={form.timezone}
            onChange={(v) => set("timezone", v)}
            options={[
              { value: "pt", label: "Pacific Time (UTC−8)" },
              { value: "et", label: "Eastern Time (UTC−5)" },
              { value: "utc", label: "UTC" },
              { value: "cet", label: "Central European (UTC+1)" },
              { value: "sgt", label: "Singapore (UTC+8)" },
            ]}
          />
        </SettingRow>
        <SettingRow label="Date format">
          <Segmented
            value={form.dateFormat}
            onChange={(v) => set("dateFormat", v)}
            options={[
              { value: "mdy", label: "Nov 6, 2026" },
              { value: "dmy", label: "6 Nov 2026" },
              { value: "iso", label: "2026-11-06" },
            ]}
          />
        </SettingRow>
        <SettingRow label="Week starts on">
          <Segmented
            value={form.weekStart}
            onChange={(v) => set("weekStart", v)}
            options={[
              { value: "mon", label: "Monday" },
              { value: "sun", label: "Sunday" },
            ]}
          />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Danger zone" description="These actions can't be undone" icon={<Warning weight="fill" />}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="t-body-medium text-ink">Delete workspace</div>
            <div className="t-caption text-ink-3">Removes all prompts, history, content and team access for {saved.name}.</div>
          </div>
          <Button variant="outlined" tone="danger" iconLeft={<Trash className="size-4" />} onClick={() => setConfirmDelete(true)}>
            Delete workspace
          </Button>
        </div>
      </SettingsCard>

      {/* Save bar */}
      <div
        className={cn(
          "sticky bottom-4 z-10 flex items-center gap-3 rounded-xl bg-inverse px-4 py-2.5 text-on-inverse shadow-popover transition-[opacity,transform] duration-200 ease-out",
          dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
        )}
        aria-hidden={!dirty}
      >
        <span className="size-1.5 rounded-full dot-warning" />
        <span className="flex-1 t-body-medium">Unsaved changes</span>
        <button onClick={() => setForm(saved)} className="h-8 rounded-lg px-3 t-label opacity-80 transition-opacity hover:opacity-100">
          Discard
        </button>
        <button
          onClick={save}
          disabled={saving || domainInvalid || !form.name.trim()}
          className="h-8 rounded-lg bg-surface px-3 t-label text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <Dialog
        open={confirmDelete}
        onClose={() => { setConfirmDelete(false); setConfirmText(""); }}
        size="sm"
        title="Delete workspace?"
        description={`This permanently deletes ${saved.name} for all ${team.length} members.`}
        footer={
          <>
            <Button variant="outlined" tone="secondary" onClick={() => { setConfirmDelete(false); setConfirmText(""); }}>
              Cancel
            </Button>
            <Button
              tone="danger"
              disabled={confirmText !== saved.name}
              onClick={() => {
                setConfirmDelete(false);
                setConfirmText("");
                toast({ tone: "warning", title: "Deletion scheduled", description: "The workspace will be removed in 7 days. Contact support to cancel." });
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <div className="p-5">
          <Field label={<>Type <span className="font-mono">{saved.name}</span> to confirm</>}>
            <Input autoFocus value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={saved.name} />
          </Field>
        </div>
      </Dialog>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Brands & competitors                                                        */
/* -------------------------------------------------------------------------- */

interface Competitor {
  brand: BrandDef;
  aliases: string[];
  visibility?: number;
}

const SHAPES: BrandDef["shape"][] = ["circle", "square", "diamond", "bolt", "ring", "stack", "wave", "triangle"];
const COLORS = ["#2e90fa", "#16b364", "#ff8000", "#7b42ff", "#e708a4", "#0f9a9a", "#ea4335"];

const suggested = [
  { name: "Beacon", domain: "beacon.so", seen: 14 },
  { name: "Northstar", domain: "northstar.dev", seen: 9 },
  { name: "Signalry", domain: "signalry.io", seen: 6 },
];

function AliasEditor({ aliases, onChange, placeholder = "Add alias" }: { aliases: string[]; onChange: (a: string[]) => void; placeholder?: string }) {
  const [v, setV] = useState("");
  const add = () => {
    const t = v.trim();
    if (t && !aliases.some((a) => a.toLowerCase() === t.toLowerCase())) onChange([...aliases, t]);
    setV("");
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {aliases.map((a) => (
        <Tag key={a} onRemove={() => onChange(aliases.filter((x) => x !== a))}>
          {a}
        </Tag>
      ))}
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
          if (e.key === "Backspace" && !v && aliases.length) onChange(aliases.slice(0, -1));
        }}
        onBlur={add}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-6 w-28 rounded-md bg-transparent px-1.5 t-caption text-ink outline-none placeholder:text-ink-3 focus:bg-canvas"
      />
    </div>
  );
}

function BrandsSection() {
  const toast = useToast();
  const [ownAliases, setOwnAliases] = useState(["Lumen Analytics", "lumen.so", "Lumen app"]);
  const [list, setList] = useState<Competitor[]>(() =>
    brands
      .filter((b) => !b.you)
      .slice(0, 5)
      .map((b) => ({ brand: b, aliases: b.id === "orbit" ? ["Orbit Analytics", "orbit.io"] : b.id === "tidal" ? ["Tidal.dev"] : [], visibility: b.visibility })),
  );
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const LIMIT = 10;

  const addCompetitor = (rawDomain: string, name?: string) => {
    const d = rawDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d)) return setError("Enter a domain like competitor.com");
    if (d === you.domain || list.some((c) => c.brand.domain === d)) return setError("That brand is already tracked");
    if (list.length >= LIMIT) return setError(`Your plan tracks up to ${LIMIT} competitors`);
    const root = d.split(".")[0];
    const i = list.length + d.length;
    const brand: BrandDef = { id: d, name: name ?? root[0].toUpperCase() + root.slice(1), domain: d, color: COLORS[i % COLORS.length], shape: SHAPES[i % SHAPES.length] };
    setList((l) => [...l, { brand, aliases: [] }]);
    setDomain("");
    setError(null);
    toast({ title: `${brand.name} added`, description: "Sonya will start tracking it in tonight's run." });
  };

  const remove = (c: Competitor, index: number) => {
    setList((l) => l.filter((x) => x.brand.id !== c.brand.id));
    toast({
      tone: "info",
      title: `${c.brand.name} removed`,
      description: "History is kept for 30 days.",
      action: { label: "Undo", onClick: () => setList((l) => [...l.slice(0, index), c, ...l.slice(index)]) },
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    addCompetitor(domain);
  };

  return (
    <>
      <SectionIntro title="Brands & competitors" description="Who Sonya tracks in AI answers. Aliases catch alternate names and misspellings." />

      <SettingsCard title="Your brand" description="Mentions of any alias count toward your score">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex items-center gap-3 sm:w-56 sm:shrink-0">
            <BrandMark brand={you} size={40} className="rounded-xl" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 t-body-medium text-ink">
                {you.name} <Badge tone="inverse">You</Badge>
              </div>
              <div className="t-caption text-ink-3">{you.domain}</div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 t-caption-medium text-ink-2">Aliases</div>
            <div className="rounded-lg bg-surface p-1.5 shadow-input">
              <AliasEditor aliases={ownAliases} onChange={setOwnAliases} placeholder="Add alias…" />
            </div>
            <div className="mt-1.5 t-caption text-ink-3">Press Enter to add · Backspace to remove the last one</div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title={
          <>
            Competitors <span className="t-num-sm text-ink-3">{list.length}/{LIMIT}</span>
          </>
        }
        description="Compared against you in every report"
        flush
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-1.5 border-b border-line py-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                setError(null);
              }}
              invalid={!!error}
              placeholder="competitor.com"
              iconLeft={<Plus />}
              wrapperClassName="flex-1"
              aria-label="Competitor domain"
            />
            <Button type="submit" disabled={!domain.trim()}>
              Add competitor
            </Button>
          </div>
          {error && <span className="t-caption text-danger">{error}</span>}
        </form>
        {list.map((c, i) => (
          <div key={c.brand.id} className="flex flex-col gap-2 border-b border-line py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 items-center gap-2.5 sm:w-52 sm:shrink-0">
              <BrandMark brand={c.brand} size={28} />
              <div className="min-w-0">
                <div className="truncate t-body-medium text-ink">{c.brand.name}</div>
                <div className="truncate t-caption text-ink-3">{c.brand.domain}</div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <AliasEditor aliases={c.aliases} onChange={(a) => setList((l) => l.map((x) => (x.brand.id === c.brand.id ? { ...x, aliases: a } : x)))} placeholder="+ alias" />
            </div>
            <div className="flex items-center gap-3">
              <span className="w-20 text-right t-caption text-ink-3">
                {c.visibility !== undefined ? (
                  <>
                    <span className="t-num-sm-medium text-ink">{fmt.pct(c.visibility)}</span> vis.
                  </>
                ) : (
                  <Badge tone="blue">Tracking soon</Badge>
                )}
              </span>
              <IconButton label={`Remove ${c.brand.name}`} size="xs" variant="link" onClick={() => remove(c, i)}>
                <Trash className="size-3.5" />
              </IconButton>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="py-8 text-center t-body text-ink-3">No competitors yet — add one above.</div>}
      </SettingsCard>

      <SettingsCard title="Suggested competitors" description="Brands that often appear next to you in AI answers" icon={<Sparkle weight="fill" />} tile="purple">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {suggested.map((s) => {
            const added = list.some((c) => c.brand.domain === s.domain);
            return (
              <div key={s.domain} className="flex items-center gap-2.5 rounded-xl bg-canvas px-3 py-2.5">
                <DomainMark domain={s.domain} size={24} />
                <div className="min-w-0 flex-1">
                  <div className="truncate t-body-medium text-ink">{s.name}</div>
                  <div className="truncate t-caption text-ink-3">
                    In <span className="t-num-sm">{s.seen}</span> answers
                  </div>
                </div>
                <Button size="xs" variant="outlined" tone="secondary" disabled={added} onClick={() => addCompetitor(s.domain, s.name)}>
                  {added ? "Added" : "Add"}
                </Button>
              </div>
            );
          })}
        </div>
      </SettingsCard>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Team                                                                        */
/* -------------------------------------------------------------------------- */

type Role = "Owner" | "Admin" | "Editor" | "Viewer";
const ROLE_OPTIONS: { value: Exclude<Role, "Owner">; label: string; description: string }[] = [
  { value: "Admin", label: "Admin", description: "Manage billing, team and integrations" },
  { value: "Editor", label: "Editor", description: "Edit prompts, content and run the Agent" },
  { value: "Viewer", label: "Viewer", description: "View dashboards and reports" },
];
const SEATS = 5;

function TeamSection() {
  const toast = useToast();
  const [members, setMembers] = useState(() => team.map((m) => ({ ...m, role: m.role as Role })));
  const [pending, setPending] = useState([{ email: "jordan@lumen.so", role: "Editor" as Role, sent: "2 days ago" }]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<Role, "Owner">>("Editor");
  const [error, setError] = useState<string | null>(null);
  const used = members.length + pending.length;

  const invite = (e: FormEvent) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setError("Enter a valid email address");
    if (members.some((m) => m.email === v) || pending.some((p) => p.email === v)) return setError("This person is already on the team or invited");
    if (used >= SEATS) return setError("All seats are in use — upgrade your plan or remove someone first");
    setPending((p) => [...p, { email: v, role, sent: "Just now" }]);
    setEmail("");
    setError(null);
    toast({ title: "Invite sent", description: `${v} will join as ${role}.` });
  };

  const counts = useMemo(() => members.reduce<Record<string, number>>((a, m) => ({ ...a, [m.role]: (a[m.role] ?? 0) + 1 }), {}), [members]);

  return (
    <>
      <SectionIntro
        title="Team"
        description="Invite teammates and control what they can change."
        actions={
          <div className="flex w-48 flex-col gap-1.5">
            <div className="flex items-center justify-between t-caption text-ink-2">
              Seats
              <span className="t-num-sm-medium text-ink">
                {used}/{SEATS}
              </span>
            </div>
            <Progress value={used} max={SEATS} tone={used >= SEATS ? "orange" : "blue"} />
          </div>
        }
      />

      <SettingsCard title="Invite people" description="They'll get an email with a link to join" icon={<EnvelopeSimple weight="fill" />} tile="blue">
        <form onSubmit={invite} className="flex flex-col gap-1.5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              invalid={!!error}
              placeholder="name@lumen.so"
              iconLeft={<EnvelopeSimple />}
              wrapperClassName="flex-1"
              aria-label="Email address"
            />
            <Select label="Role" value={role} onChange={setRole} options={ROLE_OPTIONS} align="end" />
            <Button type="submit" disabled={!email.trim()} iconLeft={<PaperPlaneTilt weight="fill" className="size-3.5" />}>
              Send invite
            </Button>
          </div>
          {error && <span className="t-caption text-danger">{error}</span>}
        </form>
      </SettingsCard>

      <SettingsCard
        title={
          <>
            Members <span className="t-num-sm text-ink-3">{members.length}</span>
          </>
        }
        description={Object.entries(counts)
          .map(([r, n]) => `${n} ${r}${n > 1 ? "s" : ""}`)
          .join(" · ")}
        flush
      >
        <div className="-mx-2 py-1">
          <Table>
            <THead>
              <tr>
                <Th>Member</Th>
                <Th>Role</Th>
                <Th className="hidden sm:table-cell">Last active</Th>
                <Th className="w-10" />
              </tr>
            </THead>
            <tbody>
              {members.map((m, i) => (
                <Tr key={m.email}>
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <Avatar name={m.name} size={28} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 t-body-medium text-ink">
                          {m.name}
                          {m.email === user.email && <Badge tone="neutral">You</Badge>}
                        </span>
                        <span className="block t-caption text-ink-3">{m.email}</span>
                      </span>
                    </span>
                  </Td>
                  <Td>
                    {m.role === "Owner" ? (
                      <Badge tone="inverse">Owner</Badge>
                    ) : (
                      <Select
                        size="xs"
                        label={`Role for ${m.name}`}
                        value={m.role as Exclude<Role, "Owner">}
                        options={ROLE_OPTIONS}
                        onChange={(r) => {
                          setMembers((ms) => ms.map((x) => (x.email === m.email ? { ...x, role: r } : x)));
                          toast({ title: "Role updated", description: `${m.name} is now ${r === "Admin" ? "an" : "a"} ${r}.` });
                        }}
                      />
                    )}
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1.5 t-body text-ink-2">
                      {m.last === "Now" && <span className="size-1.5 rounded-full dot-success" />}
                      {m.last === "Now" ? "Online" : m.last}
                    </span>
                  </Td>
                  <Td>
                    {m.role !== "Owner" && (
                      <Popover
                        align="end"
                        trigger={({ toggle }) => (
                          <IconButton label={`Actions for ${m.name}`} size="xs" variant="link" onClick={toggle}>
                            <DotsThree weight="bold" className="size-4" />
                          </IconButton>
                        )}
                      >
                        {(close) => (
                          <>
                            <MenuItem
                              icon={<EnvelopeSimple />}
                              onClick={() => {
                                navigator.clipboard?.writeText(m.email).catch(() => {});
                                toast({ title: "Email copied", description: m.email });
                                close();
                              }}
                            >
                              Copy email
                            </MenuItem>
                            <MenuDivider />
                            <MenuItem
                              danger
                              icon={<Trash />}
                              onClick={() => {
                                close();
                                setMembers((ms) => ms.filter((x) => x.email !== m.email));
                                toast({
                                  tone: "info",
                                  title: `${m.name} removed`,
                                  action: { label: "Undo", onClick: () => setMembers((ms) => [...ms.slice(0, i), m, ...ms.slice(i)]) },
                                });
                              }}
                            >
                              Remove from workspace
                            </MenuItem>
                          </>
                        )}
                      </Popover>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      </SettingsCard>

      <SettingsCard
        title={
          <>
            Pending invites <span className="t-num-sm text-ink-3">{pending.length}</span>
          </>
        }
        description="Invites expire after 7 days"
        flush
      >
        {pending.length === 0 ? (
          <div className="py-8 text-center t-body text-ink-3">No pending invites.</div>
        ) : (
          pending.map((p) => (
            <div key={p.email} className="flex flex-wrap items-center gap-3 border-b border-line py-3 last:border-b-0">
              <span className="grid size-7 place-items-center rounded-full bg-subtle text-icon">
                <EnvelopeSimple className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate t-body-medium text-ink">{p.email}</div>
                <div className="t-caption text-ink-3">
                  {p.role} · Sent {p.sent}
                </div>
              </div>
              <Button size="xs" variant="outlined" tone="secondary" onClick={() => toast({ title: "Invite resent", description: p.email })}>
                Resend
              </Button>
              <Button
                size="xs"
                variant="link"
                tone="danger"
                onClick={() => {
                  setPending((ps) => ps.filter((x) => x.email !== p.email));
                  toast({ tone: "info", title: "Invite revoked", description: p.email });
                }}
              >
                Revoke
              </Button>
            </div>
          ))
        )}
      </SettingsCard>
    </>
  );
}
