import type { CustomizationSummary } from "@/types";
import type { PriceBreakdown } from "@/lib/blouse-pricing";

/** Catalog product that represents the bespoke blouse service. */
export const CUSTOM_BLOUSE_PRODUCT_ID = "pr-16";
export const CUSTOM_BLOUSE_SLUG = "bespoke-silk-custom-blouse";
export const CUSTOM_BLOUSE_NAME = "Customised Silk Blouse";
export const CUSTOM_BLOUSE_IMAGE = "/images/blouses/blouse-bespoke-silk-1.png";
export const CUSTOM_BLOUSE_DELIVERY = "Stitched and dispatched in about 12 days";

export const MEASUREMENT_FIELDS = [
  { id: "bust", label: "Bust", hint: "Around the fullest part", how: "Wrap the tape around the fullest part of your bust, keeping it level across your back.", required: true },
  { id: "waist", label: "Waist", hint: "Narrowest point", how: "Measure around your natural waist — the narrowest point, just above the navel.", required: true },
  { id: "shoulder", label: "Shoulder", hint: "Across the shoulder blades", how: "Measure across your back from one shoulder tip to the other.", required: true },
  { id: "armhole", label: "Armhole", hint: "Around upper arm at shoulder", how: "Loop the tape around the top of your arm where it meets the shoulder.", required: false },
  { id: "sleeveLength", label: "Sleeve Length", hint: "Shoulder to desired length", how: "From the shoulder tip down the arm to where you want the sleeve to end.", required: false },
  { id: "blouseLength", label: "Blouse Length", hint: "Shoulder to blouse hem", how: "From the highest point of the shoulder, over the bust, to where the blouse should end.", required: false },
] as const;

export type MeasurementFieldId = (typeof MEASUREMENT_FIELDS)[number]["id"];

export const DEFAULT_BLOUSE_OPTIONS: Record<string, string> = {
  neck: "sweetheart",
  sleeve: "elbow",
  back: "u-back",
  embroidery: "none-emb",
  border: "none-bor",
  stitching: "hook",
};

export const EMPTY_MEASUREMENTS: Record<MeasurementFieldId, string> = {
  bust: "",
  waist: "",
  shoulder: "",
  armhole: "",
  sleeveLength: "",
  blouseLength: "",
};

export function validateMeasurements(values: Record<string, string>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of MEASUREMENT_FIELDS) {
    const val = (values[f.id] ?? "").trim();
    if (f.required && !val) errors[f.id] = "Required";
    else if (val && (Number.isNaN(Number(val)) || Number(val) <= 0 || Number(val) > 80)) {
      errors[f.id] = "Enter a valid measurement in inches";
    }
  }
  return errors;
}

/** Saved designs keep the chosen base design alongside the group choices under this key. */
export const SAVED_DESIGN_KEY = "design";

/**
 * Builds the stored customization from a server- or client-computed price
 * breakdown. The breakdown is kept with the order, so later price changes in
 * the admin never alter what a customer was charged.
 */
export function buildCustomization(
  input: {
    options: Record<string, string>;
    measurements: Record<string, string>;
    measurementProfile?: string;
    instructions?: string;
    referenceImage?: string;
  },
  breakdown: PriceBreakdown
): CustomizationSummary {
  const name = (groupId: string) => breakdown.options.find((o) => o.groupId === groupId)?.name ?? "—";
  return {
    neck: name("neck"),
    sleeve: name("sleeve"),
    back: name("back"),
    embroidery: name("embroidery"),
    border: name("border"),
    stitching: name("stitching"),
    designId: breakdown.design?.id,
    design: breakdown.design?.name,
    options: Object.fromEntries(breakdown.options.map((o) => [o.groupId, o.optionId])),
    measurements: input.measurements,
    measurementProfile: input.measurementProfile,
    instructions: input.instructions?.trim() || undefined,
    referenceImage: input.referenceImage,
    basePrice: breakdown.total,
    pricing: breakdown,
  };
}

/** Label/value rows used wherever a customization is summarised. */
export function customizationRows(c: CustomizationSummary): { label: string; value: string }[] {
  const filled = MEASUREMENT_FIELDS.filter((f) => c.measurements?.[f.id]);
  return [
    ...(c.design ? [{ label: "Design", value: c.design }] : []),
    { label: "Neck", value: c.neck },
    { label: "Sleeve", value: c.sleeve },
    { label: "Back", value: c.back },
    { label: "Embroidery", value: c.embroidery },
    { label: "Border", value: c.border },
    { label: "Stitching", value: c.stitching },
    {
      label: "Measurements",
      value: c.measurementProfile
        ? `Saved profile · ${c.measurementProfile}`
        : filled.length > 0
          ? filled.map((f) => `${f.label} ${c.measurements[f.id]}"`).join(", ")
          : "To be confirmed",
    },
  ];
}
