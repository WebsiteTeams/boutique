"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { CustomizationSummary } from "@/types";
import { baseBlousePrice, customizationGroups } from "@/lib/data";
import { useCart, useToast } from "@/context/store";
import { cn, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { CustomBlouseStepper } from "@/components/custom-blouse/CustomBlouseStepper";
import { Field, TextArea, TextInput } from "@/components/ui/fields";
import { SizeGuide } from "@/components/product/SizeGuide";

const MEASUREMENT_FIELDS = [
  { id: "bust", label: "Bust", hint: "Around the fullest part", required: true },
  { id: "waist", label: "Waist", hint: "Narrowest point", required: true },
  { id: "shoulder", label: "Shoulder", hint: "Across the shoulder blades", required: true },
  { id: "armhole", label: "Armhole", hint: "Around upper arm at shoulder", required: false },
  { id: "sleeveLength", label: "Sleeve Length", hint: "Shoulder to desired length", required: false },
  { id: "blouseLength", label: "Blouse Length", hint: "Shoulder to blouse hem", required: false },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function CustomBlouseBuilder() {
  const { addCustomBlouse } = useCart();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>({
    neck: "sweetheart",
    sleeve: "elbow",
    back: "u-back",
    embroidery: "none-emb",
    border: "none-bor",
    stitching: "hook",
  });
  const [measurements, setMeasurements] = useState<Record<string, string>>({
    bust: "",
    waist: "",
    shoulder: "",
    armhole: "",
    sleeveLength: "",
    blouseLength: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [image, setImage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const customizationPrice = useMemo(() => {
    let total = baseBlousePrice;
    for (const group of customizationGroups) {
      const opt = group.options.find((o) => o.id === selected[group.id]);
      if (opt) total += opt.price;
    }
    return total;
  }, [selected]);

  const setOption = (groupId: string, optionId: string) =>
    setSelected((prev) => ({ ...prev, [groupId]: optionId }));

  const handleFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file", undefined, "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image too large", "Please upload an image under 5 MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const validateMeasurements = () => {
    const next: Record<string, string> = {};
    for (const f of MEASUREMENT_FIELDS) {
      const val = measurements[f.id];
      if (f.required && !val) {
        next[f.id] = "Required";
      } else if (val && (isNaN(Number(val)) || Number(val) <= 0)) {
        next[f.id] = "Enter a valid number";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      if (validateMeasurements()) setStep(3);
      return;
    }
    if (step === 3) {
      setStep(4);
      return;
    }
    submit();
  };

  const submit = () => {
    setSubmitting(true);
    const summary: CustomizationSummary = {
      neck: selected.neck,
      sleeve: selected.sleeve,
      back: selected.back,
      embroidery: selected.embroidery,
      border: selected.border,
      stitching: selected.stitching,
      instructions,
      referenceImage: image ?? undefined,
      basePrice: customizationPrice,
    };
    setTimeout(() => {
      addCustomBlouse(summary);
      showToast("Added to cart", "Your bespoke blouse is in your cart.");
      setSubmitting(false);
    }, 600);
  };

  const selectedName = (groupId: string) => {
    const group = customizationGroups.find((g) => g.id === groupId);
    return group?.options.find((o) => o.id === selected[groupId])?.name ?? "—";
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
      {/* Stepper */}
      <CustomBlouseStepper current={step} onChange={setStep} className="mb-12" />

      <div className="overflow-hidden rounded-2xl border border-clay/60 bg-white/60">
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
                  Pick the elements that will make this blouse unmistakably yours.
                </p>
              </div>

              <div className="space-y-10">
                {customizationGroups.map((group) => (
                  <div key={group.id}>
                    <div className="mb-4 flex items-baseline justify-between">
                      <h3 className="type-label text-charcoal">
                        {group.label}
                      </h3>
                      <span className="text-xs text-mist">
                        {selectedName(group.id)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-6">
                      {group.options.map((opt) => {
                        const isActive = selected[group.id] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setOption(group.id, opt.id)}
                            className={cn(
                              "group relative flex flex-col items-center rounded-xl border p-2 transition-all duration-300",
                              isActive
                                ? "border-gold bg-cream shadow-soft"
                                : "border-clay/70 bg-white hover:border-gold-soft"
                            )}
                          >
                            <span className="relative mb-2 block aspect-square w-full overflow-hidden rounded-lg bg-cream">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={opt.image}
                                alt={opt.name}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                              {isActive && (
                                <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-white">
                                  <Check width={11} height={11} strokeWidth={3} />
                                </span>
                              )}
                            </span>
                            <span
                              className={cn(
                                "text-[0.68rem] font-medium leading-tight",
                                isActive ? "text-charcoal" : "text-mist"
                              )}
                            >
                              {opt.name}
                            </span>
                            <span className="mt-0.5 text-[0.6rem] text-taupe">
                              {opt.price > 0 ? `+${formatINR(opt.price)}` : "Included"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
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

              <div className="mb-8 overflow-hidden rounded-xl bg-cream">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/custom-blouse/size-guide.png"
                  alt="Custom blouse measurement size guide"
                  className="h-auto w-full object-contain"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {MEASUREMENT_FIELDS.map((f) => (
                  <Field
                    key={f.id}
                    label={f.label}
                    required={f.required}
                    error={errors[f.id]}
                    hint={f.hint}
                  >
                    <TextInput
                      inputMode="decimal"
                      placeholder="e.g. 36"
                      error={!!errors[f.id]}
                      value={measurements[f.id]}
                      onChange={(e) =>
                        setMeasurements((prev) => ({ ...prev, [f.id]: e.target.value }))
                      }
                    />
                  </Field>
                ))}
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
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              {!image ? (
                <button
                  type="button"
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
                    <UploadCloud width={24} height={24} />
                  </span>
                  <span className="type-heading-md text-charcoal">
                    Drag & drop your reference
                  </span>
                  <span className="text-sm text-mist">
                    or click to browse — JPG or PNG, up to 5 MB
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
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      {customizationGroups.map((g) => (
                        <div key={g.id} className="flex justify-between gap-2">
                          <dt className="text-mist">{g.label}</dt>
                          <dd className="text-right font-medium text-charcoal">
                            {selectedName(g.id)}
                          </dd>
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
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-mist">Base tailoring</span>
                      <span className="text-sm font-medium text-charcoal">
                        {formatINR(baseBlousePrice)}
                      </span>
                    </div>
                    {(() => {
                      const upgrades = customizationGroups
                        .flatMap((g) => g.options)
                        .filter((o) => Object.values(selected).includes(o.id) && o.price > 0);
                      return upgrades.map((o) => (
                        <div key={o.id} className="mt-2 flex items-baseline justify-between">
                          <span className="text-sm text-mist">Upgrade · {o.name}</span>
                          <span className="text-sm font-medium text-charcoal">+{formatINR(o.price)}</span>
                        </div>
                      ));
                    })()}
                    <div className="mt-4 flex items-baseline justify-between border-t border-gold/30 pt-4">
                      <span className="text-sm font-medium text-charcoal">Customization price</span>
                      <span className="type-price-lg text-charcoal">
                        {formatINR(customizationPrice)}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-mist">
                      Stitched to your exact measurements and delivered in ~12 days. Final
                      cost confirmed by our team before we begin.
                    </p>
                  </div>
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
          onClick={() => setStep((s) => Math.max(1, s - 1))}
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
          <Button onClick={submit} disabled={submitting} variant="gold">
            {submitting ? (
              <>
                <Loader2 width={16} height={16} className="animate-spin" />
                Adding…
              </>
            ) : (
              <>
                <ImagePlus width={16} height={16} />
                Add Customized Blouse to Cart
              </>
            )}
          </Button>
        )}
      </div>

      <SizeGuide open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </div>
  );
}
