"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
  Check,
  ImagePlus,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MeasurementProfile, SavedDesign } from "@/types";
import { api, errorMessage, uploadImage } from "@/lib/api";
import {
  buildCustomization,
  CUSTOM_BLOUSE_DELIVERY,
  DEFAULT_BLOUSE_OPTIONS,
  EMPTY_MEASUREMENTS,
  MEASUREMENT_FIELDS,
  SAVED_DESIGN_KEY,
  validateMeasurements,
} from "@/lib/blouse";
import {
  breakdownLines,
  normaliseSelection,
  priceBlouse,
  type BlouseCatalog,
} from "@/lib/blouse-pricing";
import { useApi } from "@/lib/use-api";
import { createPersistentStore, usePersistentStore } from "@/lib/persistent-store";
import { useAuth, useCart, useToast } from "@/context/store";
import { cn, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { BlousePreview } from "@/components/custom-blouse/BlousePreview";
import { CustomBlouseStepper } from "@/components/custom-blouse/CustomBlouseStepper";
import { MeasurementGuide } from "@/components/custom-blouse/MeasurementGuide";
import { Field, TextArea, TextInput } from "@/components/ui/fields";
import { SizeGuide } from "@/components/product/SizeGuide";

const ease = [0.22, 1, 0.36, 1] as const;

const MEASURE_TIPS = [
  "Measure over a well-fitting, non-padded bra.",
  "Keep the tape snug but not tight, and level all the way round.",
  "Ask someone to help with shoulder and blouse length.",
];

interface BlouseDraft {
  step: number;
  designId: string | null;
  selected: Record<string, string>;
  measurements: Record<string, string>;
  measurementProfile: string | null;
  image: string | null;
  instructions: string;
}

const EMPTY_DRAFT: BlouseDraft = {
  step: 1,
  designId: null,
  selected: DEFAULT_BLOUSE_OPTIONS,
  measurements: EMPTY_MEASUREMENTS,
  measurementProfile: null,
  image: null,
  instructions: "",
};

const stringRecord = (raw: unknown, fallback: Record<string, string>) => {
  if (typeof raw !== "object" || raw === null) return fallback;
  const out: Record<string, string> = { ...fallback };
  for (const [k, v] of Object.entries(raw)) if (k in fallback && typeof v === "string") out[k] = v.slice(0, 40);
  return out;
};

/** The in-progress design survives refreshes and navigation until it is added to the bag. */
const draftStore = createPersistentStore<BlouseDraft>("uma:blouse-draft:v1", EMPTY_DRAFT, (raw) => {
  if (typeof raw !== "object" || raw === null) return EMPTY_DRAFT;
  const r = raw as Record<string, unknown>;
  return {
    step: typeof r.step === "number" && r.step >= 1 && r.step <= 4 ? Math.floor(r.step) : 1,
    designId: typeof r.designId === "string" ? r.designId.slice(0, 40) : null,
    // Choices are checked against the live catalog once it loads; anything withdrawn is replaced.
    selected: stringRecord(r.selected, DEFAULT_BLOUSE_OPTIONS),
    measurements: stringRecord(r.measurements, EMPTY_MEASUREMENTS),
    measurementProfile: typeof r.measurementProfile === "string" ? r.measurementProfile : null,
    image: typeof r.image === "string" && !r.image.startsWith("data:") ? r.image : null,
    instructions: typeof r.instructions === "string" ? r.instructions.slice(0, 1000) : "",
  };
});

const update = (patch: Partial<BlouseDraft>) => draftStore.set((prev) => ({ ...prev, ...patch }));

export function CustomBlouseBuilder() {
  const { addCustomBlouse, openCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const designId = useSearchParams().get("design");
  const draft = usePersistentStore(draftStore);
  const { step, selected, measurements, image, instructions } = draft;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [activeMeasurement, setActiveMeasurement] = useState<string | null>(MEASUREMENT_FIELDS[0].id);
  const [profiles, setProfiles] = useState<MeasurementProfile[]>([]);
  const [saveProfile, setSaveProfile] = useState(false);
  const [profileName, setProfileName] = useState("My measurements");
  const [designName, setDesignName] = useState("");
  const [savingDesign, setSavingDesign] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setStep = (next: number) => update({ step: next });
  const setImage = (next: string | null) => update({ image: next });
  const setInstructions = (next: string) => update({ instructions: next });
  const setMeasurement = (id: string, value: string) =>
    // Editing by hand detaches the values from any loaded saved profile.
    update({ measurements: { ...draftStore.get().measurements, [id]: value }, measurementProfile: null });
  // Prices, designs and options come from the admin-managed catalog — the same data the order API prices from.
  const catalogState = useApi<{ catalog: BlouseCatalog }>("/api/custom-blouse/catalog");
  const catalog = catalogState.data?.catalog ?? null;
  const selection = useMemo(
    () => (catalog ? normaliseSelection(catalog, { designId: draft.designId, options: selected }, DEFAULT_BLOUSE_OPTIONS) : null),
    [catalog, draft.designId, selected]
  );
  const priced = catalog && selection ? priceBlouse(catalog, selection) : null;
  const breakdown = priced?.ok ? priced.breakdown : null;
  const customizationPrice = breakdown?.total ?? null;
  const priceLabel = customizationPrice === null ? "—" : formatINR(customizationPrice);

  const setOption = (groupId: string, optionId: string) =>
    update({ selected: { ...(selection?.options ?? draftStore.get().selected), [groupId]: optionId } });
  const setDesign = (id: string) => update({ designId: id });
  const filledCount = MEASUREMENT_FIELDS.filter((f) => measurements[f.id]?.trim()).length;

  // Saved measurement profiles for signed-in customers.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api<{ measurements: MeasurementProfile[] }>("/api/account/measurements")
      .then((res) => {
        if (!cancelled) setProfiles(res.measurements);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Opening /custom-blouse?design=… loads a design saved in the account.
  useEffect(() => {
    if (!user || !designId) return;
    let cancelled = false;
    api<{ designs: SavedDesign[] }>("/api/account/designs")
      .then((res) => {
        const design = res.designs.find((d) => d.id === designId);
        if (!cancelled && design) {
          update({ selected: design.options, designId: design.options[SAVED_DESIGN_KEY] ?? null, step: 1 });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, designId]);

  const loadProfile = (id: string) => {
    const profile = profiles.find((p) => p.id === id);
    if (!profile) {
      update({ measurementProfile: null });
      return;
    }
    setErrors({});
    update({
      measurementProfile: profile.name,
      measurements: {
        bust: profile.bust,
        waist: profile.waist,
        shoulder: profile.shoulder,
        armhole: profile.armhole,
        sleeveLength: profile.sleeveLength,
        blouseLength: profile.blouseLength,
      },
    });
  };

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showToast("Please upload a JPG, PNG or WebP image", undefined, "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image too large", "Please upload an image under 5 MB", "error");
      return;
    }
    setUploading(true);
    try {
      setImage(await uploadImage(file, "references"));
    } catch (error) {
      showToast("Upload failed", errorMessage(error), "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const checkMeasurements = () => {
    const next = validateMeasurements(measurements);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === 2 && !checkMeasurements()) return;
    if (step < 4) setStep(step + 1);
  };

  const saveDesign = async () => {
    if (!designName.trim()) return;
    setSavingDesign(true);
    try {
      const options = { ...(selection?.options ?? selected), ...(selection?.designId ? { [SAVED_DESIGN_KEY]: selection.designId } : {}) };
      await api("/api/account/designs", { body: { name: designName, options } });
      showToast("Design saved", "Find it under Saved Designs in your account.");
      setDesignName("");
    } catch (error) {
      showToast("Couldn't save design", errorMessage(error), "error");
    } finally {
      setSavingDesign(false);
    }
  };

  const submit = async () => {
    if (!checkMeasurements()) {
      setStep(2);
      showToast("Please complete your measurements", undefined, "error");
      return;
    }
    if (!selection || !breakdown) {
      showToast("Please finish choosing your design", undefined, "error");
      setStep(1);
      return;
    }
    setSubmitting(true);
    // Prices may have changed since the builder loaded: re-check, and never add a price the customer has not seen.
    let latest: BlouseCatalog;
    try {
      latest = (await api<{ catalog: BlouseCatalog }>("/api/custom-blouse/catalog")).catalog;
    } catch (error) {
      setSubmitting(false);
      showToast("Couldn't confirm the price", errorMessage(error), "error");
      return;
    }
    const fresh = priceBlouse(latest, selection);
    if (!fresh.ok || fresh.breakdown.total !== breakdown.total) {
      catalogState.setData({ catalog: latest });
      setSubmitting(false);
      showToast(
        "Prices were just updated",
        fresh.ok
          ? `Your blouse is now ${formatINR(fresh.breakdown.total)} (was ${formatINR(breakdown.total)}). Please review and add it again.`
          : "One of your choices is no longer offered. Please review your design.",
        "info"
      );
      if (!fresh.ok) setStep(1);
      return;
    }
    let profileUsed = draft.measurementProfile ?? undefined;
    if (user && saveProfile && profileName.trim()) {
      try {
        const res = await api<{ measurements: MeasurementProfile[] }>("/api/account/measurements", {
          body: { name: profileName, ...measurements },
        });
        setProfiles(res.measurements);
        profileUsed = profileName.trim();
      } catch (error) {
        // The blouse can still be ordered; only the profile save failed.
        showToast("Measurements not saved to your account", errorMessage(error), "error");
      }
    }
    addCustomBlouse(
      buildCustomization(
        {
          options: selection.options,
          measurements,
          measurementProfile: profileUsed,
          instructions,
          referenceImage: image ?? undefined,
        },
        fresh.breakdown
      )
    );
    draftStore.set(EMPTY_DRAFT);
    setSaveProfile(false);
    setSubmitting(false);
    showToast("Added to bag", "Your bespoke blouse is in your bag.");
    openCart();
  };

  const selectedName = (groupId: string) =>
    breakdown?.options.find((o) => o.groupId === groupId)?.name ?? "—";

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
      {/* Stepper */}
      <CustomBlouseStepper current={step} onChange={setStep} className="mb-12" />

      <div className="overflow-clip rounded-2xl border border-clay/60 bg-white/60">
        <AnimatePresence mode="wait">
          {/* ---------- STEP 1 : DESIGN ---------- */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease }}
              className="p-6 sm:p-10"
            >
              <div className="mb-8">
                <p className="eyebrow mb-2 text-gold-deep">Step 01 — Design</p>
                <h2 className="type-heading-lg text-charcoal">
                  Choose every detail
                </h2>
                <p className="mt-2 text-sm text-mist">
                  Pick the elements that will make this blouse unmistakably yours — the
                  sketch updates as you go.
                </p>
              </div>

              {!catalog || !selection ? (
                catalogState.error ? (
                  <div role="alert" className="rounded-2xl border border-clay/60 bg-cream/60 p-8 text-center">
                    <p className="type-heading-md text-charcoal">We couldn&apos;t load the latest designs and prices</p>
                    <p className="mt-2 text-sm text-mist">{catalogState.error.message}</p>
                    <Button type="button" variant="outline" size="sm" className="mt-5" onClick={catalogState.reload}>
                      Try again
                    </Button>
                  </div>
                ) : (
                  <div aria-busy="true" aria-label="Loading designs and prices" className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="space-y-8">
                      {[0, 1, 2].map((i) => (
                        <div key={i}>
                          <div className="mb-4 h-4 w-40 animate-pulse rounded bg-cream" />
                          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                            {[0, 1, 2, 3, 4, 5].map((j) => (
                              <div key={j} className="aspect-[4/5] animate-pulse rounded-xl bg-cream/80" />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="hidden h-96 animate-pulse rounded-2xl bg-cream/80 lg:block" />
                  </div>
                )
              ) : (
              <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-10">
                  {catalog.designs.length > 0 && (
                    <section aria-labelledby="group-design">
                      <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-clay/50 pb-3">
                        <h3 id="group-design" className="type-label text-charcoal">Choose your design</h3>
                        <span className="truncate text-xs text-mist">{breakdown?.design?.name ?? "—"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {catalog.designs.map((d) => {
                          const isActive = selection.designId === d.id;
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => setDesign(d.id)}
                              aria-pressed={isActive}
                              className={cn(
                                "group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                                isActive ? "border-gold bg-cream shadow-soft" : "border-clay/70 bg-white hover:border-gold-soft"
                              )}
                            >
                              <span className="relative block aspect-[4/3] w-full overflow-hidden bg-cream">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={d.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                                {isActive && (
                                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-white">
                                    <Check width={13} height={13} strokeWidth={3} />
                                  </span>
                                )}
                              </span>
                              <span className="flex flex-1 flex-col p-3">
                                <span className="text-sm font-medium text-charcoal">{d.name}</span>
                                {d.description && (
                                  <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-mist">{d.description}</span>
                                )}
                                <span className={cn("mt-1.5 text-xs", d.price > 0 ? "text-gold-deep" : "text-taupe")}>
                                  {d.price > 0 ? `+${formatINR(d.price)}` : "Included"}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  )}
                  {catalog.groups.map((group, gi) => (
                    <section key={group.id} aria-labelledby={`group-${group.id}`}>
                      <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-clay/50 pb-3">
                        <h3 id={`group-${group.id}`} className="type-label flex items-baseline gap-3 text-charcoal">
                          <span className="font-serif text-sm text-gold-deep">0{gi + 1}</span>
                          {group.label}
                        </h3>
                        <span className="truncate text-xs text-mist">
                          {selectedName(group.id)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6">
                        {group.options.map((opt) => {
                          const isActive = selection.options[group.id] === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setOption(group.id, opt.id)}
                              aria-pressed={isActive}
                              className={cn(
                                "group relative flex flex-col items-center rounded-xl border p-2 pb-2.5 text-center transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                                isActive
                                  ? "border-gold bg-cream shadow-soft"
                                  : "border-clay/70 bg-white hover:-translate-y-0.5 hover:border-gold-soft"
                              )}
                            >
                              <span
                                className={cn(
                                  "relative mb-2 block aspect-square w-full overflow-hidden rounded-lg transition-colors",
                                  isActive ? "bg-ivory" : "bg-cream/60 group-hover:bg-cream"
                                )}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={opt.image}
                                  alt=""
                                  loading="lazy"
                                  className="h-full w-full object-contain p-1 transition-transform duration-500 group-hover:scale-105"
                                />
                                {isActive && (
                                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-white">
                                    <Check width={11} height={11} strokeWidth={3} />
                                  </span>
                                )}
                              </span>
                              <span
                                className={cn(
                                  "text-[0.7rem] font-medium leading-tight",
                                  isActive ? "text-charcoal" : "text-mist"
                                )}
                              >
                                {opt.name}
                              </span>
                              <span
                                className={cn(
                                  "mt-0.5 text-[0.62rem]",
                                  opt.price > 0 ? "text-gold-deep" : "text-taupe"
                                )}
                              >
                                {opt.price > 0 ? `+${formatINR(opt.price)}` : "Included"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>

                {/* Live summary */}
                <aside id="blouse-summary" className="scroll-mt-24 lg:sticky lg:top-28 lg:self-start">
                  <div className="rounded-2xl border border-clay/60 bg-ivory/70 p-4">
                    <BlousePreview selected={selection.options} />
                    <dl className="mt-4 space-y-1.5 text-xs">
                      {breakdown?.design && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-mist">Design</dt>
                          <dd className="text-right font-medium text-charcoal">{breakdown.design.name}</dd>
                        </div>
                      )}
                      {catalog.groups.map((g) => (
                        <div key={g.id} className="flex justify-between gap-3">
                          <dt className="text-mist">{g.label.replace(/ (Design|Style)$/, "")}</dt>
                          <dd className="text-right font-medium text-charcoal">{selectedName(g.id)}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-4 flex items-baseline justify-between border-t border-clay/60 pt-4">
                      <span className="text-xs uppercase tracking-[0.14em] text-mist">Your price</span>
                      <span className="type-price-lg text-charcoal" aria-live="polite">{priceLabel}</span>
                    </div>
                    <p className="mt-1 text-[0.68rem] text-taupe">
                      Includes {formatINR(catalog.basePrice)} base stitching
                    </p>
                  </div>
                </aside>
              </div>
              )}

              {/* Phones: the running price stays in reach while choosing options. */}
              <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 mt-8 flex items-center justify-between gap-3 rounded-full border border-clay/70 bg-ivory/95 py-2 pl-5 pr-2 shadow-lifted backdrop-blur-md lg:hidden">
                <span className="min-w-0">
                  <span className="block text-[0.62rem] uppercase tracking-[0.14em] text-mist">Your price</span>
                  <span className="block font-semibold tabular-nums text-charcoal">{priceLabel}</span>
                </span>
                <a
                  href="#blouse-summary"
                  className="type-label-sm inline-flex h-10 shrink-0 items-center rounded-full bg-charcoal px-4 text-ivory"
                >
                  See sketch
                </a>
              </div>
            </motion.div>
          )}

          {/* ---------- STEP 2 : MEASUREMENTS ---------- */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease }}
              className="p-6 sm:p-10"
            >
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow mb-2 text-gold-deep">Step 02 — Measurements</p>
                  <h2 className="type-heading-lg text-charcoal">
                    Your perfect fit
                  </h2>
                  <p className="mt-2 text-sm text-mist">
                    Measure in inches. Our tailor double-checks everything before cutting.
                  </p>
                </div>
                <button
                  onClick={() => setSizeGuideOpen(true)}
                  className="type-label-sm flex items-center gap-2 rounded-full border border-charcoal/30 px-4 py-2 text-charcoal transition-colors hover:border-charcoal hover:bg-charcoal hover:text-ivory"
                >
                  Use Our Size Guide
                </button>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
                {/* Guide */}
                <aside className="lg:sticky lg:top-28 lg:self-start">
                  <MeasurementGuide active={activeMeasurement} />
                  <ul className="mt-4 hidden space-y-2 text-xs leading-relaxed text-mist lg:block">
                    {MEASURE_TIPS.map((tip) => (
                      <li key={tip} className="flex gap-2">
                        <Check width={13} height={13} className="mt-0.5 shrink-0 text-gold-deep" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </aside>

                <div>
                  {user ? (
                    profiles.length > 0 && (
                      <label className="mb-6 block max-w-sm">
                        <span className="mb-1.5 block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-charcoal/70">
                          Load saved measurements
                        </span>
                        <select
                          value={profiles.find((p) => p.name === draft.measurementProfile)?.id ?? ""}
                          onChange={(e) => loadProfile(e.target.value)}
                          className="w-full rounded-lg border border-clay bg-white/60 px-3.5 py-2.5 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold-soft/40"
                        >
                          <option value="">Enter measurements manually</option>
                          {profiles.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )
                  ) : (
                    <p className="mb-6 rounded-xl bg-cream px-4 py-3 text-sm text-mist">
                      <Link href="/login?next=/custom-blouse" className="font-medium text-gold-deep underline underline-offset-4">
                        Sign in
                      </Link>{" "}
                      to load or save your measurements for future orders.
                    </p>
                  )}

                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="type-label text-charcoal">Measurements</h3>
                    <span className="flex items-center gap-2 text-xs text-mist">
                      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-clay/60">
                        <span
                          className="block h-full rounded-full bg-gold transition-all duration-500"
                          style={{ width: `${(filledCount / MEASUREMENT_FIELDS.length) * 100}%` }}
                        />
                      </span>
                      {filledCount} of {MEASUREMENT_FIELDS.length} added
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {MEASUREMENT_FIELDS.map((f, i) => {
                      const isActive = activeMeasurement === f.id;
                      const filled = Boolean(measurements[f.id]?.trim()) && !errors[f.id];
                      return (
                        <div
                          key={f.id}
                          onMouseEnter={() => setActiveMeasurement(f.id)}
                          className={cn(
                            "rounded-xl border p-3.5 transition-colors duration-300",
                            errors[f.id]
                              ? "border-red-300 bg-red-50/40"
                              : isActive
                                ? "border-gold bg-cream/70"
                                : "border-clay/60 bg-white/70"
                          )}
                        >
                          <label htmlFor={`m-${f.id}`} className="mb-2 flex items-center gap-2.5">
                            <span
                              className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.68rem] font-bold transition-colors",
                                filled ? "bg-gold text-white" : isActive ? "bg-gold-deep text-white" : "bg-cream text-gold-deep"
                              )}
                            >
                              {filled ? <Check width={12} height={12} strokeWidth={3} /> : i + 1}
                            </span>
                            <span className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-charcoal">
                              {f.label}
                              {f.required ? (
                                <span className="text-gold-deep"> *</span>
                              ) : (
                                <span className="ml-1.5 normal-case tracking-normal text-taupe">optional</span>
                              )}
                            </span>
                          </label>
                          <div className="relative">
                            <TextInput
                              id={`m-${f.id}`}
                              inputMode="decimal"
                              placeholder={f.required ? "e.g. 36" : "Optional"}
                              error={!!errors[f.id]}
                              value={measurements[f.id]}
                              onFocus={() => setActiveMeasurement(f.id)}
                              onChange={(e) => setMeasurement(f.id, e.target.value)}
                              aria-describedby={`m-${f.id}-hint`}
                              aria-invalid={!!errors[f.id]}
                              className="pr-14 bg-white"
                            />
                            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-taupe">
                              inches
                            </span>
                          </div>
                          <p
                            id={`m-${f.id}-hint`}
                            className={cn("mt-1.5 text-xs", errors[f.id] ? "text-red-600" : "text-taupe")}
                          >
                            {errors[f.id] ?? f.hint}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-mist lg:hidden">
                    {MEASURE_TIPS.join(" ")}
                  </p>

                  {user && !draft.measurementProfile && (
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2.5 text-sm text-mist">
                        <input
                          type="checkbox"
                          checked={saveProfile}
                          onChange={(e) => setSaveProfile(e.target.checked)}
                          className="h-4 w-4 accent-[#1c1a17]"
                        />
                        Save these measurements to my account
                      </label>
                      {saveProfile && (
                        <TextInput
                          value={profileName}
                          maxLength={40}
                          onChange={(e) => setProfileName(e.target.value)}
                          aria-label="Measurement profile name"
                          className="max-w-56"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ---------- STEP 3 : UPLOAD ---------- */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease }}
              className="p-6 sm:p-10"
            >
              <div className="mb-8">
                <p className="eyebrow mb-2 text-gold-deep">Step 03 — Reference</p>
                <h2 className="type-heading-lg text-charcoal">
                  Share a reference
                </h2>
                <p className="mt-2 text-sm text-mist">
                  Upload a photo of a blouse you love — from a family saree or Pinterest —
                  and we&apos;ll recreate the spirit of it.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              {!image ? (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    handleFile(e.dataTransfer.files?.[0]);
                  }}
                  className={cn(
                    "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors",
                    dragging
                      ? "border-gold bg-cream"
                      : "border-clay bg-white/50 hover:border-gold-soft"
                  )}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream text-gold-deep">
                    {uploading ? <Loader2 width={24} height={24} className="animate-spin" /> : <UploadCloud width={24} height={24} />}
                  </span>
                  <span className="type-heading-md text-charcoal">
                    {uploading ? "Uploading…" : "Drag & drop your reference"}
                  </span>
                  <span className="text-sm text-mist">
                    or click to browse — JPG, PNG or WebP, up to 5 MB
                  </span>
                </button>
              ) : (
                <div className="relative overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt="Your reference"
                    className="max-h-[420px] w-full rounded-2xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-ivory backdrop-blur transition-colors hover:bg-ink"
                    aria-label="Remove image"
                  >
                    <X width={16} height={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="type-label-sm absolute bottom-3 right-3 rounded-full bg-ivory/90 px-4 py-2 text-charcoal backdrop-blur"
                  >
                    Replace
                  </button>
                </div>
              )}

              <div className="mt-8">
                <Field label="Additional Instructions" hint="Optional — tell our tailor what matters">
                  <TextArea
                    placeholder="I want elbow-length sleeves with a deeper back neck."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </Field>
              </div>
            </motion.div>
          )}

          {/* ---------- STEP 4 : REVIEW ---------- */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease }}
              className="p-6 sm:p-10"
            >
              <div className="mb-8">
                <p className="eyebrow mb-2 text-gold-deep">Step 04 — Review</p>
                <h2 className="type-heading-lg text-charcoal">
                  Almost there
                </h2>
                <p className="mt-2 text-sm text-mist">
                  Confirm every detail before we take it to the cutting table.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                <div className="space-y-5">
                  {/* Design summary */}
                  <div className="rounded-xl border border-clay/60 p-5">
                    <h3 className="eyebrow mb-4 text-gold-deep">Your Design</h3>
                    <dl className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                      {breakdown?.design && (
                        <div className="flex justify-between gap-2">
                          <dt className="text-mist">Design</dt>
                          <dd className="text-right font-medium text-charcoal">{breakdown.design.name}</dd>
                        </div>
                      )}
                      {(breakdown?.options ?? []).map((o) => (
                        <div key={o.groupId} className="flex justify-between gap-2">
                          <dt className="text-mist">{o.groupLabel}</dt>
                          <dd className="text-right font-medium text-charcoal">{o.name}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {/* Measurements summary */}
                  <div className="rounded-xl border border-clay/60 p-5">
                    <h3 className="eyebrow mb-4 text-gold-deep">Measurements (in)</h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      {MEASUREMENT_FIELDS.map((f) => (
                        <div key={f.id} className="flex justify-between gap-2">
                          <dt className="text-mist">{f.label}</dt>
                          <dd className="text-right font-medium text-charcoal">
                            {measurements[f.id] ? `${measurements[f.id]}"` : "—"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Reference */}
                  <div className="rounded-xl border border-clay/60 p-5">
                    <h3 className="eyebrow mb-4 text-gold-deep">Reference & Notes</h3>
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt="Reference"
                        className="max-h-44 w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex items-center gap-3 rounded-lg bg-cream p-4 text-sm text-mist">
                        <ImagePlus width={18} height={18} className="text-gold-deep" />
                        No reference uploaded — our designer will sketch from your description.
                      </div>
                    )}
                    {instructions && (
                      <p className="mt-3 text-sm italic leading-relaxed text-mist">
                        “{instructions}”
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="rounded-xl border border-gold/40 bg-cream/70 p-5">
                    {breakdown ? (
                      <dl className="space-y-2">
                        {breakdownLines(breakdown).map((line, i) => (
                          <div key={line.label} className="flex items-baseline justify-between gap-3">
                            <dt className="text-sm text-mist">{line.label}</dt>
                            <dd className="text-sm font-medium tabular-nums text-charcoal">
                              {i === 0 ? "" : "+"}
                              {formatINR(line.amount)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="text-sm text-mist">Loading the latest prices…</p>
                    )}
                    <div className="mt-4 flex items-baseline justify-between border-t border-gold/30 pt-4">
                      <span className="text-sm font-medium text-charcoal">Your blouse</span>
                      <span className="type-price-lg text-charcoal" aria-live="polite">{priceLabel}</span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-mist">
                      Stitched to your exact measurements. {CUSTOM_BLOUSE_DELIVERY}. Our team
                      reviews every design before tailoring begins.
                    </p>
                  </div>

                  {user && (
                    <div className="rounded-xl border border-clay/60 p-5">
                      <h3 className="eyebrow mb-3 text-gold-deep">Save This Design</h3>
                      <div className="flex gap-2">
                        <TextInput
                          value={designName}
                          maxLength={60}
                          onChange={(e) => setDesignName(e.target.value)}
                          placeholder="e.g. Reception blouse"
                          aria-label="Design name"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-auto shrink-0"
                          disabled={savingDesign || !designName.trim()}
                          onClick={saveDesign}
                        >
                          <BookmarkPlus width={14} height={14} />
                          Save
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="disabled:opacity-40"
        >
          <ArrowLeft width={16} height={16} />
          Back
        </Button>

        <div className="hidden text-sm text-mist sm:block">
          {step < 4 ? "Step" : "Ready"} — {step} of 4
        </div>

        {step < 4 ? (
          <Button onClick={goNext}>
            Continue
            <ArrowRight width={16} height={16} />
          </Button>
        ) : (
          <Button onClick={submit} disabled={submitting || !breakdown} variant="gold">
            {submitting ? (
              <>
                <Loader2 width={16} height={16} className="animate-spin" />
                Adding…
              </>
            ) : (
              <>
                <ImagePlus width={16} height={16} />
                Add Customized Blouse to Bag
              </>
            )}
          </Button>
        )}
      </div>

      <SizeGuide open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </div>
  );
}
