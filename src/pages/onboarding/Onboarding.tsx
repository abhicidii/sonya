import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, CheckCircle, Circle, Globe, Lock, Plus, Sparkle, X } from "@phosphor-icons/react";
import {
  Badge,
  BrandMark,
  Button,
  ChoiceChip,
  DomainMark,
  Field,
  Input,
  Kbd,
  LevelBars,
  ModelMark,
  MODELS,
  Progress,
  Select,
  SonyaLogo,
  Spinner,
  useToast,
  type BrandDef,
  type ModelId,
} from "@/components/ui";
import { brands, prompts as allPrompts } from "@/data/mock";
import { cn } from "@/lib/cn";
import { DOMAIN_RE, DotField, normalizeDomain } from "@/pages/auth/AuthShell";
import { OnboardingPreview, type PreviewCompetitor } from "./OnboardingPreview";

/* -------------------------------------------------------------------------- */
/* Config                                                                      */
/* -------------------------------------------------------------------------- */

const STEPS = [
  { name: "Your brand", title: "Tell us about your brand", description: "We’ll use this to find every AI answer that mentions you — and the ones that don’t." },
  { name: "Competitors", title: "Who do you compete with?", description: "Pick at least 2. We’ll benchmark your visibility and share of voice against them." },
  { name: "Models", title: "Choose your AI models", description: "Your Pro trial tracks 3 answer engines. Add more any time on the Scale plan." },
  { name: "Prompts", title: "Pick prompts to track", description: "Prompts are the questions buyers ask AI. Start with up to 10 — you can change them later." },
  { name: "Analysing", title: "Analysing your visibility…", description: "This takes about a minute. We’ll take you to your workspace when it’s ready." },
] as const;

const INDUSTRIES = [
  { value: "analytics", label: "Product analytics" },
  { value: "saas", label: "B2B SaaS" },
  { value: "devtools", label: "Developer tools" },
  { value: "fintech", label: "Fintech" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "health", label: "Healthcare" },
  { value: "agency", label: "Marketing agency" },
  { value: "other", label: "Something else" },
];

const BRAND_COLORS = ["#4f46e5", "#2e90fa", "#0f9a9a", "#16b364", "#ff8000", "#e708a4", "#292929"];

const INCLUDED: ModelId[] = ["chatgpt", "perplexity", "aio"];
const MODEL_CARDS: { id: ModelId; blurb: string }[] = [
  { id: "chatgpt", blurb: "The most-used AI assistant" },
  { id: "perplexity", blurb: "Answer engine with inline citations" },
  { id: "aio", blurb: "AI summaries at the top of Google Search" },
  { id: "gemini", blurb: "Google’s conversational assistant" },
  { id: "claude", blurb: "Long-form research and comparisons" },
  { id: "copilot", blurb: "Built into Windows, Edge and Bing" },
];

const PROMPT_LIMIT = 10;
const MAX_COMPETITORS = 8;
const competitorPool = brands.filter((b) => !b.you);

interface CustomPrompt {
  id: string;
  text: string;
  topic: string;
  volume: number;
  custom: true;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function Onboarding() {
  const nav = useNavigate();
  const toast = useToast();
  const loc = useLocation();
  const signupEmail = (loc.state as { email?: string } | null)?.email ?? "maya@lumen.so";

  const [step, setStep] = useState(0);
  const [tried, setTried] = useState(false);

  // 1 · brand
  const [brandName, setBrandName] = useState("Lumen");
  const [domain, setDomain] = useState(signupEmail.split("@")[1] ?? "lumen.so");
  const [industry, setIndustry] = useState("analytics");
  const [color, setColor] = useState(BRAND_COLORS[0]);

  // 2 · competitors
  const [picked, setPicked] = useState<string[]>(["orbit", "tidal", "parcel"]);
  const [customDomains, setCustomDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [domainError, setDomainError] = useState<string | null>(null);

  // 3 · models
  const [models, setModels] = useState<ModelId[]>(INCLUDED);

  // 4 · prompts
  const brandLabel = brandName.trim() || "Lumen";
  const suggested = useMemo(
    () =>
      allPrompts
        .filter((p) => p.status !== "inactive")
        .slice(0, 16)
        .map((p) => ({ id: p.id, text: p.text.replace(/Lumen/g, brandLabel), topic: p.topic, volume: p.volume, custom: false as const })),
    [brandLabel],
  );
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([]);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>(() => allPrompts.slice(0, 8).map((p) => p.id));
  const [newPrompt, setNewPrompt] = useState("");

  const promptList = [...customPrompts, ...suggested];
  const selectedTexts = promptList.filter((p) => selectedPrompts.includes(p.id)).map((p) => p.text);

  // Derived
  const cleanDomain = normalizeDomain(domain);
  const brand: BrandDef = { id: "you", name: brandName.trim(), domain: cleanDomain, color, shape: "bolt" };
  const competitors: PreviewCompetitor[] = [
    ...competitorPool.filter((b) => picked.includes(b.id)).map((b) => ({ key: b.id, name: b.name, domain: b.domain, brand: b })),
    ...customDomains.map((d) => ({ key: d, name: nameFromDomain(d), domain: d })),
  ];
  const industryLabel = INDUSTRIES.find((i) => i.value === industry)?.label;

  const errors = {
    0: !brandName.trim() ? "name" : !DOMAIN_RE.test(cleanDomain) ? "domain" : null,
    1: competitors.length < 2 ? "competitors" : null,
    2: models.length < 1 ? "models" : null,
    3: selectedPrompts.length < 1 ? "prompts" : null,
  } as Record<number, string | null>;

  const next = () => {
    if (step >= 4) return;
    if (errors[step]) {
      setTried(true);
      return;
    }
    setTried(false);
    if (step === 0) setDomain(cleanDomain);
    setStep((s) => s + 1);
  };
  const back = () => {
    setTried(false);
    setStep((s) => Math.max(0, s - 1));
  };

  // Enter anywhere on the page (outside fields/buttons) advances.
  const nextRef = useRef(next);
  nextRef.current = next;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.target === document.body || e.target === document.documentElement)) {
        e.preventDefault();
        nextRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Step 5 · analysing checklist, then hand off to /welcome
  const tasks = [
    { label: `Crawling ${cleanDomain || "your site"}`, detail: "142 pages" },
    { label: `Running ${selectedPrompts.length} prompts on ${models.length} models`, detail: `${selectedPrompts.length * models.length} answers` },
    { label: `Comparing ${competitors.length} competitors`, detail: "share of voice" },
    { label: "Building your dashboard", detail: "almost there" },
  ];
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (step !== 4) return;
    setDone(0);
    const ts: number[] = [];
    for (let i = 0; i < 4; i++) ts.push(window.setTimeout(() => setDone(i + 1), 900 + i * 1100));
    ts.push(
      window.setTimeout(
        () => nav("/welcome", { state: { brand: brand.name, domain: brand.domain, models } }),
        900 + 4 * 1100 + 500,
      ),
    );
    return () => ts.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  /* Handlers ---------------------------------------------------------------- */

  const addCompetitor = () => {
    const d = normalizeDomain(newDomain);
    if (!d) return;
    if (!DOMAIN_RE.test(d)) return setDomainError("Enter a domain like competitor.com");
    if (d === cleanDomain) return setDomainError("That’s your own domain.");
    if (customDomains.includes(d) || competitorPool.some((b) => b.domain === d && picked.includes(b.id))) return setDomainError("Already in your list.");
    if (competitors.length >= MAX_COMPETITORS) return setDomainError(`You can track up to ${MAX_COMPETITORS} competitors on Pro.`);
    const known = competitorPool.find((b) => b.domain === d);
    if (known) setPicked((p) => [...p, known.id]);
    else setCustomDomains((c) => [...c, d]);
    setNewDomain("");
    setDomainError(null);
  };

  const toggleCompetitor = (id: string) => {
    if (picked.includes(id)) return setPicked((p) => p.filter((x) => x !== id));
    if (competitors.length >= MAX_COMPETITORS) return toast({ tone: "warning", title: `Up to ${MAX_COMPETITORS} competitors on Pro`, description: "Remove one to add another." });
    setPicked((p) => [...p, id]);
  };

  const toggleModel = (id: ModelId) => {
    if (!INCLUDED.includes(id)) {
      toast({ tone: "info", title: `${MODELS[id].name} is on the Scale plan`, description: "Upgrade from Settings → Billing to track more answer engines." });
      return;
    }
    setModels((m) => (m.includes(id) ? m.filter((x) => x !== id) : INCLUDED.filter((x) => x === id || m.includes(x))));
  };

  const togglePrompt = (id: string) =>
    setSelectedPrompts((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= PROMPT_LIMIT ? s : [...s, id]));

  const addPrompt = () => {
    const text = newPrompt.trim();
    if (text.length < 8) return;
    const id = `c${Date.now()}`;
    setCustomPrompts((c) => [{ id, text, topic: "Custom", volume: 0, custom: true }, ...c]);
    if (selectedPrompts.length < PROMPT_LIMIT) setSelectedPrompts((s) => [...s, id]);
    else toast({ tone: "warning", title: "Prompt added, not selected", description: `You’re at ${PROMPT_LIMIT} prompts. Deselect one to track it.` });
    setNewPrompt("");
  };

  const enterTo = (fn: () => void) => (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fn();
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    next();
  };

  /* Render ------------------------------------------------------------------ */

  const s = STEPS[step];

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      {/* Slim top bar */}
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-4 border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6">
        <SonyaLogo size={24} />
        <div className="flex flex-1 items-center justify-center gap-3">
          <span className="t-num-sm-medium text-ink">
            Step {step + 1}/{STEPS.length}
          </span>
          <Progress value={step + 1} max={STEPS.length} className="w-20 sm:w-40" />
          <span className="hidden t-caption text-ink-2 sm:inline">{s.name}</span>
        </div>
        <Button variant="link" tone="secondary" size="xs" onClick={() => nav("/welcome")} disabled={step === 4}>
          Skip
        </Button>
      </header>

      <main className="grid flex-1 lg:grid-cols-2">
        {/* Form column */}
        <div className="flex flex-col px-5 py-8 sm:px-10 lg:py-14">
          <form noValidate onSubmit={submit} className="mx-auto flex w-full max-w-[500px] flex-1 flex-col">
            <div key={step} className="flex-1 animate-[sy-pop-in_260ms_var(--ease-out)]">
              <p className="t-caption-medium text-ink-3">
                Step {step + 1} · {s.name}
              </p>
              <h1 className="mt-2 t-display text-ink">{s.title}</h1>
              <p className="mt-2 max-w-[440px] t-body text-ink-2">{s.description}</p>

              <div className="mt-8">
                {step === 0 && (
                  <div className="flex flex-col gap-5">
                    <Field label="Brand name" error={tried && errors[0] === "name" ? "Enter your brand name." : undefined}>
                      <Input
                        size="md"
                        autoFocus
                        aria-label="Brand name"
                        placeholder="Lumen"
                        value={brandName}
                        invalid={tried && errors[0] === "name"}
                        onChange={(e) => setBrandName(e.target.value)}
                        iconLeft={<span className="block size-4 rounded-[5px] shadow-[inset_0_-1px_0_rgb(0_0_0/0.14)] transition-colors" style={{ background: color }} />}
                      />
                    </Field>
                    <Field
                      label="Website"
                      hint={`Detected from ${signupEmail}`}
                      error={tried && errors[0] === "domain" ? "Enter a domain like lumen.so" : undefined}
                    >
                      <Input
                        size="md"
                        aria-label="Website domain"
                        placeholder="lumen.so"
                        value={domain}
                        invalid={tried && errors[0] === "domain"}
                        onChange={(e) => setDomain(e.target.value)}
                        onBlur={() => setDomain(normalizeDomain(domain))}
                        iconLeft={DOMAIN_RE.test(cleanDomain) ? <DomainMark domain={cleanDomain} size={16} /> : <Globe />}
                        trailing={DOMAIN_RE.test(cleanDomain) ? <CheckCircle weight="fill" className="size-4 text-[var(--status-success)]" /> : undefined}
                      />
                    </Field>
                    <Field label="Industry" hint="Helps us suggest prompts and competitors.">
                      <div className="[&>div]:flex [&>div]:w-full">
                        <Select
                          label="Industry"
                          value={industry}
                          onChange={setIndustry}
                          options={INDUSTRIES}
                          className="!h-10 w-full !rounded-[10px] !px-3 [&>span.truncate]:flex-1 [&>span.truncate]:text-left"
                        />
                      </div>
                    </Field>
                    <Field label="Brand colour" hint="Used for your mark in charts and reports.">
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Brand colour">
                        {BRAND_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            role="radio"
                            aria-checked={color === c}
                            aria-label={c}
                            onClick={() => setColor(c)}
                            className={cn(
                              "grid size-8 place-items-center rounded-full transition-[box-shadow,transform] duration-150 active:scale-95",
                              color === c ? "shadow-[0_0_0_2px_var(--bg-surface),0_0_0_3.5px_var(--text-primary)]" : "shadow-control-soft hover:scale-105",
                            )}
                            style={{ background: c }}
                          >
                            {color === c && <Check weight="bold" className="size-3.5 text-white" />}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>
                )}

                {step === 1 && (
                  <div className="flex flex-col gap-6">
                    <div>
                      <div className="mb-2.5 flex items-center justify-between">
                        <span className="t-caption-medium text-ink">Suggested for {industryLabel?.toLowerCase() ?? "you"}</span>
                        <span className={cn("t-num-sm", competitors.length < 2 ? "text-warning" : "text-ink-3")}>
                          {competitors.length} selected · min 2
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {competitorPool.map((b) => {
                          const on = picked.includes(b.id);
                          return (
                            <ChoiceChip key={b.id} selected={on} onClick={() => toggleCompetitor(b.id)} icon={<BrandMark brand={b} size={18} />} className="!h-9 !pl-2">
                              {b.name}
                              <span className="t-caption text-ink-3">{b.domain}</span>
                              <span className={cn("grid size-4 place-items-center rounded-full transition-colors", on ? "bg-primary text-on-primary" : "text-ink-3")}>
                                {on ? <Check weight="bold" className="size-2.5" /> : <Plus weight="bold" className="size-3" />}
                              </span>
                            </ChoiceChip>
                          );
                        })}
                      </div>
                    </div>

                    <Field label="Add by domain" error={domainError ?? (tried && errors[1] ? "Select at least 2 competitors to continue." : undefined)}>
                      <div className="flex gap-2">
                        <Input
                          size="md"
                          wrapperClassName="flex-1"
                          aria-label="Competitor domain"
                          placeholder="competitor.com"
                          iconLeft={<Globe />}
                          value={newDomain}
                          invalid={!!domainError}
                          onChange={(e) => {
                            setNewDomain(e.target.value);
                            setDomainError(null);
                          }}
                          onKeyDown={enterTo(addCompetitor)}
                        />
                        <Button variant="outlined" size="md" iconLeft={<Plus className="size-4" />} onClick={addCompetitor} disabled={!newDomain.trim()}>
                          Add
                        </Button>
                      </div>
                    </Field>

                    {customDomains.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {customDomains.map((d) => (
                          <span key={d} className="inline-flex h-9 items-center gap-2 rounded-lg bg-surface pl-2 pr-1 t-label text-ink shadow-[0_0_0_1.5px_var(--text-primary),0_1px_2px_rgb(40_40_40/0.08)] animate-[sy-pop-in_200ms_var(--ease-out)]">
                            <DomainMark domain={d} size={18} />
                            {nameFromDomain(d)}
                            <span className="t-caption text-ink-3">{d}</span>
                            <button
                              type="button"
                              aria-label={`Remove ${d}`}
                              onClick={() => setCustomDomains((c) => c.filter((x) => x !== d))}
                              className="grid size-6 place-items-center rounded-md text-icon-subtle transition-colors hover:bg-subtle hover:text-ink"
                            >
                              <X className="size-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="t-caption-medium text-ink">Included in Pro</span>
                      <span className="t-num-sm text-ink-3">
                        {models.length} of {INCLUDED.length} selected
                      </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {MODEL_CARDS.map(({ id, blurb }) => {
                        const locked = !INCLUDED.includes(id);
                        const on = models.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggleModel(id)}
                            className={cn(
                              "group flex items-center gap-3 rounded-xl bg-surface p-3 text-left transition-[box-shadow,background-color,transform] duration-150 active:scale-[0.99]",
                              on ? "shadow-[0_0_0_1.5px_var(--text-primary),0_1px_2px_rgb(40_40_40/0.08)]" : "shadow-control hover:bg-canvas",
                            )}
                          >
                            <ModelMark id={id} size={32} className={cn("rounded-full transition-opacity", locked && "opacity-60")} />
                            <span className="min-w-0 flex-1">
                              <span className={cn("block t-body-medium", locked ? "text-ink-2" : "text-ink")}>{MODELS[id].name}</span>
                              <span className="block truncate t-caption text-ink-3">{blurb}</span>
                            </span>
                            {locked ? (
                              <Badge tone="purple">
                                <Lock weight="bold" className="size-2.5" />
                                Scale
                              </Badge>
                            ) : (
                              <span
                                className={cn(
                                  "grid size-[18px] shrink-0 place-items-center rounded-full transition-colors",
                                  on ? "bg-primary text-on-primary shadow-button-primary" : "bg-surface shadow-control",
                                )}
                              >
                                {on && <Check weight="bold" className="size-2.5" />}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {tried && errors[2] && <span className="t-caption text-danger">Choose at least one model.</span>}
                  </div>
                )}

                {step === 3 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className="t-caption-medium text-ink">
                        <span className="t-num-sm-medium">{selectedPrompts.length}</span> of {PROMPT_LIMIT} selected
                      </span>
                      <Progress value={selectedPrompts.length} max={PROMPT_LIMIT} tone={selectedPrompts.length >= PROMPT_LIMIT ? "orange" : "blue"} className="w-24" />
                      <span className="flex-1" />
                      <button
                        type="button"
                        onClick={() => setSelectedPrompts(selectedPrompts.length ? [] : promptList.slice(0, PROMPT_LIMIT).map((p) => p.id))}
                        className="t-caption-medium text-ink-2 transition-colors hover:text-ink"
                      >
                        {selectedPrompts.length ? "Clear" : `Select top ${PROMPT_LIMIT}`}
                      </button>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto rounded-xl bg-surface p-1 shadow-card">
                      {promptList.map((p) => {
                        const on = selectedPrompts.includes(p.id);
                        const full = !on && selectedPrompts.length >= PROMPT_LIMIT;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            role="checkbox"
                            aria-checked={on}
                            disabled={full}
                            title={full ? `Deselect a prompt to add another (max ${PROMPT_LIMIT})` : undefined}
                            onClick={() => togglePrompt(p.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors",
                              full ? "opacity-45" : "hover:bg-canvas",
                            )}
                          >
                            <span
                              className={cn(
                                "grid size-4 shrink-0 place-items-center rounded-[5px] transition-colors duration-100",
                                on ? "bg-primary text-on-primary shadow-button-primary" : "bg-surface shadow-control",
                              )}
                            >
                              {on && <Check weight="bold" className="size-2.5" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate t-body text-ink">{p.text}</span>
                              <span className="mt-0.5 block t-caption text-ink-3">{p.topic}</span>
                            </span>
                            {p.custom ? <Badge tone="blue">Custom</Badge> : <LevelBars level={p.volume} tone="blue" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        size="md"
                        wrapperClassName="flex-1"
                        aria-label="Custom prompt"
                        placeholder="Add your own, e.g. “Best analytics for Shopify stores”"
                        iconLeft={<Sparkle />}
                        value={newPrompt}
                        onChange={(e) => setNewPrompt(e.target.value)}
                        onKeyDown={enterTo(addPrompt)}
                      />
                      <Button variant="outlined" size="md" iconLeft={<Plus className="size-4" />} onClick={addPrompt} disabled={newPrompt.trim().length < 8}>
                        Add
                      </Button>
                    </div>
                    {tried && errors[3] && <span className="t-caption text-danger">Select at least one prompt.</span>}
                  </div>
                )}

                {step === 4 && (
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                      <Progress value={done} max={tasks.length} tone="blue" className="flex-1" />
                      <span className="w-10 text-right t-num-sm-medium text-ink">{Math.round((done / tasks.length) * 100)}%</span>
                    </div>
                    <ul className="flex flex-col gap-1 rounded-xl bg-canvas p-1.5 shadow-card">
                      {tasks.map((t, i) => {
                        const state = i < done ? "done" : i === done ? "running" : "pending";
                        return (
                          <li
                            key={t.label}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-3 transition-[background-color,box-shadow] duration-300",
                              state === "running" && "bg-surface shadow-card",
                            )}
                          >
                            <TaskIcon state={state} />
                            <span className={cn("flex-1 t-body-medium transition-colors", state === "pending" ? "text-ink-3" : "text-ink")}>{t.label}</span>
                            <span className={cn("t-caption transition-opacity duration-300", state === "pending" ? "opacity-0" : "text-ink-3")}>
                              {state === "done" ? t.detail : "…"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="t-caption text-ink-3">Tip: you can add more prompts and competitors any time from the Prompts page.</p>
                  </div>
                )}
              </div>
            </div>

            {step < 4 && (
              <div className="mt-10 flex items-center gap-2 border-t border-line pt-5">
                {step > 0 && (
                  <Button tone="secondary" variant="outlined" size="md" iconLeft={<ArrowLeft className="size-4" />} onClick={back}>
                    Back
                  </Button>
                )}
                <span className="flex-1" />
                <span className="hidden items-center gap-1.5 t-caption text-ink-3 sm:inline-flex">
                  Press <Kbd>↵</Kbd>
                </span>
                <Button type="submit" size="md" disabled={step === 1 && competitors.length < 2} iconRight={<ArrowRight className="size-4" />}>
                  {step === 3 ? "Start analysis" : "Continue"}
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Live preview */}
        <aside className="hidden p-3 pl-0 lg:block">
          <div className="sticky top-[68px] grid h-[calc(100dvh-80px)] place-items-center overflow-hidden rounded-[20px] bg-canvas p-10 shadow-inner-ring">
            <DotField size={18} />
            <div className="relative flex w-full justify-center">
              <OnboardingPreview
                step={step}
                brand={brand}
                industry={industryLabel}
                competitors={competitors}
                models={models}
                prompts={selectedTexts}
                analysing={step === 4}
              />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function TaskIcon({ state }: { state: "done" | "running" | "pending" }) {
  if (state === "done") return <CheckCircle weight="fill" className="size-5 shrink-0 text-[var(--status-success)] animate-[sy-pop-in_200ms_var(--ease-out)]" />;
  if (state === "running") return <Spinner className="size-5 shrink-0 text-[var(--blue-500)]" />;
  return <Circle className="size-5 shrink-0 text-[var(--icon-disabled)]" weight="regular" />;
}

function nameFromDomain(d: string) {
  const base = d.split(".")[0] ?? d;
  return base.charAt(0).toUpperCase() + base.slice(1);
}
