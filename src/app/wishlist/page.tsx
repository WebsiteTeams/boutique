"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, Trash2 } from "lucide-react";
import { useState } from "react";
import { getProductById } from "@/lib/data";
import { useCart, useToast, useWishlist } from "@/context/store";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button, LinkButton } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";

export default function WishlistPage() {
  const { wishlist, toggle, clear } = useWishlist();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [adding, setAdding] = useState<string | null>(null);

  const products = wishlist
    .map((id) => getProductById(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const addToBag = (id: string) => {
    const p = getProductById(id);
    if (!p) return;
    setAdding(id);
    setTimeout(() => {
      addItem({
        key: `${p.id}-${p.sizes?.[0] ?? "Free Size"}`,
        productId: p.id,
        name: p.name,
        image: p.images[0],
        price: p.price,
        mrp: p.mrp,
        size: p.sizes?.[0] ?? "Free Size",
        color: p.color,
        quantity: 1,
        customizable: p.customizable,
      });
      setAdding(null);
    }, 350);
  };

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-32 sm:px-8 lg:px-10 lg:pt-40">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="serif-display text-4xl text-charcoal">Wishlist</h1>
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
            className="flex items-center gap-1.5 text-xs text-taupe underline underline-offset-4 hover:text-charcoal"
          >
            <Trash2 width={13} height={13} />
            Clear all
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-clay/60 bg-white/60">
          <EmptyState
            icon={<Heart width={26} height={26} />}
            title="Your wishlist is empty"
            description="Tap the heart on any piece to save it here for later."
            actionLabel="Discover the Collection"
            href="/sarees"
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
                  <LinkButton href={`/product/${p.slug}`} variant="ghost" className="h-full w-full p-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </LinkButton>
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
                    onClick={() => addToBag(p.id)}
                    disabled={adding === p.id}
                  >
                    {adding === p.id ? "Adding…" : "Add to Bag"}
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
