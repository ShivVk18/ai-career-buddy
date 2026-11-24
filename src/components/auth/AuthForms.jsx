"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, signInWithPassword, requestPasswordReset, resetPassword } from "@/actions/Auth";
import { getUserOnboardingStatus } from "@/actions/User";
import { safeNext } from "./safeNext";

const PRIMARY = "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-ink-foreground outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";
const LINK = "font-medium text-brand-ink underline underline-offset-4";

/** Hard navigation so the fresh session cookie is used everywhere. Onboarding first if needed, else the safe destination. */
async function goAfterSignIn(next) {
  let dest = safeNext(next) || "/dashboard";
  try {
    const { isOnboarded } = await getUserOnboardingStatus();
    if (!isOnboarded) dest = "/onboarding";
  } catch {
    // fall through to the destination; the app gate handles onboarding
  }
  window.location.assign(dest);
}

function ErrorLine({ id, children, errorRef }) {
  if (!children) return null;
  return (
    <p id={id} ref={errorRef} role="alert" tabIndex={-1} className="rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger outline-none">
      {children}
    </p>
  );
}

function Field({ label, hint, children, id }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">{label}</Label>
      {children}
      {hint}
    </div>
  );
}

function PasswordInput({ id, value, onChange, autoComplete, describedBy, invalid, autoFocus }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={shown ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        required
        maxLength={72}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className="pr-12"
      />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? "hide password" : "show password"}
        aria-pressed={shown}
        className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-muted outline-none hover:text-text focus-visible:ring-2 focus-visible:ring-ring"
      >
        {shown ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

function strength(pw) {
  if (!pw) return { label: "use 8 to 72 characters.", tone: "text-muted" };
  if (pw.length < 8) return { label: `${8 - pw.length} more to go. 8 characters minimum.`, tone: "text-muted" };
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (pw.length >= 14 || (pw.length >= 10 && kinds >= 3)) return { label: "strong. nice.", tone: "text-success" };
  if (pw.length >= 10 || kinds >= 3) return { label: "good. longer is stronger.", tone: "text-text" };
  return { label: "ok. try a longer phrase or mix in numbers.", tone: "text-text" };
}

function Submit({ busy, children, busyText }) {
  return (
    <button type="submit" disabled={busy} className={PRIMARY}>
      {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {busy ? busyText : children}
    </button>
  );
}

function useFormError() {
  const [error, setError] = useState("");
  const errorRef = useRef(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  return [error, setError, errorRef];
}

export function SignInForm({ next }) {
  const uid = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError, errorRef] = useFormError();

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await signInWithPassword({ email, password });
      if (res?.success) return await goAfterSignIn(next);
      setError(res?.code === "INVALID" ? "enter your email and password." : "email or password is incorrect. if you've tried a lot of times, wait a few minutes and try again.");
    } catch {
      setError("we couldn't reach the server. check your connection and try again.");
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="rounded-lg bg-soft px-3 py-2 text-xs text-muted">had an account before? use forgot password to set one.</p>
      <ErrorLine id={`${uid}-err`} errorRef={errorRef}>{error}</ErrorLine>
      <Field id={`${uid}-email`} label="email">
        <Input id={`${uid}-email`} type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus required maxLength={254} />
      </Field>
      <Field id={`${uid}-pw`} label="password">
        <PasswordInput id={`${uid}-pw`} value={password} onChange={setPassword} autoComplete="current-password" />
      </Field>
      <div className="text-right text-sm">
        <Link href="/forgot-password" className={LINK}>forgot password?</Link>
      </div>
      <Submit busy={busy} busyText="signing in...">sign in</Submit>
    </form>
  );
}

export function SignUpForm({ next }) {
  const uid = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError, errorRef] = useFormError();
  const hint = strength(password);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) return setError("use at least 8 characters for your password.");
    setBusy(true);
    setError("");
    try {
      const res = await signUp({ name: name.trim() || undefined, email, password });
      if (res?.error) {
        setError(res.error);
      } else {
        const signedIn = await signInWithPassword({ email, password });
        if (signedIn?.success) return await goAfterSignIn(next);
        // An existing email never gets attached: the server emailed a set-password link instead.
        setNotice(res?.message || "check your email. if you already have an account, we sent a link to set your password.");
      }
    } catch {
      setError("we couldn't reach the server. check your connection and try again.");
    }
    setBusy(false);
  };

  if (notice) {
    return (
      <div role="status" className="space-y-4">
        <p className="rounded-lg bg-soft px-3 py-3 text-sm text-text">{notice}</p>
        <p className="text-sm text-muted">no email in a few minutes? check spam, or <Link href="/sign-in" className={LINK}>try signing in</Link>.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorLine id={`${uid}-err`} errorRef={errorRef}>{error}</ErrorLine>
      <Field id={`${uid}-name`} label="name (optional)">
        <Input id={`${uid}-name`} name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" autoFocus maxLength={100} />
      </Field>
      <Field id={`${uid}-email`} label="email">
        <Input id={`${uid}-email`} type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required maxLength={254} />
      </Field>
      <Field
        id={`${uid}-pw`}
        label="password"
        hint={<p id={`${uid}-hint`} className={`text-xs ${hint.tone}`} aria-live="polite">{hint.label}</p>}
      >
        <PasswordInput id={`${uid}-pw`} value={password} onChange={setPassword} autoComplete="new-password" describedBy={`${uid}-hint`} />
      </Field>
      <Submit busy={busy} busyText="creating your account...">create account</Submit>
    </form>
  );
}

export function ForgotForm() {
  const uid = useId();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError, errorRef] = useFormError();
  const doneRef = useRef(null);
  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await requestPasswordReset({ email });
      if (res?.error) setError(res.error);
      else setDone(true);
    } catch {
      setError("we couldn't reach the server. check your connection and try again.");
    }
    setBusy(false);
  };

  if (done) {
    return (
      <div className="space-y-4">
        <p ref={doneRef} tabIndex={-1} role="status" className="rounded-lg bg-soft px-3 py-3 text-sm text-text outline-none">
          if that email has an account, a link is on its way. it works once and expires in 30 minutes.
        </p>
        <Link href="/sign-in" className="btn-pill-secondary min-h-11 w-full text-sm">back to sign in</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorLine id={`${uid}-err`} errorRef={errorRef}>{error}</ErrorLine>
      <Field id={`${uid}-email`} label="email">
        <Input id={`${uid}-email`} type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus required maxLength={254} />
      </Field>
      <Submit busy={busy} busyText="sending...">send link</Submit>
    </form>
  );
}

export function ResetForm({ token }) {
  const uid = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError, errorRef] = useFormError();
  const [dead, setDead] = useState(!token);
  const hint = strength(password);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) return setError("use at least 8 characters for your password.");
    setBusy(true);
    setError("");
    try {
      const res = await resetPassword({ token, password });
      if (res?.error) {
        if (res.code === "INVALID_TOKEN") setDead(true);
        else setError(res.error);
      } else {
        // The link doesn't carry the email, so the form asks for it to sign in right after.
        const signedIn = await signInWithPassword({ email, password });
        if (signedIn?.success) return await goAfterSignIn(null);
        setError("your password is set, but that email didn't match the account. sign in from the sign-in page.");
      }
    } catch {
      setError("we couldn't reach the server. check your connection and try again.");
    }
    setBusy(false);
  };

  if (dead) {
    return (
      <div role="alert" className="space-y-4">
        <p className="rounded-lg border border-danger/40 bg-danger/5 px-3 py-3 text-sm text-danger">this link is invalid or has expired. request a new one.</p>
        <Link href="/forgot-password" className="btn-pill-primary min-h-11 w-full text-sm">get a new link</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorLine id={`${uid}-err`} errorRef={errorRef}>{error}</ErrorLine>
      <Field id={`${uid}-email`} label="email">
        <Input id={`${uid}-email`} type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus required maxLength={254} />
      </Field>
      <Field id={`${uid}-pw`} label="new password" hint={<p id={`${uid}-hint`} className={`text-xs ${hint.tone}`} aria-live="polite">{hint.label}</p>}>
        <PasswordInput id={`${uid}-pw`} value={password} onChange={setPassword} autoComplete="new-password" describedBy={`${uid}-hint`} />
      </Field>
      <Submit busy={busy} busyText="saving...">set password</Submit>
    </form>
  );
}
