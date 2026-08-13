"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, Heart, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";
import { useCart, useToast, useWishlist } from "@/context/store";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { QuickViewModal } from "@/components/product/QuickViewModal";

interface ProductCardProps {
  product: Product;
  className?: string;
  index?: number;
}

export function ProductCard({ product, className, index = 0 }: ProductCardProps) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const { toggle, has } = useWishlist();
  const [quickView, setQuickView] = useState(false);
  const wished = has(product.id);

  const defaultSize = product.sizes?.[0] ?? "Free Size";

  const quickAdd = () => {
    if (!product.inStock) return;
    addItem({
      key: `${product.id}-${defaultSize}`,
      productId: product.id,
      name: product.name,
      image: product.images[0],
      price: product.price,
      mrp: product.mrp,
      size: defaultSize,
      color: product.color,
      fabric: product.fabric,
      quantity: 1,
      customizable: product.customizable,
    });
    showToast("Added to your bag", product.name);
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, delay: Math.min(index % 4, 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
        className={cn("group relative flex flex-col", className)}
      >
        <div className="relative overflow-hidden rounded-xl bg-cream">
          <Link href={`/product/${product.slug}`} className="relative block aspect-[4/5]" aria-label={product.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out group-hover:opacity-0"
            />
            {product.images[1] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[1]}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full scale-[1.02] object-cover opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
              />
            )}

            {product.badge && (
              <div className="absolute left-3 top-3">
                <Badge type={product.badge} />
              </div>
            )}

            {!product.inStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-ivory/70 backdrop-blur-[2px]">
                <span className="eyebrow text-charcoal">Out of Stock</span>
              </div>
            )}
          </Link>

          {/* Wishlist */}
          <button
            onClick={() => {
              toggle(product.id);
              showToast(
                wished ? "Removed from wishlist" : "Saved to wishlist",
                product.name,
                wished ? "info" : "success"
              );
            }}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 shadow-soft backdrop-blur transition-all duration-300 hover:scale-105"
          >
            <Heart
              width={17}
              height={17}
              className={cn(
                "transition-colors",
                wished ? "fill-gold text-gold" : "text-charcoal/70"
              )}
              strokeWidth={1.6}
            />
          </button>

          {/* Quick view (desktop) */}
          <button
            onClick={() => setQuickView(true)}
            className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-label={`Quick view ${product.name}`}
          >
            <span className="flex items-center gap-2 rounded-full bg-ivory/90 px-4 py-2 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-charcoal shadow-lifted backdrop-blur">
              <Eye width={14} height={14} />
              Quick View
            </span>
          </button>

          {/* Quick add (desktop) */}
          {product.inStock && (
            <button
              onClick={quickAdd}
              className="absolute inset-x-3 bottom-3 hidden translate-y-2 items-center justify-center rounded-full bg-charcoal py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.2em] text-ivory opacity-0 shadow-lifted transition-all duration-300 hover:bg-ink lg:flex group-hover:translate-y-0 group-hover:opacity-100"
            >
              Add to Cart
            </button>
          )}

          {/* Quick add (mobile) */}
          {product.inStock && (
            <button
              onClick={quickAdd}
              className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-charcoal text-ivory shadow-lifted lg:hidden"
              aria-label={`Add ${product.name} to cart`}
            >
              <Plus width={18} height={18} />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-1 px-0.5">
          <div className="flex items-baseline justify-between gap-2">
            <Link
              href={`/product/${product.slug}`}
              className="truncate text-[0.95rem] font-medium tracking-wide text-charcoal transition-colors hover:text-gold-deep"
            >
              {product.name}
            </Link>
          </div>
          <p className="text-xs capitalize text-mist">
            {product.fabric} · {product.color}
          </p>
          <Price price={product.price} mrp={product.mrp} size="sm" className="mt-0.5" />
        </div>
      </motion.article>

      <AnimatePresence>
        {quickView && (
          <QuickViewModal product={product} onClose={() => setQuickView(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
