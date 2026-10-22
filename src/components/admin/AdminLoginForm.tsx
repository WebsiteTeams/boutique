"use client";

import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionUser } from "@/types";
import { api, errorFields, errorMessage } from "@/lib/api";
import { useAuth, useToast } from "@/context/store";
import { Field, TextInput } from "@/components/ui/fields";

const MANAGES = ["Orders, payments & stock", "Custom blouse designs & pricing", "Customers, reviews & messages"];

/** Staff-only sign-in. Customer accounts are refused by the server with a generic message. */
export function AdminLoginForm({
  signedInAs,
  devLogin,
}: {
  signedInAs: string | null;
  /** Only passed in development (see env.devAdminLogin). */
  devLogin: { email: string; password: string } | null;
}) {
  const { setUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrors({});
    setFormError(null);
    try {
      const res = await api<{ user: SessionUser }>("/api/auth/admin-login", { body: form });
      setUser(res.user);
      showToast("Signed in", `Welcome back, ${res.user.name}`);
      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setErrors(errorFields(error));
      setFormError(errorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-ivory lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Brand panel */}
      <section className="relative isolate flex min-h-56 flex-col justify-between overflow-hidden bg-charcoal p-6 text-ivory sm:p-10 lg:min-h-screen lg:p-14">
        <Image
          src="/images/collections/collection-bridal.png"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 52vw, 100vw"
          className="-z-20 object-cover object-[50%_25%]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-ink/95 via-ink/65 to-ink/35 lg:via-ink/55" />

        <div className="flex items-baseline gap-3">
          <span className="font-serif text-3xl leading-none tracking-wide">UMA</span>
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-gold-soft">Designers · Atelier</span>
        </div>

        <div className="mt-10 max-w-md">
          <p className="font-serif text-3xl leading-tight sm:text-4xl lg:text-5xl">
            Every stitch,
            <br />
            <em className="text-gold-soft">beautifully managed.</em>
          </p>
          <ul className="mt-8 hidden space-y-3 text-sm text-ivory/80 lg:block">
            {MANAGES.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span aria-hidden className="h-px w-6 bg-gold-soft" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center px-5 py-12 sm:px-10 lg:py-16">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-2 rounded-full text-sm text-mist hover:text-charcoal focus-visible:outline-2 focus-visible:outline-gold"
          >
            <ArrowLeft width={15} height={15} aria-hidden />
            Back to the store
          </Link>

          <p className="eyebrow mt-8 text-gold-deep">Staff portal</p>
          <h1 className="type-heading-xl mt-2 text-charcoal">Sign in to Admin</h1>
          <p className="mt-2 text-sm leading-relaxed text-mist">Use the staff email and password issued to you.</p>

          {signedInAs && (
            <p role="status" className="mt-6 rounded-xl border border-clay/70 bg-cream/70 px-4 py-3 text-sm text-mist">
              You&apos;re signed in as <span className="font-medium text-charcoal">{signedInAs}</span>, which isn&apos;t a
              staff account.
            </p>
          )}

          {devLogin && (
            <div className="mt-6 rounded-xl border border-dashed border-gold/60 bg-cream/60 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">
                <KeyRound width={14} height={14} aria-hidden />
                Admin login · development only
              </p>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-mist">Email</dt>
                  <dd className="min-w-0 break-all font-medium text-charcoal">{devLogin.email}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-mist">Password</dt>
                  <dd className="min-w-0 break-all font-mono text-[0.85rem] text-charcoal">{devLogin.password}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => {
                  setForm({ email: devLogin.email, password: devLogin.password });
                  setErrors({});
                  setFormError(null);
                }}
                className="mt-3 inline-flex min-h-9 items-center rounded-full border border-clay bg-white px-3.5 text-xs font-medium text-charcoal hover:border-charcoal focus-visible:outline-2 focus-visible:outline-gold"
              >
                Fill in these details
              </button>
              <p className="mt-2 text-xs text-mist">Read from ADMIN_EMAIL / ADMIN_PASSWORD in .env.local. Hidden on the live site.</p>
            </div>
          )}

          <form onSubmit={submit} noValidate className="mt-8 space-y-5">
            {formError && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </p>
            )}
            <Field label="Staff email" required error={errors.email}>
              <TextInput
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                autoComplete="username"
                placeholder="name@umadesigners.in"
                error={!!errors.email}
                required
              />
            </Field>
            <Field label="Password" required error={errors.password}>
              <span className="relative block">
                <TextInput
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                  error={!!errors.password}
                  className="pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-taupe hover:text-charcoal"
                >
                  {showPassword ? <EyeOff width={16} height={16} /> : <Eye width={16} height={16} />}
                </button>
              </span>
            </Field>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="inline-flex min-h-9 items-center text-xs text-mist underline underline-offset-4 hover:text-charcoal">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-charcoal text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 width={15} height={15} className="animate-spin" aria-hidden />
                  Signing in…
                </>
              ) : (
                <>
                  <Lock width={14} height={14} aria-hidden />
                  Sign in
                </>
              )}
            </button>
          </form>

         
        </div>
      </section>
    </div>
  );
}
