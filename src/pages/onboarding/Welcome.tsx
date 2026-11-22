import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import { Button, ModelMark, MODELS, SonyaLogo, type ModelId } from "@/components/ui";

/**
 * Post-onboarding welcome — mirrors Searchable's "Welcome to Searchable" screen:
 * logo, trial line, included models as outlined chips, one wide primary CTA, trial note, footer.
 */
export default function Welcome() {
  const nav = useNavigate();
  const state = (useLocation().state ?? {}) as { brand?: string; models?: ModelId[] };
  const models = state.models?.length ? state.models : (["chatgpt", "perplexity", "aio"] as ModelId[]);
  const brand = state.brand || "Lumen";

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-surface">
      {/* Dot-matrix backdrop — fades out from the centre */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_42%,black_10%,transparent_80%)]"
        style={{ backgroundImage: "radial-gradient(var(--border-strong) 1.1px, transparent 1.3px)", backgroundSize: "14px 14px" }}
      />
      {/* Soft halo behind the card so the copy stays readable over the dots */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[42%] size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--bg-surface)_35%,transparent_70%)]"
      />

      <main className="relative flex flex-1 items-center justify-center px-5 py-16">
        <div className="flex w-full max-w-[420px] flex-col items-center text-center">
          <div className="animate-[sy-pop-in_400ms_var(--ease-out)_both] rounded-[20px] bg-canvas p-2 shadow-card">
            <SonyaLogo size={48} wordmark={false} />
          </div>

          <h1 className="mt-7 animate-[sy-pop-in_400ms_60ms_var(--ease-out)_both] text-[28px] font-medium leading-[1.15] tracking-[-0.03em] text-ink">
            Welcome to Sonya
          </h1>
          <p className="mt-3 max-w-[360px] animate-[sy-pop-in_400ms_120ms_var(--ease-out)_both] t-body text-ink-2 [text-wrap:balance]">
            Enjoy a free 14-day trial of our Pro plan, with everything you need to see how AI answers talk about {brand}.
          </p>

          <section className="mt-9 flex w-full animate-[sy-pop-in_400ms_180ms_var(--ease-out)_both] flex-col items-center gap-3">
            <h2 className="t-caption-medium text-ink-3">Your included models</h2>
            <ul className="flex flex-wrap justify-center gap-2">
              {models.map((m) => (
                <li
                  key={m}
                  className="inline-flex h-8 items-center gap-2 rounded-full bg-surface pl-1 pr-3 t-label text-ink shadow-control"
                >
                  <ModelMark id={m} size={22} className="rounded-full" />
                  {MODELS[m].name}
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-10 w-full animate-[sy-pop-in_400ms_240ms_var(--ease-out)_both]">
            <Button size="md" autoFocus className="w-full" iconRight={<ArrowRight className="size-4" />} onClick={() => nav("/prompts")}>
              Continue to Prompts
            </Button>
            <p className="mx-auto mt-4 max-w-[340px] t-caption text-ink-3 [text-wrap:balance]">
              After your trial ends, you can continue with your Pro plan or choose a different one.
            </p>
          </div>
        </div>
      </main>

      <footer className="relative pb-6 text-center t-caption text-ink-3">© 2026 Sonya</footer>
    </div>
  );
}
