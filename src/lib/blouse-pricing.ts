/**
 * The single pricing model for the bespoke blouse, shared by the builder,
 * the admin preview and the order API:
 *
 *   total = base stitching price
 *         + selected design surcharge
 *         + Σ surcharges of the selected options (one per group)
 *         + Σ active fixed charges
 *
 * All amounts are whole rupees held as integers (the project's currency
 * representation), so there is no floating-point arithmetic anywhere.
 */

export interface CatalogOption {
  id: string;
  name: string;
  price: number;
  image: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CatalogGroup {
  id: string;
  label: string;
  options: CatalogOption[];
}

export interface CatalogDesign {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  image: string;
  gallery: string[];
  price: number;
  isActive: boolean;
  sortOrder: number;
}

export interface FixedCharge {
  id: string;
  label: string;
  amount: number;
  isActive: boolean;
}

export interface BlouseCatalog {
  basePrice: number;
  charges: FixedCharge[];
  groups: CatalogGroup[];
  designs: CatalogDesign[];
}

export interface BlouseSelection {
  designId?: string | null;
  options: Record<string, string>;
}

export interface PriceBreakdown {
  basePrice: number;
  design: { id: string; name: string; price: number } | null;
  options: { groupId: string; groupLabel: string; optionId: string; name: string; price: number }[];
  charges: { id: string; label: string; amount: number }[];
  total: number;
}

export type PriceResult = { ok: true; breakdown: PriceBreakdown } | { ok: false; reason: string };

const bySort = <T extends { sortOrder: number }>(a: T, b: T) => a.sortOrder - b.sortOrder;

/** Only what a customer may choose: active designs and options, in display order. */
export function activeCatalog(catalog: BlouseCatalog): BlouseCatalog {
  return {
    basePrice: catalog.basePrice,
    charges: catalog.charges.filter((c) => c.isActive),
    groups: catalog.groups.map((g) => ({ ...g, options: g.options.filter((o) => o.isActive).sort(bySort) })),
    designs: catalog.designs.filter((d) => d.isActive).sort(bySort),
  };
}

/**
 * Prices a selection against a catalog. Inactive or unknown designs and options
 * make the selection invalid, so they can never be ordered.
 */
export function priceBlouse(catalog: BlouseCatalog, selection: BlouseSelection): PriceResult {
  const activeDesigns = catalog.designs.filter((d) => d.isActive);
  let design: PriceBreakdown["design"] = null;
  if (activeDesigns.length > 0) {
    const found = activeDesigns.find((d) => d.id === selection.designId);
    if (!found) return { ok: false, reason: "Please choose one of the available blouse designs." };
    design = { id: found.id, name: found.name, price: found.price };
  } else if (selection.designId) {
    return { ok: false, reason: "That blouse design is no longer available." };
  }

  const options: PriceBreakdown["options"] = [];
  for (const group of catalog.groups) {
    const option = group.options.find((o) => o.id === selection.options[group.id] && o.isActive);
    if (!option) return { ok: false, reason: `Please choose an available ${group.label.toLowerCase()}.` };
    options.push({ groupId: group.id, groupLabel: group.label, optionId: option.id, name: option.name, price: option.price });
  }

  const charges = catalog.charges.filter((c) => c.isActive).map((c) => ({ id: c.id, label: c.label, amount: c.amount }));
  const total =
    catalog.basePrice +
    (design?.price ?? 0) +
    options.reduce((sum, o) => sum + o.price, 0) +
    charges.reduce((sum, c) => sum + c.amount, 0);

  return { ok: true, breakdown: { basePrice: catalog.basePrice, design, options, charges, total } };
}

/**
 * Keeps every still-available choice and fills the gaps (new, removed or
 * deactivated options) with the preferred default or the first active option.
 */
export function normaliseSelection(
  catalog: BlouseCatalog,
  selection: BlouseSelection,
  preferred: Record<string, string> = {}
): Required<BlouseSelection> {
  const live = activeCatalog(catalog);
  const options: Record<string, string> = {};
  for (const group of live.groups) {
    const ids = group.options.map((o) => o.id);
    const current = selection.options[group.id];
    options[group.id] = ids.includes(current)
      ? current
      : ids.includes(preferred[group.id])
        ? preferred[group.id]
        : (ids[0] ?? "");
  }
  const designIds = live.designs.map((d) => d.id);
  const designId = selection.designId && designIds.includes(selection.designId) ? selection.designId : (designIds[0] ?? null);
  return { designId, options };
}

/** Line items for showing a breakdown (only the parts that add to the price, plus the base). */
export function breakdownLines(b: PriceBreakdown): { label: string; amount: number }[] {
  return [
    { label: "Base stitching", amount: b.basePrice },
    ...(b.design && b.design.price > 0 ? [{ label: `Design · ${b.design.name}`, amount: b.design.price }] : []),
    ...b.options.filter((o) => o.price > 0).map((o) => ({ label: `${o.groupLabel} · ${o.name}`, amount: o.price })),
    ...b.charges.filter((c) => c.amount > 0).map((c) => ({ label: c.label, amount: c.amount })),
  ];
}
