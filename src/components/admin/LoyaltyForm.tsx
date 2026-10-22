"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { useToast } from "@/context/store";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/fields";

interface Settings {
  enabled: boolean;
  pointsPerHundred: number;
  tiers: { name: string; minPoints: number; perk: string }[];
}

export function LoyaltyForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  const setTier = (index: number, patch: Partial<Settings["tiers"][number]>) =>
    setForm((f) => ({ ...f, tiers: f.tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/admin/settings/loyalty", { method: "PUT", body: form });
      showToast("Rewards settings saved");
      router.refresh();
    } catch (error) {
      showToast("Couldn't save settings", errorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <label className="flex items-center gap-3 text-sm text-charcoal">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
          className="h-4 w-4 accent-[#1c1a17]"
        />
        UMA Rewards is active
      </label>

      <Field label="Points earned per ₹100 spent" hint="Awarded when an order is delivered; reversed if it is cancelled, returned or refunded." className="max-w-xs">
        <TextInput
          type="number"
          min={0}
          max={100}
          value={form.pointsPerHundred}
          onChange={(e) => setForm((f) => ({ ...f, pointsPerHundred: Number(e.target.value) }))}
        />
      </Field>

      <fieldset>
        <legend className="mb-3 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-charcoal/70">Tiers</legend>
        <ul className="space-y-3">
          {form.tiers.map((tier, i) => (
            <li key={i} className="grid gap-3 rounded-xl border border-clay/60 p-4 sm:grid-cols-[1fr_140px_2fr_auto]">
              <TextInput value={tier.name} onChange={(e) => setTier(i, { name: e.target.value })} placeholder="Tier name" aria-label={`Tier ${i + 1} name`} />
              <TextInput type="number" min={0} value={tier.minPoints} onChange={(e) => setTier(i, { minPoints: Number(e.target.value) })} aria-label={`Tier ${i + 1} minimum points`} />
              <TextInput value={tier.perk} onChange={(e) => setTier(i, { perk: e.target.value })} placeholder="Perk shown to customers" aria-label={`Tier ${i + 1} perk`} />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, tiers: f.tiers.filter((_, idx) => idx !== i) }))}
                disabled={form.tiers.length <= 1}
                aria-label={`Remove tier ${tier.name || i + 1}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-clay text-taupe hover:text-red-700 disabled:opacity-30"
              >
                <Trash2 width={14} height={14} />
              </button>
            </li>
          ))}
        </ul>
        {form.tiers.length < 6 && (
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, tiers: [...f.tiers, { name: "", minPoints: 0, perk: "" }] }))}
            className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-xs font-medium text-gold-deep underline underline-offset-4"
          >
            <Plus width={13} height={13} />
            Add tier
          </button>
        )}
      </fieldset>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save Settings"}
      </Button>
    </form>
  );
}
