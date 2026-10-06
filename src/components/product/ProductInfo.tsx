"use client";

import { Check, ChevronRight, Heart, ShieldCheck, ShoppingBag, Truck, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { toCartItem } from "@/lib/cart";
import { productStylistMessage } from "@/lib/config";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/pricing";
import { LOW_STOCK_THRESHOLD } from "@/lib/status";
import { cn, discountPercent, formatINR } from "@/lib/utils";
import { trackProductView, useCart, useToast, useWishlist } from "@/context/store";
import { Button, LinkButton } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { Rating } from "@/components/ui/Rating";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { StylistButton } from "@/components/ui/StylistButton";
import { SizeGuide } from "@/components/product/SizeGuide";

function availability(product: Product): { label: string; tone: "ok" | "low" | "out" } {
  if (product.stockState === "Out of Stock") return { label: "Out of stock", tone: "out" };
  if (product.stockState === "Made to Order") {
    return { label: `Made to order · ${product.estimatedDelivery}`, tone: "ok" };
  }
  if (product.stockState === "Low Stock") {
    return { label: `Only ${product.stock} left · ${product.estimatedDelivery}`, tone: "low" };
  }
  return { label: `In stock · ${product.estimatedDelivery}`, tone: "ok" };
}

export function ProductInfo({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const { toggle, has } = useWishlist();
  const router = useRouter();
  const [size, setSize] = useState<string | null>(product.sizes?.[0] ?? null);
  const [color, setColor] = useState(product.color);
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  useEffect(() => {
    trackProductView(product.id);
  }, [product.id]);

  const off = discountPercent(product.price, product.mrp);
  const stock = availability(product);
  const wished = has(product.id);
  const maxQuantity = product.deliveryType === "ready" ? Math.max(1, Math.min(product.stock, 20)) : 20;
  const colorOptions = product.colors.length > 1 ? product.colors : [];
  const isBlouse = product.category === "blouses";

  const addToCart = (): boolean => {
    if (!product.inStock) return false;
    if (product.sizes && !size) {
      showToast("Please select a size", undefined, "error");
      return false;
    }
    addItem(toCartItem(product, { size, color, quantity: Math.min(quantity, maxQuantity) }));
    showToast("Added to bag", product.name);
    return true;
  };

  const buyNow = () => {
    if (addToCart()) router.push("/checkout");
  };

  const toggleWishlist = () => {
    toggle(product.id);
    showToast(wished ? "Removed from wishlist" : "Saved to wishlist", product.name, wished ? "info" : "success");
  };

  return (
    <div>
      {/* Title block */}
      <p className="eyebrow mb-3 capitalize text-gold-deep">
        {product.category} · {product.subcategory}
      </p>
      <div className="flex items-start justify-between gap-4">
        <h1 className="type-title-lg text-charcoal">{product.name}</h1>
        <button
          onClick={toggleWishlist}
          aria-pressed={wished}
          aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-clay text-charcoal transition-colors hover:border-charcoal"
        >
          <Heart
            width={18}
            height={18}
            strokeWidth={1.6}
            className={cn("transition-colors", wished && "fill-gold text-gold")}
          />
        </button>
      </div>
      <a href="#reviews" className="mt-3 inline-block">
        <Rating value={product.rating} count={product.reviewCount} />
      </a>

      {/* Price */}
      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-3">
          <Price price={product.price} mrp={product.mrp} size="lg" />
        </div>
        {off && (
          <p className="mt-1.5 text-sm text-mist">
            You save {formatINR((product.mrp ?? product.price) - product.price)} ({off}%)
          </p>
        )}
        <p className="mt-1 text-xs text-mist">Inclusive of all taxes</p>
      </div>

      {/* Availability */}
      <p
        className={cn(
          "mt-4 flex items-center gap-2 text-sm",
          stock.tone === "ok" && "text-green-800",
          stock.tone === "low" && "text-amber-800",
          stock.tone === "out" && "text-red-700"
        )}
      >
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            stock.tone === "ok" && "bg-green-600",
            stock.tone === "low" && "bg-amber-500",
            stock.tone === "out" && "bg-red-500"
          )}
        />
        {stock.label}
      </p>

      <div className="my-6 h-px bg-clay/60" />

      {/* Size */}
      {product.sizes && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="type-label text-charcoal/80" id="size-label">
              Select Size
            </span>
            <button
              onClick={() => setSizeGuideOpen(true)}
              className="flex items-center gap-1 text-xs font-medium text-gold-deep underline underline-offset-4"
            >
              Size Guide
              <ChevronRight width={13} height={13} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="size-label">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                className={cn(
                  "h-11 min-w-11 rounded-full border px-3.5 text-sm font-medium transition-all",
                  size === s
                    ? "border-charcoal bg-charcoal text-ivory"
                    : "border-clay text-charcoal hover:border-charcoal"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-2 type-meta text-muted">Refer to the size chart before ordering.</p>
        </div>
      )}

      {/* Colour */}
      {colorOptions.length > 0 ? (
        <div className="mt-6">
          <span className="mb-3 block type-label text-charcoal/80" id="colour-label">
            Colour: <span className="normal-case tracking-normal text-charcoal">{color}</span>
          </span>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="colour-label">
            {colorOptions.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-pressed={color === c}
                className={cn(
                  "h-11 rounded-full border px-4 text-sm transition-all",
                  color === c
                    ? "border-charcoal bg-charcoal text-ivory"
                    : "border-clay text-charcoal hover:border-charcoal"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-2 text-sm">
          <span className="text-charcoal/80">Colour:</span>
          <span className="font-medium text-charcoal">{product.color}</span>
        </div>
      )}

      {/* Quantity */}
      <div className="mt-6">
        <span className="mb-2.5 block type-label text-charcoal/80">Quantity</span>
        <QuantityStepper value={quantity} onChange={(q) => setQuantity(Math.min(q, maxQuantity))} max={maxQuantity} />
      </div>

      {/* CTAs */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={addToCart} size="lg" className="flex-1" disabled={!product.inStock}>
          <ShoppingBag width={17} height={17} />
          {product.inStock ? "Add to Bag" : "Out of Stock"}
        </Button>
        <Button
          onClick={buyNow}
          size="lg"
          variant="gold"
          className="flex-1"
          disabled={!product.inStock}
        >
          <Zap width={17} height={17} />
          Buy Now
        </Button>
      </div>

      <StylistButton
        message={productStylistMessage(product)}
        size="lg"
        className="mt-3 w-full"
      />

      {product.customizable && (
        <LinkButton href="/custom-blouse" variant="ghost" size="lg" fullWidth className="mt-2">
          {isBlouse ? "Customize This Blouse" : "Design a Matching Blouse"}
          <ChevronRight width={15} height={15} />
        </LinkButton>
      )}

      {/* Trust */}
      <ul className="mt-8 space-y-2.5 border-t border-clay/60 pt-6 text-sm text-mist">
        <li className="flex items-center gap-3">
          <Truck width={16} height={16} className="text-gold-deep" />
          Free delivery on orders above {formatINR(FREE_DELIVERY_THRESHOLD)}
        </li>
        <li className="flex items-center gap-3">
          <ShieldCheck width={16} height={16} className="text-gold-deep" />
          {product.deliveryType === "made_to_order"
            ? "Made to order — non-returnable, alterations supported"
            : "7-day easy returns & COD available"}
        </li>
        <li className="flex items-center gap-3">
          <Check width={16} height={16} className="text-gold-deep" />
          Authenticity guaranteed — sourced directly from looms
        </li>
      </ul>

      {/* Sticky mobile purchase bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-clay/60 bg-ivory/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-mist">{product.name}</p>
            <p className="text-base font-semibold tabular-nums text-charcoal">{formatINR(product.price)}</p>
          </div>
          <button
            onClick={toggleWishlist}
            aria-pressed={wished}
            aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-clay text-charcoal"
          >
            <Heart width={18} height={18} strokeWidth={1.6} className={cn(wished && "fill-gold text-gold")} />
          </button>
          <Button onClick={addToCart} disabled={!product.inStock} className="shrink-0 px-6">
            <ShoppingBag width={16} height={16} />
            {product.inStock ? "Add to Bag" : "Sold Out"}
          </Button>
        </div>
      </div>

      {product.stockState === "Low Stock" && product.stock <= LOW_STOCK_THRESHOLD && (
        <p className="sr-only" role="status">
          Low stock: only {product.stock} left.
        </p>
      )}

      <SizeGuide open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </div>
  );
}
