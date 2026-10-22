"use client";

import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BlouseCatalog, CatalogDesign } from "@/lib/blouse-pricing";
import { api, errorFields, errorMessage } from "@/lib/api";
import { useToast } from "@/context/store";
import { cn, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { BlousePricePreview } from "@/components/admin/BlousePricePreview";

interface OptionDraft {
  id: string;
  name: string;
  price: string;
  isActive: boolean;
}
interface ChargeDraft {
  id: string;
  label: string;
  amount: string;
  isActive: boolean;
}
interface Draft {
  basePrice: string;
  charges: ChargeDraft[];
  groups: Record<string, OptionDraft[]>;
}

const MAX_PRICE = 1_000_000;

const toDraft = (c: BlouseCatalog): Draft => ({
  basePrice: String(c.basePrice),
  charges: c.charges.map((ch) => ({ ...ch, amount: String(ch.amount) })),
  groups: Object.fromEntries(
    c.groups.map((g) => [
      g.id,
      [...g.options]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((o) => ({ id: o.id, name: o.name, price: String(o.price), isActive: o.isActive })),
    ])
  ),
});

/** Whole rupees from 0 to 10 lakh; anything else is an error message. */
function parsePrice(raw: string): number | string {
  const v = raw.trim();
  if (v === "") return "Enter a price (0 for included)";
  if (!/^\d+$/.test(v)) return v.startsWith("-") ? "Prices can't be negative" : "Use whole rupees, e.g. 249";
  const n = Number(v);
  return n > MAX_PRICE ? "That price is too high" : n;
}

const inputClass =
  "h-10 w-full min-w-0 rounded-lg border bg-white/70 px-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-gold-soft/40";

export function BlousePricingEditor({ initial, designs }: { initial: BlouseCatalog; designs: CatalogDesign[] }) {
  const { showToast } = useToast();
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(toDraft(saved)), [draft, saved]);

  // Warn before leaving the page with unsaved prices.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // Validate the draft and build the catalog the preview prices from.
  const { errors, preview, payload } = useMemo(() => {
    const errs: Record<string, string> = {};
    const num = (key: string, raw: string) => {
      const r = parsePrice(raw);
      if (typeof r === "string") {
        errs[key] = r;
        return 0;
      }
      return r;
    };
    const basePrice = num("basePrice", draft.basePrice);
    const charges = draft.charges.map((c, i) => {
      if (c.label.trim().length < 2) errs[`charge-${i}-label`] = "Name this charge";
      return { id: c.id, label: c.label.trim(), amount: num(`charge-${i}`, c.amount), isActive: c.isActive };
    });
    const groups = saved.groups.map((g) => {
      const rows = draft.groups[g.id] ?? [];
      if (!rows.some((o) => o.isActive)) errs[`group-${g.id}`] = `Keep at least one ${g.label.toLowerCase()} option active.`;
      return {
        ...g,
        options: rows.map((o, i) => {
          if (!o.name.trim()) errs[`${g.id}/${o.id}-name`] = "Required";
          const base = g.options.find((x) => x.id === o.id)!;
          return { ...base, name: o.name.trim(), price: num(`${g.id}/${o.id}`, o.price), isActive: o.isActive, sortOrder: i };
        }),
      };
    });
    return {
      errors: errs,
      preview: { ...saved, designs, basePrice, charges, groups } satisfies BlouseCatalog,
      payload: {
        basePrice,
        charges,
        options: groups.flatMap((g) =>
          g.options.map((o) => ({ groupId: g.id, id: o.id, name: o.name, price: o.price, isActive: o.isActive, sortOrder: o.sortOrder }))
        ),
      },
    };
  }, [draft, saved, designs]);

  const hasErrors = Object.keys(errors).length > 0;

  const setOption = (groupId: string, index: number, patch: Partial<OptionDraft>) =>
    setDraft((d) => ({
      ...d,
      groups: { ...d.groups, [groupId]: d.groups[groupId].map((o, i) => (i === index ? { ...o, ...patch } : o)) },
    }));
  const moveOption = (groupId: string, index: number, dir: -1 | 1) =>
    setDraft((d) => {
      const rows = [...d.groups[groupId]];
      const target = index + dir;
      if (target < 0 || target >= rows.length) return d;
      [rows[index], rows[target]] = [rows[target], rows[index]];
      return { ...d, groups: { ...d.groups, [groupId]: rows } };
    });
  const setCharge = (index: number, patch: Partial<ChargeDraft>) =>
    setDraft((d) => ({ ...d, charges: d.charges.map((c, i) => (i === index ? { ...c, ...patch } : c)) }));

  const save = async () => {
    if (hasErrors || saving) return;
    setSaving(true);
    setServerError(null);
    try {
      const res = await api<{ catalog: BlouseCatalog }>("/api/admin/blouse-pricing", { method: "PUT", body: payload });
      setSaved(res.catalog);
      setDraft(toDraft(res.catalog));
      showToast("Prices saved", "The custom blouse builder now uses these prices.");
    } catch (error) {
      const fields = errorFields(error);
      setServerError(Object.values(fields)[0] ? `${errorMessage(error)} ${Object.values(fields)[0]}` : errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setDraft(toDraft(saved));
    setServerError(null);
  };

  const err = (key: string) =>
    errors[key] ? (
      <span className="mt-1 block text-xs text-red-700" role="alert">
        {errors[key]}
      </span>
    ) : null;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        {/* Base & fixed charges */}
        <section className="rounded-2xl border border-clay/60 bg-white/60 p-5 sm:p-6" aria-labelledby="base-heading">
          <h2 id="base-heading" className="text-base font-medium text-charcoal">Base price &amp; fixed charges</h2>
          <p className="mt-1 text-sm text-mist">Every custom blouse starts at the base price. Active fixed charges are added to every blouse.</p>

          <label className="mt-5 block max-w-xs">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-charcoal/70">Base stitching price</span>
            <span className="relative block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-taupe">₹</span>
              <input
                inputMode="numeric"
                value={draft.basePrice}
                onChange={(e) => setDraft((d) => ({ ...d, basePrice: e.target.value }))}
                aria-invalid={!!errors.basePrice}
                className={cn(inputClass, "pl-7", errors.basePrice ? "border-red-400" : "border-clay focus:border-gold")}
              />
            </span>
            {err("basePrice")}
          </label>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-charcoal/70">Fixed charges</span>
              <button
                type="button"
                disabled={draft.charges.length >= 10}
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    charges: [...d.charges, { id: `charge-${Date.now().toString(36)}`, label: "", amount: "0", isActive: true }],
                  }))
                }
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-clay px-3.5 text-xs font-medium text-charcoal hover:border-charcoal disabled:opacity-40"
              >
                <Plus width={13} height={13} aria-hidden />
                Add charge
              </button>
            </div>
            {draft.charges.length === 0 ? (
              <p className="mt-3 rounded-xl bg-cream/50 p-4 text-sm text-mist">No fixed charges. Add one for things every blouse includes, such as lining.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {draft.charges.map((c, i) => (
                  <li key={c.id} className="grid gap-3 rounded-xl border border-clay/60 p-3 sm:grid-cols-[minmax(0,1fr)_140px_auto_auto] sm:items-start">
                    <label className="min-w-0">
                      <span className="sr-only">Charge name</span>
                      <input
                        value={c.label}
                        placeholder="e.g. Lining & finishing"
                        onChange={(e) => setCharge(i, { label: e.target.value })}
                        aria-invalid={!!errors[`charge-${i}-label`]}
                        className={cn(inputClass, errors[`charge-${i}-label`] ? "border-red-400" : "border-clay focus:border-gold")}
                      />
                      {err(`charge-${i}-label`)}
                    </label>
                    <label>
                      <span className="sr-only">Amount in rupees</span>
                      <span className="relative block">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-taupe">₹</span>
                        <input
                          inputMode="numeric"
                          value={c.amount}
                          onChange={(e) => setCharge(i, { amount: e.target.value })}
                          aria-invalid={!!errors[`charge-${i}`]}
                          className={cn(inputClass, "pl-7", errors[`charge-${i}`] ? "border-red-400" : "border-clay focus:border-gold")}
                        />
                      </span>
                      {err(`charge-${i}`)}
                    </label>
                    <label className="flex min-h-10 items-center gap-2 text-sm text-charcoal">
                      <input type="checkbox" checked={c.isActive} onChange={(e) => setCharge(i, { isActive: e.target.checked })} className="h-4 w-4 accent-charcoal" />
                      Active
                    </label>
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, charges: d.charges.filter((_, j) => j !== i) }))}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-taupe hover:bg-red-50 hover:text-red-700"
                      aria-label={`Remove charge ${c.label || i + 1}`}
                    >
                      <Trash2 width={15} height={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Option groups */}
        {saved.groups.map((g) => (
          <section key={g.id} className="rounded-2xl border border-clay/60 bg-white/60 p-5 sm:p-6" aria-labelledby={`grp-${g.id}`}>
            <h2 id={`grp-${g.id}`} className="text-base font-medium text-charcoal">{g.label}</h2>
            <p className="mt-1 text-sm text-mist">Surcharge on top of the base price. Use 0 for options that are included.</p>
            {errors[`group-${g.id}`] && (
              <p role="alert" className="mt-2 text-sm text-red-700">{errors[`group-${g.id}`]}</p>
            )}
            <ul className="mt-4 divide-y divide-clay/40">
              {(draft.groups[g.id] ?? []).map((o, i, rows) => {
                const original = g.options.find((x) => x.id === o.id);
                const changed =
                  original && (original.name !== o.name || String(original.price) !== o.price || original.isActive !== o.isActive);
                return (
                  <li key={o.id} className="grid grid-cols-[auto_minmax(0,1fr)_92px] gap-x-2 gap-y-1 py-3 sm:grid-cols-[auto_minmax(0,1fr)_130px_auto] sm:items-start sm:gap-x-3">
                    <div className="row-span-2 flex flex-col sm:row-span-1">
                      <button
                        type="button"
                        onClick={() => moveOption(g.id, i, -1)}
                        disabled={i === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-taupe hover:bg-cream hover:text-charcoal disabled:opacity-30"
                        aria-label={`Move ${o.name} up`}
                      >
                        <ArrowUp width={14} height={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveOption(g.id, i, 1)}
                        disabled={i === rows.length - 1}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-taupe hover:bg-cream hover:text-charcoal disabled:opacity-30"
                        aria-label={`Move ${o.name} down`}
                      >
                        <ArrowDown width={14} height={14} />
                      </button>
                    </div>
                    <label className="min-w-0">
                      <span className="sr-only">Option name</span>
                      <input
                        value={o.name}
                        onChange={(e) => setOption(g.id, i, { name: e.target.value })}
                        aria-invalid={!!errors[`${g.id}/${o.id}-name`]}
                        className={cn(inputClass, errors[`${g.id}/${o.id}-name`] ? "border-red-400" : "border-clay focus:border-gold", !o.isActive && "text-taupe")}
                      />
                      <span className="mt-1 flex items-center gap-2 text-[0.7rem] text-taupe">
                        id: {o.id}
                        {changed && <span className="rounded-full bg-gold/15 px-1.5 text-gold-deep">edited</span>}
                      </span>
                      {err(`${g.id}/${o.id}-name`)}
                    </label>
                    <label>
                      <span className="sr-only">{o.name} price in rupees</span>
                      <span className="relative block">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-taupe">+₹</span>
                        <input
                          inputMode="numeric"
                          value={o.price}
                          onChange={(e) => setOption(g.id, i, { price: e.target.value })}
                          aria-invalid={!!errors[`${g.id}/${o.id}`]}
                          className={cn(inputClass, "pl-9", errors[`${g.id}/${o.id}`] ? "border-red-400" : "border-clay focus:border-gold")}
                        />
                      </span>
                      {err(`${g.id}/${o.id}`)}
                    </label>
                    <label className="col-span-2 col-start-2 flex min-h-9 items-center gap-2 text-sm text-charcoal sm:col-span-1 sm:col-start-auto sm:min-h-10">
                      <input
                        type="checkbox"
                        checked={o.isActive}
                        onChange={(e) => setOption(g.id, i, { isActive: e.target.checked })}
                        className="h-4 w-4 accent-charcoal"
                      />
                      <span className={o.isActive ? "" : "text-taupe"}>{o.isActive ? "Active" : "Hidden"}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* Phones and tablets: save and cancel stay in reach while scrolling the groups. */}
      <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 flex items-center gap-2 rounded-full border border-clay/70 bg-ivory/95 py-2 pl-4 pr-2 shadow-lifted backdrop-blur-md xl:hidden">
        <span className="min-w-0 flex-1 truncate text-xs text-mist" aria-hidden>
          {hasErrors ? "Fix highlighted fields" : dirty ? "Unsaved changes" : "All saved"}
        </span>
        <button
          type="button"
          onClick={cancel}
          disabled={!dirty || saving}
          className="min-h-10 shrink-0 rounded-full px-3 text-xs font-medium text-charcoal disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || hasErrors || saving}
          className="min-h-10 shrink-0 rounded-full bg-charcoal px-4 text-xs font-semibold uppercase tracking-[0.12em] text-ivory disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Preview + actions */}
      <aside className="xl:sticky xl:top-28 xl:self-start">
        <BlousePricePreview catalog={preview} saved={{ ...saved, designs }} />
        <div className="mt-4 rounded-2xl border border-clay/60 bg-white/60 p-4">
          {serverError && (
            <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </p>
          )}
          <p className="text-sm text-mist" aria-live="polite">
            {hasErrors
              ? "Fix the highlighted fields to save."
              : dirty
                ? "You have unsaved changes. Customers still see the live prices."
                : `All prices saved. Base price ${formatINR(saved.basePrice)}.`}
          </p>
          <div className="mt-3 flex gap-2">
            <Button type="button" onClick={save} disabled={!dirty || hasErrors || saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 width={15} height={15} className="animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={cancel} disabled={!dirty || saving}>
              Cancel
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
