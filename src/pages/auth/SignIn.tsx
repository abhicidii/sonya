import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, EnvelopeSimple, LockSimple } from "@phosphor-icons/react";
import { Button, Checkbox, Dialog, Field, Input, useToast } from "@/components/ui";
import { AuthLayout, AuthLink, EMAIL_RE, GoogleGlyph, OrDivider, PasswordInput, useDelayed } from "./AuthShell";

export default function SignIn() {
  const nav = useNavigate();
  const toast = useToast();
  const later = useDelayed();
  const emailRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState<null | "email" | "google">(null);
  const [resetOpen, setResetOpen] = useState(false);

  const emailError = !email.trim() ? "Enter your work email." : !EMAIL_RE.test(email.trim()) ? "That doesn’t look like an email — try name@company.com." : null;
  const passwordError = !password ? "Enter your password." : null;
  const showEmailError = (submitted || (touched && email.length > 0)) && emailError;
  const showPasswordError = submitted && passwordError;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (emailError) return emailRef.current?.focus();
    if (passwordError) return pwRef.current?.focus();
    setLoading("email");
    later(() => nav("/insights/visibility"), 900);
  };

  const google = () => {
    setLoading("google");
    later(() => nav("/insights/visibility"), 900);
  };

  return (
    <AuthLayout
      topRight={
        <span className="flex items-center gap-1.5">
          <span className="hidden sm:inline">New to Sonya?</span> <AuthLink to="/signup">Create an account</AuthLink>
        </span>
      }
      headline="See exactly how AI answers talk about your brand."
      sub="Track visibility, share of voice and citations across ChatGPT, Perplexity, AI Overviews and more — in one calm dashboard."
    >
      <div className="animate-[sy-pop-in_300ms_var(--ease-out)]">
        <h1 className="t-display text-ink">Welcome back</h1>
        <p className="mt-2 t-body text-ink-2">Sign in to your Sonya workspace.</p>

        <form noValidate onSubmit={submit} className="mt-8 flex flex-col gap-4">
          <Field label="Work email" error={showEmailError || undefined}>
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
              invalid={!!showEmailError}
              aria-invalid={!!showEmailError}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
            />
          </Field>

          <Field
            label="Password"
            error={showPasswordError || undefined}
            aside={
              <button type="button" onClick={() => setResetOpen(true)} className="t-caption-medium text-ink-2 transition-colors hover:text-ink">
                Forgot password?
              </button>
            }
          >
            <PasswordInput
              ref={pwRef}
              size="md"
              aria-label="Password"
              autoComplete="current-password"
              placeholder="Your password"
              iconLeft={<LockSimple />}
              value={password}
              invalid={!!showPasswordError}
              aria-invalid={!!showPasswordError}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <Checkbox checked={remember} onChange={setRemember} label={<span className="t-caption text-ink-2">Keep me signed in for 30 days</span>} />

          <Button type="submit" size="md" className="mt-1 w-full" loading={loading === "email"} disabled={loading !== null} iconRight={loading ? undefined : <ArrowRight className="size-4" />}>
            {loading === "email" ? "Signing in…" : "Sign in"}
          </Button>

          <OrDivider />

          <Button
            tone="primary"
            variant="outlined"
            size="md"
            className="w-full"
            onClick={google}
            loading={loading === "google"}
            disabled={loading !== null}
            iconLeft={loading === "google" ? undefined : <GoogleGlyph />}
          >
            Continue with Google
          </Button>
        </form>

        <p className="mt-8 t-caption text-ink-2">
          Don’t have an account? <AuthLink to="/signup">Start a 14-day free trial</AuthLink>
        </p>
      </div>

      <ResetDialog
        open={resetOpen}
        initialEmail={email}
        onClose={() => setResetOpen(false)}
        onSent={(to) => {
          setResetOpen(false);
          toast({ title: "Reset link sent", description: `Check ${to} — the link expires in 30 minutes.` });
        }}
      />
    </AuthLayout>
  );
}

function ResetDialog({ open, initialEmail, onClose, onSent }: { open: boolean; initialEmail: string; onClose: () => void; onSent: (email: string) => void }) {
  return open ? <ResetDialogInner initialEmail={initialEmail} onClose={onClose} onSent={onSent} /> : null;
}

/** Mounted only while open so the field starts from the email typed on the form. */
function ResetDialogInner({ initialEmail, onClose, onSent }: { initialEmail: string; onClose: () => void; onSent: (email: string) => void }) {
  const later = useDelayed();
  const [value, setValue] = useState(initialEmail);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const invalid = !EMAIL_RE.test(value.trim());
  const send = (e?: FormEvent) => {
    e?.preventDefault();
    setTried(true);
    if (invalid) return;
    setSending(true);
    later(() => onSent(value.trim()), 700);
  };
  return (
    <Dialog
      open
      onClose={onClose}
      size="sm"
      title="Reset your password"
      description="We’ll email you a secure link to choose a new password."
      footer={
        <>
          <Button tone="secondary" variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => send()} loading={sending}>
            Send reset link
          </Button>
        </>
      }
    >
      <form noValidate onSubmit={send} className="p-5">
        <Field label="Work email" error={tried && invalid ? "Enter the email you sign in with." : undefined}>
          <Input
            size="md"
            type="email"
            aria-label="Work email"
            autoFocus
            placeholder="maya@lumen.so"
            iconLeft={<EnvelopeSimple />}
            value={value}
            invalid={tried && invalid}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>
      </form>
    </Dialog>
  );
}
