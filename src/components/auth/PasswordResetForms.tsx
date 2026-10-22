"use client";

import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { api, errorFields, errorMessage } from "@/lib/api";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/fields";

function Shell({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-5 pb-20 pt-32 sm:px-8 lg:pt-40">
      <div className="text-center">
        <p className="eyebrow mb-3 text-gold-deep">{eyebrow}</p>
        <h1 className="type-heading-xl text-charcoal">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-mist">{intro}</p>
      </div>
      <div className="mt-8 rounded-2xl border border-clay/60 bg-white/60 p-6 sm:p-7">{children}</div>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="status" className="text-center">
      <CheckCircle2 width={28} height={28} className="mx-auto text-gold-deep" aria-hidden />
      <h2 className="type-heading-md mt-3 text-charcoal">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-mist">{children}</div>
    </div>
  );
}

/** Step 1: ask for the account email. The reply is the same whether or not the account exists. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setFieldError(undefined);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFieldError("Enter a valid email");
      return;
    }
    setSubmitting(true);
    try {
      await api("/api/auth/password-reset/request", { body: { email } });
      setSent(true);
    } catch (err) {
      setFieldError(errorFields(err).email);
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell
      eyebrow="Account Help"
      title="Forgot Your Password?"
      intro="Enter the email you shop with and we'll send a link to choose a new password."
    >
      {sent ? (
        <Notice title="Check your inbox">
          <p>
            If an account exists for <span className="font-medium text-charcoal">{email.trim()}</span>, a reset link is
            on its way. It works once and expires in 60 minutes.
          </p>
          <p className="mt-4">
            <Link href="/login" className="font-medium text-gold-deep underline underline-offset-4">
              Back to sign in
            </Link>
          </p>
        </Notice>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <Field label="Email" required error={fieldError}>
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              error={!!fieldError}
              aria-invalid={!!fieldError}
              required
              autoFocus
            />
          </Field>
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 width={16} height={16} className="animate-spin" aria-hidden />
                Sending…
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
          <p className="text-center text-sm text-mist">
            Remembered it?{" "}
            <Link href="/login" className="font-medium text-gold-deep underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </Shell>
  );
}

/** Step 2: choose a new password from the emailed link. */
export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    const next: Record<string, string> = {};
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      next.password = "Use at least 8 characters, with a letter and a number";
    }
    if (confirm !== password) next.confirm = "Passwords don't match";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await api("/api/auth/password-reset/confirm", { body: { token, password } });
      setDone(true);
    } catch (err) {
      setErrors(errorFields(err));
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <Shell eyebrow="Account Help" title="Reset Link Missing" intro="This page needs the link from your reset email.">
        <div className="text-center text-sm text-mist">
          <p>Open the link from your email again, or request a new one.</p>
          <LinkButton href="/forgot-password" className="mt-5">
            Request a New Link
          </LinkButton>
        </div>
      </Shell>
    );
  }

  return (
    <Shell eyebrow="Account Help" title="Choose a New Password" intro="Pick a password you haven't used here before.">
      {done ? (
        <Notice title="Password updated">
          <p>For your security we signed you out on every device. Sign in with your new password.</p>
          <LinkButton href="/login" className="mt-5">
            Sign In
          </LinkButton>
        </Notice>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}{" "}
              {error.includes("expired") && (
                <Link href="/forgot-password" className="font-medium underline underline-offset-4">
                  Request a new link
                </Link>
              )}
            </p>
          )}
          <Field label="New Password" required error={errors.password} hint="At least 8 characters, with a letter and a number">
            <span className="relative block">
              <TextInput
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                error={!!errors.password}
                aria-invalid={!!errors.password}
                className="pr-11"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                aria-pressed={show}
                className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-taupe hover:text-charcoal"
              >
                {show ? <EyeOff width={16} height={16} /> : <Eye width={16} height={16} />}
              </button>
            </span>
          </Field>
          <Field label="Confirm New Password" required error={errors.confirm}>
            <TextInput
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              error={!!errors.confirm}
              aria-invalid={!!errors.confirm}
              required
            />
          </Field>
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 width={16} height={16} className="animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save New Password"
            )}
          </Button>
        </form>
      )}
    </Shell>
  );
}
