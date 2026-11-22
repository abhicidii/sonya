import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, EnvelopeSimple, LockSimple, User, X } from "@phosphor-icons/react";
import { Button, Field, Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import { AuthLayout, AuthLink, EMAIL_RE, FREE_MAIL, GoogleGlyph, OrDivider, PasswordInput, useDelayed } from "./AuthShell";

type Step = "email" | "details";

export default function SignUp() {
  const nav = useNavigate();
  const later = useDelayed();
  const emailRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [tried, setTried] = useState({ email: false, details: false });
  const [loading, setLoading] = useState<null | "email" | "google" | "create">(null);

  const domain = email.trim().split("@")[1]?.toLowerCase() ?? "";
  const emailError = !email.trim()
    ? "Enter your work email."
    : !EMAIL_RE.test(email.trim())
      ? "That doesn’t look like an email — try name@company.com."
      : FREE_MAIL.includes(domain)
        ? "Use your work email so we can detect your brand and domain."
        : null;

  const checks = [
    { label: "At least 10 characters", ok: password.length >= 10 },
    { label: "Contains a number", ok: /\d/.test(password) },
  ];
  const strength = checks.filter((c) => c.ok).length + (password.length >= 14 && /[^A-Za-z0-9]/.test(password) ? 1 : 0);
  const nameError = !name.trim() ? "Tell us what to call you." : null;

  const submitEmail = (e: FormEvent) => {
    e.preventDefault();
    setTried((t) => ({ ...t, email: true }));
    if (emailError) return emailRef.current?.focus();
    setLoading("email");
    later(() => {
      setLoading(null);
      const local = email.trim().split("@")[0].split(/[._-]/)[0] ?? "";
      if (!name) setName(local ? local[0].toUpperCase() + local.slice(1) : "");
      setStep("details");
      later(() => (local ? pwRef.current?.focus() : nameRef.current?.focus()), 30);
    }, 600);
  };

  const submitDetails = (e: FormEvent) => {
    e.preventDefault();
    setTried((t) => ({ ...t, details: true }));
    if (nameError) return nameRef.current?.focus();
    if (!checks.every((c) => c.ok)) return pwRef.current?.focus();
    setLoading("create");
    later(() => nav("/onboarding", { state: { email: email.trim(), name: name.trim() } }), 900);
  };

  return (
    <AuthLayout
      topRight={
        <span className="flex items-center gap-1.5">
          <span className="hidden sm:inline">Already have an account?</span> <AuthLink to="/signin">Sign in</AuthLink>
        </span>
      }
      headline="Find out what AI says about you — in about two minutes."
      sub="Add your brand, pick competitors and prompts. Sonya runs them across every major AI model and shows where you’re missing."
    >
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex gap-1">
          {(["email", "details"] as Step[]).map((s, i) => (
            <span
              key={s}
              className={cn("h-1 w-8 rounded-full transition-colors duration-300", i <= (step === "email" ? 0 : 1) ? "bg-[var(--text-primary)]" : "bg-subtle")}
            />
          ))}
        </div>
        <span className="t-num-sm text-ink-3">Step {step === "email" ? 1 : 2} of 2</span>
      </div>

      {step === "email" ? (
        <div key="email" className="animate-[sy-pop-in_300ms_var(--ease-out)]">
          <h1 className="t-display text-ink">Create your account</h1>
          <p className="mt-2 t-body text-ink-2">Start a 14-day free trial of Sonya Pro. No credit card required.</p>

          <form noValidate onSubmit={submitEmail} className="mt-8 flex flex-col gap-4">
            <Field label="Work email" hint="We’ll use your domain to find your brand." error={(tried.email && emailError) || undefined}>
              <Input
                ref={emailRef}
                size="md"
                type="email"
                aria-label="Work email"
                autoComplete="email"
                autoFocus
                placeholder="maya@lumen.so"
                iconLeft={<EnvelopeSimple />}
                value={email}
                invalid={tried.email && !!emailError}
                aria-invalid={tried.email && !!emailError}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Button type="submit" size="md" className="w-full" loading={loading === "email"} disabled={loading !== null} iconRight={loading ? undefined : <ArrowRight className="size-4" />}>
              Continue with email
            </Button>
            <OrDivider />
            <Button
              variant="outlined"
              size="md"
              className="w-full"
              loading={loading === "google"}
              disabled={loading !== null}
              iconLeft={loading === "google" ? undefined : <GoogleGlyph />}
              onClick={() => {
                setLoading("google");
                later(() => nav("/onboarding"), 900);
              }}
            >
              Continue with Google
            </Button>
          </form>
        </div>
      ) : (
        <div key="details" className="animate-[sy-pop-in_300ms_var(--ease-out)]">
          <button
            type="button"
            onClick={() => setStep("email")}
            className="-ml-1 mb-4 inline-flex h-7 items-center gap-1.5 rounded-md px-1.5 t-caption-medium text-ink-2 transition-colors hover:bg-subtle hover:text-ink"
          >
            <ArrowLeft className="size-3.5" />
            {email.trim()}
            <span className="text-ink-3">· Change</span>
          </button>
          <h1 className="t-display text-ink">Set up your login</h1>
          <p className="mt-2 t-body text-ink-2">Almost there — this is how you’ll sign in to Sonya.</p>

          <form noValidate onSubmit={submitDetails} className="mt-8 flex flex-col gap-4">
            <Field label="Full name" error={(tried.details && nameError) || undefined}>
              <Input
                ref={nameRef}
                size="md"
                aria-label="Full name"
                autoComplete="name"
                placeholder="Maya Chen"
                iconLeft={<User />}
                value={name}
                invalid={tried.details && !!nameError}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Field label="Password">
              <PasswordInput
                ref={pwRef}
                size="md"
                aria-label="Password"
                autoComplete="new-password"
                placeholder="Create a password"
                iconLeft={<LockSimple />}
                value={password}
                invalid={tried.details && !checks.every((c) => c.ok)}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            {/* Strength */}
            <div className="-mt-1 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="h-1 flex-1 rounded-full transition-colors duration-200"
                      style={{
                        background:
                          i <= strength
                            ? strength === 1
                              ? "var(--status-danger)"
                              : strength === 2
                                ? "var(--status-warning)"
                                : "var(--status-success)"
                            : "var(--bg-subtle)",
                      }}
                    />
                  ))}
                </div>
                <span className="w-12 text-right t-caption-medium text-ink-2">{password ? ["Weak", "Weak", "Good", "Strong"][strength] : ""}</span>
              </div>
              <ul className="flex flex-col gap-1.5" aria-live="polite">
                {checks.map((c) => {
                  const failed = tried.details && !c.ok;
                  return (
                    <li key={c.label} className={cn("flex items-center gap-2 t-caption transition-colors", c.ok ? "text-ink" : failed ? "text-danger" : "text-ink-3")}>
                      <span
                        className={cn(
                          "grid size-4 place-items-center rounded-full transition-colors duration-150",
                          c.ok ? "bg-success-subtle text-success" : failed ? "bg-danger-subtle text-danger" : "bg-subtle text-ink-3",
                        )}
                      >
                        {failed ? <X weight="bold" className="size-2.5" /> : <Check weight="bold" className="size-2.5" />}
                      </span>
                      {c.label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <Button type="submit" size="md" className="mt-2 w-full" loading={loading === "create"} disabled={loading !== null}>
              {loading === "create" ? "Creating your workspace…" : "Create account"}
            </Button>
            <p className="t-caption text-ink-3">
              By creating an account you agree to Sonya’s Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      )}

      <p className="mt-8 t-caption text-ink-2">
        Already using Sonya? <AuthLink to="/signin">Sign in</AuthLink>
      </p>
    </AuthLayout>
  );
}
