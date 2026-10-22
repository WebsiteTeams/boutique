import type { z } from "zod";
import type { BadgeType, Product } from "@/types";
import { stockState } from "@/lib/status";
import { slugify } from "@/lib/utils";
import type { SortOrder } from "mongoose";
import { productFromDoc, productToDoc, Products, Reviews, WishlistItems, type ProductRow } from "@/server/db/models";
import { conflict, notFound } from "@/server/utils/errors";
import { newId, now } from "@/server/utils/ids";
import type { productSchema } from "@/server/validators";

export type { ProductRow };
export type ProductInput = z.infer<typeof productSchema>;

function badgeFor(row: ProductRow): BadgeType | undefined {
  if (row.isNew) return "new";
  if (row.isBestseller) return "bestseller";
  if (row.mrp && row.mrp > row.price) return "sale";
  return undefined;
}

export function toProduct(row: ProductRow): Product {
  const state = stockState(row);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory,
    price: row.price,
    mrp: row.mrp ?? undefined,
    description: row.description,
    shortDescription: row.shortDescription || undefined,
    fabric: row.fabric,
    color: row.color,
    colors: row.colors,
    occasion: row.occasions[0] ?? "",
    occasions: row.occasions,
    pattern: row.pattern,
    images: row.images,
    videos: row.videos,
    badge: badgeFor(row),
    rating: row.rating,
    reviewCount: row.reviewCount,
    sizes: row.sizes.length > 0 ? row.sizes : undefined,
    isNew: row.isNew,
    isBestSeller: row.isBestseller,
    isFeatured: row.isFeatured,
    inStock: state !== "Out of Stock",
    stock: row.stock,
    stockState: state,
    sku: row.sku || undefined,
    customizable: row.isCustomizable,
    deliveryType: row.deliveryType,
    estimatedDelivery: row.estimatedDelivery,
    care: row.care,
    details: row.details,
    tags: row.tags,
    collections: row.collections,
  };
}

export type ProductSort = "newest" | "popular" | "price-asc" | "price-desc";

export interface ProductFilters {
  category?: string;
  subcategory?: string[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  color?: string[];
  fabric?: string[];
  occasion?: string[];
  pattern?: string[];
  tag?: string[];
  collection?: string;
  /** "in-stock" | "made-to-order" */
  availability?: string[];
  isNew?: boolean;
  isBestseller?: boolean;
  isFeatured?: boolean;
  ids?: string[];
  sort?: ProductSort;
  limit?: number;
  includeInactive?: boolean;
}

const lower = (values: string[] | undefined) => values?.map((v) => v.toLowerCase());
const intersects = (haystack: string[], needles: string[]) => {
  const set = new Set(haystack.map((h) => h.toLowerCase()));
  return needles.some((n) => set.has(n));
};

const escapeRegex = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function listProductRows(filters: ProductFilters = {}): Promise<ProductRow[]> {
  const where: Record<string, unknown> = {};
  if (!filters.includeInactive) where.isActive = true;
  if (filters.category) where.category = filters.category as ProductRow["category"];
  if (filters.subcategory?.length) where.subcategory = { $in: filters.subcategory };
  if (filters.pattern?.length) where.pattern = { $in: filters.pattern };
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {
      ...(filters.minPrice != null ? { $gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { $lte: filters.maxPrice } : {}),
    };
  }
  if (filters.isNew) where.isNewArrival = true;
  if (filters.isBestseller) where.isBestseller = true;
  if (filters.isFeatured) where.isFeatured = true;
  if (filters.ids) {
    if (filters.ids.length === 0) return [];
    where._id = { $in: filters.ids };
  }
  const q = filters.search?.trim();
  if (q) {
    // Case-insensitive "contains" over the same fields the SQL version searched; user text is escaped.
    const term = new RegExp(escapeRegex(q), "i");
    where.$or = ["name", "fabric", "color", "category", "subcategory", "sku", "tags", "occasions"].map((field) => ({
      [field]: term,
    }));
  }

  const order: Record<string, SortOrder> =
    filters.sort === "price-asc"
      ? { price: 1 }
      : filters.sort === "price-desc"
        ? { price: -1 }
        : filters.sort === "popular"
          ? { soldCount: -1, reviewCount: -1, isBestseller: -1 }
          : { isNewArrival: -1, createdAt: -1 };

  let rows = (await Products.find(where).sort({ ...order, _id: 1 }).lean()).map((d: unknown) => productFromDoc(d));

  // Case-insensitive list matching is done in memory, as before.
  const colors = lower(filters.color);
  const fabrics = lower(filters.fabric);
  const occasions = lower(filters.occasion);
  const tags = lower(filters.tag);
  const availability = filters.availability;
  rows = rows.filter((r) => {
    if (colors?.length && !intersects([r.color, ...r.colors], colors)) return false;
    if (fabrics?.length && !fabrics.some((f) => r.fabric.toLowerCase().includes(f))) return false;
    if (occasions?.length && !intersects(r.occasions, occasions)) return false;
    if (tags?.length && !intersects(r.tags, tags)) return false;
    if (filters.collection && !r.collections.includes(filters.collection)) return false;
    if (availability?.length) {
      const ok =
        (availability.includes("in-stock") && r.deliveryType === "ready" && r.stock > 0) ||
        (availability.includes("made-to-order") && r.deliveryType === "made_to_order");
      if (!ok) return false;
    }
    return true;
  });
  return filters.limit ? rows.slice(0, filters.limit) : rows;
}

export const listProducts = async (filters: ProductFilters = {}) =>
  (await listProductRows(filters)).map(toProduct);

export async function getProductRowBySlug(slug: string, includeInactive = false) {
  const row = productFromDoc(await Products.findOne({ slug }).lean());
  if (!row || (!row.isActive && !includeInactive)) return null;
  return row;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = await getProductRowBySlug(slug);
  return row ? toProduct(row) : null;
}

export async function getProductRowById(id: string) {
  return productFromDoc(await Products.findById(id).lean());
}

/** Returns products in the same order as `ids`, skipping unknown / inactive ones. */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const unique = Array.from(new Set(ids)).slice(0, 200);
  const rows = await listProductRows({ ids: unique });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return unique.flatMap((id) => {
    const row = byId.get(id);
    return row ? [toProduct(row)] : [];
  });
}

function relatedScore(a: ProductRow, b: ProductRow) {
  let score = 0;
  if (a.category === b.category) score += 3;
  if (a.fabric === b.fabric) score += 2;
  score += a.occasions.filter((o) => b.occasions.includes(o)).length * 2;
  score += a.tags.filter((t) => b.tags.includes(t)).length;
  score += a.collections.filter((c) => b.collections.includes(c)).length;
  return score;
}

/** "You may also like" — similar pieces from the same category. */
export async function getSimilarProducts(productId: string, count = 6): Promise<Product[]> {
  const rows = await listProductRows();
  const source = rows.find((r) => r.id === productId);
  if (!source) return [];
  return rows
    .filter((r) => r.id !== productId && r.category === source.category)
    .map((r) => ({ r, score: relatedScore(source, r) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((s) => toProduct(s.r));
}

/** "Complete the look" — complementary pieces from other categories for the same occasion. */
export async function getCompleteTheLook(productId: string, count = 6): Promise<Product[]> {
  const rows = await listProductRows();
  const source = rows.find((r) => r.id === productId);
  if (!source) return [];
  return rows
    .filter((r) => r.id !== productId && r.category !== source.category)
    .map((r) => ({
      r,
      score:
        r.occasions.filter((o) => source.occasions.includes(o)).length * 2 +
        (r.isCustomizable ? 2 : 0) +
        (r.isBestseller ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((s) => toProduct(s.r));
}

/** Recommendations from a set of products the shopper has shown interest in. */
export async function getRecommendations(seedIds: string[], count = 8): Promise<Product[]> {
  const rows = await listProductRows();
  const seeds = rows.filter((r) => seedIds.includes(r.id));
  const candidates = rows.filter((r) => !seedIds.includes(r.id));
  if (seeds.length === 0) {
    return candidates
      .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.soldCount - a.soldCount)
      .slice(0, count)
      .map(toProduct);
  }
  return candidates
    .map((r) => ({ r, score: seeds.reduce((s, seed) => s + relatedScore(seed, r), 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((s) => toProduct(s.r));
}

/** Distinct facet values for building filter UIs. */
export async function getFacets(category?: string) {
  const rows = await listProductRows({ category });
  const uniq = (values: string[]) => Array.from(new Set(values.filter(Boolean))).sort();
  return {
    subcategories: uniq(rows.map((r) => r.subcategory)),
    colors: uniq(rows.map((r) => r.color)),
    fabrics: uniq(rows.map((r) => r.fabric)),
    occasions: uniq(rows.flatMap((r) => r.occasions)),
    patterns: uniq(rows.map((r) => r.pattern)),
    tags: uniq(rows.flatMap((r) => r.tags)),
  };
}

/* ---------------- Admin mutations ---------------- */

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "product";
  for (let i = 0; i < 50; i += 1) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const clash = await Products.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!clash) return candidate;
  }
  return `${root}-${Date.now()}`;
}

async function assertSlugFree(slug: string, excludeId?: string) {
  const clash = await Products.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
  if (clash) throw conflict("Another product already uses this URL slug.");
}

const columnsFrom = (input: ProductInput) => ({
  name: input.name,
  description: input.description,
  shortDescription: input.shortDescription,
  price: input.price,
  mrp: input.mrp ?? null,
  images: input.images,
  videos: input.videos,
  category: input.category,
  subcategory: input.subcategory,
  fabric: input.fabric,
  color: input.color,
  colors: input.colors,
  sizes: input.sizes,
  occasions: input.occasions,
  pattern: input.pattern,
  tags: input.tags,
  collections: input.collections,
  care: input.care,
  details: input.details,
  stock: input.stock,
  sku: input.sku,
  isNew: input.isNew,
  isBestseller: input.isBestseller,
  isFeatured: input.isFeatured,
  isCustomizable: input.isCustomizable,
  isActive: input.isActive,
  deliveryType: input.deliveryType,
  estimatedDelivery: input.estimatedDelivery,
});

export async function createProduct(input: ProductInput): Promise<Product> {
  let slug: string;
  if (input.slug) {
    await assertSlugFree(input.slug);
    slug = input.slug;
  } else {
    slug = await uniqueSlug(input.name);
  }
  const timestamp = now();
  const doc = await Products.create({ _id: newId("pr"), slug, ...productToDoc(columnsFrom(input)), createdAt: timestamp, updatedAt: timestamp });
  return toProduct(productFromDoc(doc.toObject()));
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const existing = await getProductRowById(id);
  if (!existing) throw notFound("Product not found.");
  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    await assertSlugFree(input.slug, id);
    slug = input.slug;
  }
  const doc = await Products.findOneAndUpdate(
    { _id: id },
    { $set: { slug, ...productToDoc(columnsFrom(input)), updatedAt: now() } },
    { new: true }
  ).lean();
  if (!doc) throw notFound("Product not found.");
  return toProduct(productFromDoc(doc));
}

export async function deleteProduct(id: string) {
  const res = await Products.deleteOne({ _id: id });
  if (res.deletedCount === 0) throw notFound("Product not found.");
  // The SQL schema cascaded these; MongoDB has no foreign keys, so remove them explicitly.
  await Promise.all([WishlistItems.deleteMany({ productId: id }), Reviews.deleteMany({ productId: id })]);
}

/** Sets an absolute stock level or applies a relative adjustment (e.g. an in-store sale). */
export async function updateStock(id: string, change: { stock?: number; adjust?: number }): Promise<Product> {
  const update =
    change.stock != null
      ? { $set: { stock: change.stock, updatedAt: now() } }
      : [{ $set: { stock: { $max: [0, { $add: ["$stock", change.adjust ?? 0] }] }, updatedAt: now() } }];
  const doc = await Products.findOneAndUpdate({ _id: id }, update, { new: true, updatePipeline: Array.isArray(update) }).lean();
  if (!doc) throw notFound("Product not found.");
  return toProduct(productFromDoc(doc));
}
