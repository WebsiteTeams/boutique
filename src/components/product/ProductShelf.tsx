"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { api } from "@/lib/api";
import { useRecentlyViewed, useWishlist } from "@/context/store";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface ShelfProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  products: Product[];
  className?: string;
}

function Shelf({ eyebrow, title, subtitle, products, className }: ShelfProps) {
  if (products.length === 0) return null;
  return (
    <section className={className ?? "border-t border-clay/50 py-16 lg:py-20"}>
      <div className="mx-auto max-w-[1440px]">
        <div className="px-5 sm:px-8 lg:px-10">
          <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
        </div>
        <ProductCarousel products={products} />
      </div>
    </section>
  );
}

/** Products this shopper looked at recently (kept on their device). */
export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const recent = useRecentlyViewed();
  const [products, setProducts] = useState<Product[]>([]);
  const ids = recent.filter((id) => id !== excludeId).slice(0, 8);
  const key = ids.join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    api<{ products: Product[] }>(`/api/products?ids=${encodeURIComponent(key)}`)
      .then((res) => {
        if (!cancelled) setProducts(res.products);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [key]);

  return (
    <Shelf
      eyebrow="Your Edit"
      title="Recently Viewed"
      products={key ? products.filter((p) => ids.includes(p.id)) : []}
    />
  );
}

/** Picks based on what the shopper has viewed or saved; featured pieces otherwise. */
export function RecommendedForYou() {
  const recent = useRecentlyViewed();
  const { wishlist, hydrated } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const seeds = Array.from(new Set([...wishlist, ...recent])).slice(0, 12).join(",");

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    api<{ products: Product[] }>(`/api/products/recommendations?seeds=${encodeURIComponent(seeds)}`)
      .then((res) => {
        if (!cancelled) setProducts(res.products);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [seeds, hydrated]);

  return (
    <Shelf
      eyebrow={seeds ? "Picked For You" : "Designer Picks"}
      title={seeds ? "Recommended For You" : "From Our Design Desk"}
      subtitle={
        seeds
          ? "Based on the pieces you have been viewing and saving."
          : "Hand-selected by our design team this season."
      }
      products={products}
      className="py-20 lg:py-28"
    />
  );
}
