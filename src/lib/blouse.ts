import type { CustomizationSummary } from "@/types";
import { baseBlousePrice, customizationGroups } from "@/lib/data";

/** Catalog product that represents the bespoke blouse service. */
export const CUSTOM_BLOUSE_PRODUCT_ID = "pr-16";
export const CUSTOM_BLOUSE_SLUG = "bespoke-silk-custom-blouse";
export const CUSTOM_BLOUSE_NAME = "Customised Silk Blouse";
export const CUSTOM_BLOUSE_IMAGE = "/images/blouses/blouse-bespoke-silk-1.png";
export const CUSTOM_BLOUSE_DELIVERY = "Stitched and dispatched in about 12 days";

export const MEASUREMENT_FIELDS = [
  { id: "bust", label: "Bust", hint: "Around the fullest part", required: true },
  { id: "waist", label: "Waist", hint: "Narrowest point", required: true },
  { id: "shoulder", label: "Shoulder", hint: "Across the shoulder blades", required: true },
  { id: "armhole", label: "Armhole", hint: "Around upper arm at shoulder", required: false },
  { id: "sleeveLength", label: "Sleeve Length", hint: "Shoulder to desired length", required: false },
  { id: "blouseLength", label: "Blouse Length", hint: "Shoulder to blouse hem", required: false },
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

const findOption = (groupId: string, optionId: string | undefined) =>
  customizationGroups.find((g) => g.id === groupId)?.options.find((o) => o.id === optionId);

export const blouseOptionName = (groupId: string, optionId: string | undefined) =>
  findOption(groupId, optionId)?.name ?? "—";

/** True when every group has a valid option selected. */
export function isValidBlouseSelection(options: Record<string, string>): boolean {
  return customizationGroups.every((g) => Boolean(findOption(g.id, options[g.id])));
}

/** The one place the bespoke blouse price is computed (builder UI and order API). */
export function calculateBlousePrice(options: Record<string, string>): number {
  return customizationGroups.reduce(
    (total, g) => total + (findOption(g.id, options[g.id])?.price ?? 0),
    baseBlousePrice
  );
}

export function blouseUpgrades(options: Record<string, string>) {
  return customizationGroups.flatMap((g) => {
    const opt = findOption(g.id, options[g.id]);
    return opt && opt.price > 0 ? [opt] : [];
  });
}

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

export function buildCustomization(input: {
  options: Record<string, string>;
  measurements: Record<string, string>;
  measurementProfile?: string;
  instructions?: string;
  referenceImage?: string;
}): CustomizationSummary {
  return {
    neck: blouseOptionName("neck", input.options.neck),
    sleeve: blouseOptionName("sleeve", input.options.sleeve),
    back: blouseOptionName("back", input.options.back),
    embroidery: blouseOptionName("embroidery", input.options.embroidery),
    border: blouseOptionName("border", input.options.border),
    stitching: blouseOptionName("stitching", input.options.stitching),
    options: input.options,
    measurements: input.measurements,
    measurementProfile: input.measurementProfile,
    instructions: input.instructions?.trim() || undefined,
    referenceImage: input.referenceImage,
    basePrice: calculateBlousePrice(input.options),
  };
}

/** Label/value rows used wherever a customization is summarised. */
export function customizationRows(c: CustomizationSummary): { label: string; value: string }[] {
  const filled = MEASUREMENT_FIELDS.filter((f) => c.measurements?.[f.id]);
  return [
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
