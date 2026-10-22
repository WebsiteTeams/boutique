"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { api } from "@/lib/api";
import { toCartItem } from "@/lib/cart";
import { useCart, useToast, useWishlist } from "@/context/store";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";

export default function WishlistPage() {
  const { wishlist, hydrated, toggle, clear } = useWishlist();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const key = wishlist.join(",");
  const known = new Set(catalog.map((p) => p.id));
  const needsFetch = wishlist.some((id) => !known.has(id)) && loadedKey !== key;

  useEffect(() => {
    if (!hydrated || !needsFetch) return;
    let cancelled = false;
    api<{ products: Product[] }>(`/api/products?ids=${encodeURIComponent(key)}`)
      .then((res) => {
        if (cancelled) return;
        setCatalog(res.products);
        setLoadedKey(key);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, needsFetch, key]);

  // Keep wishlist order; removals update instantly without a refetch.
  const products = wishlist
    .map((id) => catalog.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));
  const loading = !hydrated || (needsFetch && !failed);

  const addToBag = (p: Product) => {
    if (!p.inStock) return;
    addItem(toCartItem(p));
    showToast("Added to bag", p.name);
  };

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-32 sm:px-8 lg:px-10 lg:pt-40">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-heading-xl text-charcoal">Wishlist</h1>
          <p className="mt-2 text-mist">
            {products.length > 0
              ? `${products.length} ${products.length === 1 ? "piece" : "pieces"} you love`
              : "Pieces you love, saved for later"}
          </p>
        </div>
        {products.length > 0 && (
          <button
            onClick={() => {
              clear();
              showToast("Wishlist cleared", undefined, "info");
            }}
            type="button"
            className="flex min-h-10 items-center gap-1.5 px-1 text-xs text-taupe underline underline-offset-4 hover:text-charcoal"
          >
            <Trash2 width={13} height={13} />
            Clear all
          </button>
        )}
      </div>

      {failed ? (
        <div className="rounded-2xl border border-clay/60 bg-white/60">
          <EmptyState
            icon={<Heart width={26} height={26} />}
            title="We couldn't load your wishlist"
            titleAs="h2"
            description="Please check your connection and try again."
            actionLabel="Retry"
            onAction={() => {
              setFailed(false);
              setLoadedKey(null);
            }}
          />
        </div>
      ) : loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-[3/5] animate-pulse rounded-2xl bg-cream/70" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-clay/60 bg-white/60">
          <EmptyState
            icon={<Heart width={26} height={26} />}
            title="Your wishlist is empty"
            titleAs="h2"
            description="Tap the heart on any piece to save it here for later."
            actionLabel="Discover the Collection"
            href="/shop"
          />
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {products.map((p) => (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group overflow-hidden rounded-2xl border border-clay/60 bg-white/60"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-cream">
                  <Link href={`/product/${p.slug}`} className="block h-full w-full" aria-label={p.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-700 ease-luxe motion-safe:group-hover:scale-105"
                    />
                  </Link>
                  <button
                    onClick={() => {
                      toggle(p.id);
                      showToast("Removed from wishlist", undefined, "info");
                    }}
                    aria-label={`Remove ${p.name} from wishlist`}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-sm transition-transform hover:scale-110"
                  >
                    <Heart width={16} height={16} fill="currentColor" />
                  </button>
                </div>
                <div className="p-4">
                  <p className="truncate text-sm font-medium text-charcoal">{p.name}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-sm tabular-nums text-charcoal">{formatINR(p.price)}</span>
                    {p.mrp && (
                      <span className="text-xs tabular-nums text-taupe line-through">
                        {formatINR(p.mrp)}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    fullWidth
                    className="mt-3"
                    onClick={() => addToBag(p)}
                    disabled={!p.inStock}
                  >
                    {p.inStock ? "Add to Bag" : "Out of Stock"}
                  </Button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
