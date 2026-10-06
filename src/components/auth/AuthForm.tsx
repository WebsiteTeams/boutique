"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { errorFields, errorMessage } from "@/lib/api";
import { useAuth, useToast } from "@/context/store";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/fields";

/** Only same-site relative paths are accepted as a post-login destination. */
function safeNext(raw: string | null, fallback: string) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return fallback;
  return raw;
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { login, register, user, ready } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === "register";

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);
    try {
      const signedIn = isRegister ? await register(form) : await login(form.email, form.password);
      showToast(isRegister ? "Welcome to UMA" : "Welcome back", signedIn.name);
      router.replace(safeNext(next, signedIn.role === "admin" ? "/admin" : "/account"));
      router.refresh();
    } catch (error) {
      setErrors(errorFields(error));
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const switchHref = `${isRegister ? "/login" : "/register"}${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <div className="mx-auto max-w-md px-5 pb-20 pt-32 sm:px-8 lg:pt-40">
      <div className="text-center">
        <p className="eyebrow mb-3 text-gold-deep">{isRegister ? "Join UMA" : "Welcome Back"}</p>
        <h1 className="type-heading-xl text-charcoal">{isRegister ? "Create Your Account" : "Sign In"}</h1>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          {isRegister
            ? "Save your measurements, track orders and keep your wishlist across devices."
            : "Access your orders, saved measurements and wishlist."}
        </p>
      </div>

      {ready && user ? (
        <div className="mt-8 rounded-2xl border border-clay/60 bg-white/60 p-7 text-center">
          <p className="text-sm text-mist">
            You are signed in as <span className="font-medium text-charcoal">{user.email}</span>.
          </p>
          <Button className="mt-5" onClick={() => router.push(user.role === "admin" ? "/admin" : "/account")}>
            Go to {user.role === "admin" ? "Admin" : "My Account"}
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-8 space-y-5 rounded-2xl border border-clay/60 bg-white/60 p-6 sm:p-7">
          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </p>
          )}
          {isRegister && (
            <Field label="Full Name" required error={errors.name}>
              <TextInput value={form.name} onChange={set("name")} autoComplete="name" error={!!errors.name} required />
            </Field>
          )}
          <Field label="Email" required error={errors.email}>
            <TextInput
              type="email"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
              placeholder="you@example.com"
              error={!!errors.email}
              required
            />
          </Field>
          {isRegister && (
            <Field label="Mobile Number" error={errors.phone} hint="Optional — for delivery updates">
              <TextInput
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))}
                autoComplete="tel-national"
                placeholder="10-digit mobile number"
                error={!!errors.phone}
              />
            </Field>
          )}
          <Field
            label="Password"
            required
            error={errors.password}
            hint={isRegister ? "At least 8 characters, with a letter and a number" : undefined}
          >
            <span className="relative block">
              <TextInput
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                autoComplete={isRegister ? "new-password" : "current-password"}
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
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 width={16} height={16} className="animate-spin" />
                Please wait…
              </>
            ) : isRegister ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </Button>
          <p className="text-center text-sm text-mist">
            {isRegister ? "Already have an account?" : "New to UMA?"}{" "}
            <Link href={switchHref} className="font-medium text-gold-deep underline underline-offset-4">
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
