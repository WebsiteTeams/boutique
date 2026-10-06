"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { SavedAddress } from "@/types";
import { api, errorFields, errorMessage } from "@/lib/api";
import { useToast } from "@/context/store";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextInput } from "@/components/ui/fields";

const EMPTY = {
  label: "Home" as SavedAddress["label"],
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

export function AddressBook({
  addresses,
  onChange,
}: {
  addresses: SavedAddress[];
  onChange: (addresses: SavedAddress[]) => void;
}) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const open = (address?: SavedAddress) => {
    setErrors({});
    setForm(address ? { ...EMPTY, ...address, line2: address.line2 ?? "" } : EMPTY);
    setEditing(address ? address.id : "new");
  };

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api<{ addresses: SavedAddress[] }>(
        editing === "new" ? "/api/account/addresses" : `/api/account/addresses/${editing}`,
        { method: editing === "new" ? "POST" : "PUT", body: form }
      );
      onChange(res.addresses);
      setEditing(null);
      showToast("Address saved");
    } catch (error) {
      setErrors(errorFields(error));
      showToast("Couldn't save address", errorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (address: SavedAddress) => {
    if (!window.confirm(`Delete your ${address.label.toLowerCase()} address?`)) return;
    try {
      const res = await api<{ addresses: SavedAddress[] }>(`/api/account/addresses/${address.id}`, {
        method: "DELETE",
      });
      onChange(res.addresses);
      showToast("Address deleted", undefined, "info");
    } catch (error) {
      showToast("Couldn't delete address", errorMessage(error), "error");
    }
  };

  const makeDefault = async (address: SavedAddress) => {
    try {
      const res = await api<{ addresses: SavedAddress[] }>(`/api/account/addresses/${address.id}`, {
        method: "PUT",
        body: { ...address, line2: address.line2 ?? "", isDefault: true },
      });
      onChange(res.addresses);
    } catch (error) {
      showToast("Couldn't update address", errorMessage(error), "error");
    }
  };

  if (editing) {
    return (
      <form onSubmit={save} noValidate className="max-w-2xl rounded-2xl border border-clay/60 bg-white/60 p-6 sm:p-7">
        <h2 className="type-heading-md mb-5 text-charcoal">{editing === "new" ? "Add Address" : "Edit Address"}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Address Type">
            <Select value={form.label} onChange={set("label")}>
              <option>Home</option>
              <option>Work</option>
              <option>Other</option>
            </Select>
          </Field>
          <Field label="Full Name" required error={errors.fullName}>
            <TextInput value={form.fullName} onChange={set("fullName")} autoComplete="name" error={!!errors.fullName} />
          </Field>
          <Field label="Phone" required error={errors.phone}>
            <TextInput
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))}
              error={!!errors.phone}
            />
          </Field>
          <Field label="Pincode" required error={errors.pincode}>
            <TextInput
              inputMode="numeric"
              maxLength={6}
              value={form.pincode}
              onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, "") }))}
              error={!!errors.pincode}
            />
          </Field>
          <Field label="Address Line 1" required error={errors.line1} className="sm:col-span-2">
            <TextInput value={form.line1} onChange={set("line1")} autoComplete="address-line1" error={!!errors.line1} />
          </Field>
          <Field label="Address Line 2" className="sm:col-span-2">
            <TextInput value={form.line2} onChange={set("line2")} autoComplete="address-line2" />
          </Field>
          <Field label="City" required error={errors.city}>
            <TextInput value={form.city} onChange={set("city")} error={!!errors.city} />
          </Field>
          <Field label="State" required error={errors.state}>
            <TextInput value={form.state} onChange={set("state")} error={!!errors.state} />
          </Field>
          <label className="flex items-center gap-2.5 text-sm text-mist sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="h-4 w-4 accent-[#1c1a17]"
            />
            Use as my default delivery address
          </label>
        </div>
        <div className="mt-6 flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Address"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {addresses.map((a) => (
        <div key={a.id} className="rounded-2xl border border-clay/60 bg-white/60 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-charcoal">{a.label}</h3>
            {a.isDefault ? (
              <span className="rounded-full bg-gold/15 px-3 py-1 text-[0.62rem] font-medium uppercase tracking-wide text-gold-deep">
                Default
              </span>
            ) : (
              <button onClick={() => makeDefault(a)} className="text-xs text-taupe underline underline-offset-4 hover:text-charcoal">
                Set as default
              </button>
            )}
          </div>
          <p className="mt-3 text-sm font-medium text-charcoal">{a.fullName}</p>
          <p className="mt-1 text-sm leading-relaxed text-mist">
            {a.line1}
            {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
          </p>
          <p className="mt-1 text-sm text-mist">{a.phone}</p>
          <div className="mt-4 flex gap-4 text-xs">
            <button onClick={() => open(a)} className="flex items-center gap-1.5 text-charcoal underline underline-offset-4">
              <Pencil width={12} height={12} />
              Edit
            </button>
            <button onClick={() => remove(a)} className="flex items-center gap-1.5 text-taupe underline underline-offset-4 hover:text-red-700">
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
        Add a new address
      </button>
    </div>
  );
}
