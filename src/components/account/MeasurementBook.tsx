"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { MeasurementProfile } from "@/types";
import { api, errorFields, errorMessage } from "@/lib/api";
import { EMPTY_MEASUREMENTS, MEASUREMENT_FIELDS } from "@/lib/blouse";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/context/store";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/fields";

type Form = { name: string } & Record<string, string>;
const EMPTY: Form = { name: "", ...EMPTY_MEASUREMENTS };

export function MeasurementBook({
  measurements,
  onChange,
}: {
  measurements: MeasurementProfile[];
  onChange: (measurements: MeasurementProfile[]) => void;
}) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const open = (profile?: MeasurementProfile) => {
    setErrors({});
    setForm(
      profile
        ? {
            name: profile.name,
            bust: profile.bust,
            waist: profile.waist,
            shoulder: profile.shoulder,
            armhole: profile.armhole,
            sleeveLength: profile.sleeveLength,
            blouseLength: profile.blouseLength,
          }
        : EMPTY
    );
    setEditing(profile ? profile.id : "new");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api<{ measurements: MeasurementProfile[] }>(
        editing === "new" ? "/api/account/measurements" : `/api/account/measurements/${editing}`,
        { method: editing === "new" ? "POST" : "PUT", body: form }
      );
      onChange(res.measurements);
      setEditing(null);
      showToast("Measurements saved");
    } catch (error) {
      setErrors(errorFields(error));
      showToast("Couldn't save measurements", errorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (profile: MeasurementProfile) => {
    if (!window.confirm(`Delete the "${profile.name}" measurement profile?`)) return;
    try {
      const res = await api<{ measurements: MeasurementProfile[] }>(`/api/account/measurements/${profile.id}`, {
        method: "DELETE",
      });
      onChange(res.measurements);
      showToast("Measurements deleted", undefined, "info");
    } catch (error) {
      showToast("Couldn't delete measurements", errorMessage(error), "error");
    }
  };

  if (editing) {
    return (
      <form onSubmit={save} noValidate className="max-w-2xl rounded-2xl border border-clay/60 bg-white/60 p-6 sm:p-7">
        <h2 className="type-heading-md mb-1 text-charcoal">
          {editing === "new" ? "New Measurement Profile" : "Edit Measurements"}
        </h2>
        <p className="mb-5 text-sm text-mist">All measurements are in inches.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Profile Name" required error={errors.name} className="sm:col-span-2" hint="e.g. Me, Amma, Wedding blouse">
            <TextInput
              value={form.name}
              maxLength={40}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={!!errors.name}
            />
          </Field>
          {MEASUREMENT_FIELDS.map((field) => (
            <Field key={field.id} label={field.label} required={field.required} error={errors[field.id]} hint={field.hint}>
              <TextInput
                inputMode="decimal"
                placeholder="e.g. 36"
                value={form[field.id]}
                error={!!errors[field.id]}
                onChange={(e) => setForm((f) => ({ ...f, [field.id]: e.target.value }))}
              />
            </Field>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Measurements"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <p className="mb-6 max-w-xl text-sm text-mist">
        Save your measurements once and load them into the custom blouse builder whenever you order.
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        {measurements.map((m) => (
          <div key={m.id} className="rounded-2xl border border-clay/60 bg-white/60 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-charcoal">{m.name}</h3>
              <span className="text-xs text-mist">Updated {formatDate(m.updatedAt)}</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {MEASUREMENT_FIELDS.map((field) => (
                <div key={field.id} className="flex justify-between gap-2">
                  <dt className="text-mist">{field.label}</dt>
                  <dd className="font-medium tabular-nums text-charcoal">{m[field.id] ? `${m[field.id]}"` : "—"}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex gap-4 text-xs">
              <button onClick={() => open(m)} className="flex items-center gap-1.5 text-charcoal underline underline-offset-4">
                <Pencil width={12} height={12} />
                Edit
              </button>
              <button onClick={() => remove(m)} className="flex items-center gap-1.5 text-taupe underline underline-offset-4 hover:text-red-700">
                <Trash2 width={12} height={12} />
                Delete
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => open()}
          className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-clay text-sm font-medium text-charcoal transition-colors hover:border-gold"
        >
          <Plus width={18} height={18} className="text-gold-deep" />
          Add a measurement profile
        </button>
      </div>
      {measurements.length > 0 && (
        <LinkButton href="/custom-blouse" variant="outline" size="sm" className="mt-6">
          Design a Custom Blouse
        </LinkButton>
      )}
    </div>
  );
}
