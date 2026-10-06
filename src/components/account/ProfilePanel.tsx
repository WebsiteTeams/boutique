"use client";

import { useState } from "react";
import type { SessionUser } from "@/types";
import { api, errorFields, errorMessage } from "@/lib/api";
import { useAuth, useToast } from "@/context/store";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/fields";

export function ProfilePanel({ user }: { user: SessionUser }) {
  const { setUser } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState({ name: user.name, phone: user.phone });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<"profile" | "password" | null>(null);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("profile");
    setErrors({});
    try {
      const res = await api<{ user: SessionUser }>("/api/account/profile", { method: "PATCH", body: profile });
      setUser(res.user);
      showToast("Profile updated");
    } catch (error) {
      setErrors(errorFields(error));
      showToast("Couldn't update profile", errorMessage(error), "error");
    } finally {
      setBusy(null);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("password");
    setErrors({});
    try {
      await api("/api/account/password", { body: passwords });
      setPasswords({ currentPassword: "", newPassword: "" });
      showToast("Password changed");
    } catch (error) {
      setErrors(errorFields(error));
      showToast("Couldn't change password", errorMessage(error), "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={saveProfile} noValidate className="rounded-2xl border border-clay/60 bg-white/60 p-6 sm:p-7">
        <h2 className="type-heading-md mb-5 text-charcoal">Profile</h2>
        <div className="space-y-5">
          <Field label="Name" required error={errors.name}>
            <TextInput
              value={profile.name}
              autoComplete="name"
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              error={!!errors.name}
            />
          </Field>
          <Field label="Email" hint="Your email is your sign-in ID and cannot be changed here.">
            <TextInput value={user.email} disabled className="opacity-70" />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <TextInput
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={profile.phone}
              autoComplete="tel-national"
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))}
              error={!!errors.phone}
            />
          </Field>
          <Button type="submit" disabled={busy === "profile"}>
            {busy === "profile" ? "Saving…" : "Save Profile"}
          </Button>
        </div>
      </form>

      <form onSubmit={savePassword} noValidate className="rounded-2xl border border-clay/60 bg-white/60 p-6 sm:p-7">
        <h2 className="type-heading-md mb-5 text-charcoal">Change Password</h2>
        <div className="space-y-5">
          <Field label="Current Password" required error={errors.currentPassword}>
            <TextInput
              type="password"
              autoComplete="current-password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
              error={!!errors.currentPassword}
            />
          </Field>
          <Field
            label="New Password"
            required
            error={errors.newPassword}
            hint="At least 8 characters, with a letter and a number"
          >
            <TextInput
              type="password"
              autoComplete="new-password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
              error={!!errors.newPassword}
            />
          </Field>
          <Button type="submit" variant="outline" disabled={busy === "password"}>
            {busy === "password" ? "Updating…" : "Update Password"}
          </Button>
        </div>
      </form>
    </div>
  );
}
