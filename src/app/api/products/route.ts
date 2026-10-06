import { route } from "@/server/http";
import { getProductsByIds, listProducts, type ProductSort } from "@/server/services/products";

const list = (query: URLSearchParams, key: string) => {
  const values = query.getAll(key).flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);
  return values.length > 0 ? values.slice(0, 30) : undefined;
};
const num = (query: URLSearchParams, key: string) => {
  const raw = query.get(key);
  const value = raw == null ? NaN : Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
};
const SORTS: ProductSort[] = ["newest", "popular", "price-asc", "price-desc"];

/**
 * Catalog search. Supports: q, ids, category, sub, color, fabric, occasion,
 * pattern, tag, collection, availability (in-stock | made-to-order), minPrice,
 * maxPrice, new, bestseller, featured, sort, limit.
 */
export const GET = route({}, async ({ query }) => {
  const ids = list(query, "ids");
  if (ids) return { products: await getProductsByIds(ids) };
  const sort = query.get("sort") as ProductSort | null;
  const products = await listProducts({
    search: query.get("q")?.slice(0, 80) ?? undefined,
    category: query.get("category") ?? undefined,
    subcategory: list(query, "sub"),
    color: list(query, "color"),
    fabric: list(query, "fabric"),
    occasion: list(query, "occasion"),
    pattern: list(query, "pattern"),
    tag: list(query, "tag"),
    collection: query.get("collection") ?? undefined,
    availability: list(query, "availability"),
    minPrice: num(query, "minPrice"),
    maxPrice: num(query, "maxPrice"),
    isNew: query.get("new") === "1",
    isBestseller: query.get("bestseller") === "1",
    isFeatured: query.get("featured") === "1",
    sort: sort && SORTS.includes(sort) ? sort : undefined,
    limit: Math.min(num(query, "limit") ?? 60, 100),
  });
  return { products };
});
