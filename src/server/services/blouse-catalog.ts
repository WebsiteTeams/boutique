import type { z } from "zod";
import { optionArtPath } from "@/lib/blouse-art";
import type { BlouseCatalog, CatalogDesign, FixedCharge } from "@/lib/blouse-pricing";
import { baseBlousePrice, customizationGroups } from "@/lib/data";
import {
  BlouseDesigns,
  BlouseOptions,
  CustomBlouses,
  plain,
  Settings,
  type BlouseDesignRow,
} from "@/server/db/models";
import { badRequest, conflict, notFound } from "@/server/utils/errors";
import { newId, now } from "@/server/utils/ids";
import type { blouseDesignSchema, blousePricingSchema } from "@/server/validators";

const PRICING_KEY = "blouse_pricing";

interface PricingSettings {
  basePrice: number;
  charges: FixedCharge[];
}

/**
 * The builder's groups are fixed in code because each one is drawn on the live
 * sketch; their options, names and prices live in the database.
 */
const GROUPS = customizationGroups.map((g) => ({ id: g.id, label: g.label }));
const GROUP_IDS = new Set(GROUPS.map((g) => g.id));

/** First run: copy the original option list into the database, unchanged. Idempotent. */
async function ensureSeeded() {
  if ((await BlouseOptions.estimatedDocumentCount()) > 0) return;
  const timestamp = now();
  const rows = customizationGroups.flatMap((g) =>
    g.options.map((o, i) => ({
      _id: `${g.id}/${o.id}`,
      groupId: g.id,
      id: o.id,
      name: o.name,
      price: o.price,
      isActive: true,
      sortOrder: i,
      updatedAt: timestamp,
    }))
  );
  // Unordered so a concurrent first request inserting the same rows cannot fail this one.
  await BlouseOptions.insertMany(rows, { ordered: false }).catch((error: { code?: number; writeErrors?: unknown[] }) => {
    if (error.code !== 11000 && !error.writeErrors) throw error;
  });
}

async function getPricingSettings(): Promise<PricingSettings> {
  const row = await Settings.findById(PRICING_KEY).lean();
  const value = row?.value as Partial<PricingSettings> | undefined;
  return {
    basePrice: Number.isInteger(value?.basePrice) ? (value!.basePrice as number) : baseBlousePrice,
    charges: Array.isArray(value?.charges) ? value!.charges : [],
  };
}

const toDesign = (row: BlouseDesignRow): CatalogDesign => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description,
  category: row.category,
  image: row.image,
  gallery: row.gallery,
  price: row.price,
  isActive: row.isActive,
  sortOrder: row.sortOrder,
});

/** The full catalog, inactive entries included. Use `activeCatalog()` before showing it to customers. */
export async function getBlouseCatalog(): Promise<BlouseCatalog> {
  await ensureSeeded();
  const [pricing, optionRows, designRows] = await Promise.all([
    getPricingSettings(),
    BlouseOptions.find().sort({ groupId: 1, sortOrder: 1 }).lean(),
    BlouseDesigns.find().sort({ sortOrder: 1, name: 1 }).lean(),
  ]);
  return {
    basePrice: pricing.basePrice,
    charges: pricing.charges,
    groups: GROUPS.map((g) => ({
      ...g,
      options: optionRows
        .filter((o) => o.groupId === g.id)
        .map((o) => ({
          id: o.id,
          name: o.name,
          price: o.price,
          image: optionArtPath(g.id, o.id),
          isActive: o.isActive,
          sortOrder: o.sortOrder,
        })),
    })),
    designs: designRows.map((d) => toDesign(plain<BlouseDesignRow>(d))),
  };
}

/* ---------------- Pricing ---------------- */

export async function saveBlousePricing(input: z.infer<typeof blousePricingSchema>): Promise<BlouseCatalog> {
  await ensureSeeded();
  const existing = await BlouseOptions.find({}, { groupId: 1, id: 1 }).lean();
  const known = new Set(existing.map((o) => `${o.groupId}/${o.id}`));

  for (const o of input.options) {
    // Only existing options can be edited here; ids and groups are never created from the request.
    if (!GROUP_IDS.has(o.groupId) || !known.has(`${o.groupId}/${o.id}`)) {
      throw badRequest(`Unknown option "${o.groupId}/${o.id}".`);
    }
  }
  for (const g of GROUPS) {
    const sent = input.options.filter((o) => o.groupId === g.id);
    const stored = existing.filter((o) => o.groupId === g.id);
    const activeAfter = stored.filter((s) => sent.find((o) => o.id === s.id)?.isActive ?? true).length;
    if (activeAfter === 0) throw badRequest(`Keep at least one ${g.label.toLowerCase()} option active.`);
  }

  const timestamp = now();
  const value: PricingSettings = { basePrice: input.basePrice, charges: input.charges };
  await Settings.updateOne({ _id: PRICING_KEY }, { $set: { value, updatedAt: timestamp } }, { upsert: true });
  if (input.options.length > 0) {
    await BlouseOptions.bulkWrite(
      input.options.map((o) => ({
        updateOne: {
          filter: { _id: `${o.groupId}/${o.id}` },
          update: { $set: { name: o.name, price: o.price, isActive: o.isActive, sortOrder: o.sortOrder, updatedAt: timestamp } },
        },
      }))
    );
  }
  return getBlouseCatalog();
}

/* ---------------- Designs ---------------- */

type DesignInput = z.infer<typeof blouseDesignSchema>;

async function assertSlugFree(slug: string, exceptId?: string) {
  const row = await BlouseDesigns.findOne({ slug }, { _id: 1 }).lean();
  if (row && row._id !== exceptId) throw conflict(`Another design already uses the slug "${slug}".`);
}

export async function createBlouseDesign(input: DesignInput): Promise<CatalogDesign> {
  await assertSlugFree(input.slug);
  const timestamp = now();
  const doc = await BlouseDesigns.create({ _id: newId("bd"), ...input, createdAt: timestamp, updatedAt: timestamp });
  return toDesign(plain<BlouseDesignRow>(doc.toObject()));
}

export async function updateBlouseDesign(id: string, input: DesignInput): Promise<CatalogDesign> {
  await assertSlugFree(input.slug, id);
  const doc = await BlouseDesigns.findOneAndUpdate({ _id: id }, { $set: { ...input, updatedAt: now() } }, { new: true }).lean();
  if (!doc) throw notFound("Design not found.");
  return toDesign(plain<BlouseDesignRow>(doc));
}

/** Designs that appear on past orders are kept (deactivate them instead) so order history stays intact. */
export async function deleteBlouseDesign(id: string) {
  const n = await CustomBlouses.countDocuments({ "customization.designId": id });
  if (n > 0) {
    throw conflict(
      `This design is on ${n} ${n === 1 ? "order" : "orders"}, so it can't be deleted. Deactivate it to hide it from the builder.`
    );
  }
  const res = await BlouseDesigns.deleteOne({ _id: id });
  if (res.deletedCount === 0) throw notFound("Design not found.");
}
