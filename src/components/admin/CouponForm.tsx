"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorFields, errorMessage } from "@/lib/api";
import { useToast } from "@/context/store";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextInput } from "@/components/ui/fields";

const EMPTY = {
  code: "",
  description: "",
  type: "percent",
  value: "",
  minSubtotal: "",
  maxDiscount: "",
  usageLimit: "",
  expiresAt: "",
};

export function CouponForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api("/api/admin/coupons", {
        body: {
          code: form.code,
          description: form.description,
          type: form.type,
          value: Number(form.value),
          minSubtotal: form.minSubtotal ? Number(form.minSubtotal) : 0,
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
          expiresAt: form.expiresAt || null,
          isActive: true,
        },
      });
      showToast("Coupon created", form.code.toUpperCase());
      setForm(EMPTY);
      router.refresh();
    } catch (error) {
      setErrors(errorFields(error));
      showToast("Couldn't create coupon", errorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Code" required error={errors.code}>
        <TextInput value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="FESTIVE15" error={!!errors.code} />
      </Field>
      <Field label="Type">
        <Select value={form.type} onChange={set("type")}>
          <option value="percent">Percentage off</option>
          <option value="flat">Flat amount off</option>
        </Select>
      </Field>
      <Field label={form.type === "percent" ? "Discount (%)" : "Discount (₹)"} required error={errors.value}>
        <TextInput type="number" min={1} value={form.value} onChange={set("value")} error={!!errors.value} />
      </Field>
      <Field label="Minimum Order (₹)" error={errors.minSubtotal}>
        <TextInput type="number" min={0} value={form.minSubtotal} onChange={set("minSubtotal")} placeholder="0" />
      </Field>
      <Field label="Maximum Discount (₹)" error={errors.maxDiscount} hint="Optional cap">
        <TextInput type="number" min={1} value={form.maxDiscount} onChange={set("maxDiscount")} />
      </Field>
      <Field label="Usage Limit" error={errors.usageLimit} hint="Optional — total redemptions">
        <TextInput type="number" min={1} value={form.usageLimit} onChange={set("usageLimit")} />
      </Field>
      <Field label="Expires On" error={errors.expiresAt} hint="Optional">
        <TextInput type="date" value={form.expiresAt} onChange={set("expiresAt")} />
      </Field>
      <Field label="Description" error={errors.description} hint="Shown to the customer">
        <TextInput value={form.description} onChange={set("description")} placeholder="15% off festive edit" />
      </Field>
      <div className="sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={saving}>
          {saving ? "Creating…" : "Create Coupon"}
        </Button>
      </div>
    </form>
  );
}
