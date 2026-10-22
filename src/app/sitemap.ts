import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/config";
import { listCollections } from "@/server/services/admin";
import { listProductRows } from "@/server/services/products";

export const dynamic = "force-dynamic";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/sarees", priority: 0.9, changeFrequency: "daily" },
  { path: "/chudithars", priority: 0.9, changeFrequency: "daily" },
  { path: "/new-arrivals", priority: 0.8, changeFrequency: "daily" },
  { path: "/shop", priority: 0.8, changeFrequency: "daily" },
  { path: "/collections", priority: 0.8, changeFrequency: "weekly" },
  { path: "/custom-blouse", priority: 0.8, changeFrequency: "monthly" },
  { path: "/lookbook", priority: 0.6, changeFrequency: "weekly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/faqs", priority: 0.4, changeFrequency: "monthly" },
  { path: "/shipping", priority: 0.4, changeFrequency: "monthly" },
  { path: "/returns", priority: 0.4, changeFrequency: "monthly" },
  { path: "/size-guide", priority: 0.4, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.2, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([listProductRows(), listCollections()]);
  return [
    ...STATIC_ROUTES.map((r) => ({
      url: absoluteUrl(r.path),
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...collections.map((c) => ({
      url: absoluteUrl(`/collections/${c.id}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: absoluteUrl(`/product/${p.slug}`),
      lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: p.images.slice(0, 1).map((i) => absoluteUrl(i)),
    })),
  ];
}
