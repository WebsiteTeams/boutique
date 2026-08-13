"use client";

import { Check, ChevronRight, ShieldCheck, ShoppingBag, Truck, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/types";
import { cn, discountPercent, formatINR } from "@/lib/utils";
import { useCart, useToast } from "@/context/store";
import { Button, LinkButton } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { Rating } from "@/components/ui/Rating";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { SizeGuide } from "@/components/product/SizeGuide";

export function ProductInfo({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
  const [size, setSize] = useState<string | null>(product.sizes?.[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const off = discountPercent(product.price, product.mrp);

  const addToCart = () => {
    if (!product.inStock) return;
    if (product.sizes && !size) {
      showToast("Please select a size", undefined, "error");
      return;
    }
    addItem({
      key: `${product.id}-${size ?? "Free Size"}`,
      productId: product.id,
      name: product.name,
      image: product.images[0],
      price: product.price,
      mrp: product.mrp,
      size: size ?? "Free Size",
      color: product.color,
      fabric: product.fabric,
      quantity,
      customizable: product.customizable,
    });
    showToast("Added to your bag", product.name);
  };

  const buyNow = () => {
    addToCart();
    router.push("/checkout");
  };

  return (
    <div>
      {/* Title block */}
      <p className="eyebrow mb-3 capitalize text-gold-deep">
        {product.category} · {product.subcategory}
      </p>
      <h1 className="serif-display text-3xl leading-tight text-charcoal sm:text-4xl">
        {product.name}
      </h1>
      <Rating value={product.rating} count={product.reviewCount} className="mt-3" />

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
      </div>

      {/* Availability */}
      <p
        className={cn(
          "mt-4 flex items-center gap-2 text-sm",
          product.inStock ? "text-green-700" : "text-red-600"
        )}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            product.inStock ? "bg-green-600" : "bg-red-500"
          )}
        />
        {product.inStock ? "In stock, ships in 2–4 days" : "Out of stock — request a restock"}
      </p>

      <div className="my-6 h-px bg-clay/60" />

      {/* Size */}
      {product.sizes && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-charcoal/80">
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
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
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
          <p className="mt-2 text-xs text-mist">Fits S–XXL · Refer to the size chart before ordering.</p>
        </div>
      )}

      {/* Color */}
      <div className="mt-6 flex items-center gap-2 text-sm">
        <span className="text-charcoal/80">Colour:</span>
        <span className="font-medium text-charcoal">{product.color}</span>
        <span
          className="ml-1 inline-block h-4 w-4 rounded-full border border-clay"
          style={{ background: product.color.toLowerCase().includes("gold") ? "#c9b26b" : undefined }}
        />
      </div>

      {/* Quantity */}
      <div className="mt-6">
        <span className="mb-2.5 block text-[0.7rem] font-medium uppercase tracking-[0.18em] text-charcoal/80">
          Quantity
        </span>
        <QuantityStepper value={quantity} onChange={setQuantity} />
      </div>

      {/* CTAs */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={addToCart} size="lg" className="flex-1" disabled={!product.inStock}>
          <ShoppingBag width={17} height={17} />
          Add to Cart
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

      {product.customizable && (
        <LinkButton
          href="/custom-blouse"
          variant="outline"
          size="lg"
          fullWidth
          className="mt-3"
        >
          Customize This Blouse
        </LinkButton>
      )}

      {/* Trust */}
      <ul className="mt-8 space-y-2.5 border-t border-clay/60 pt-6 text-sm text-mist">
        <li className="flex items-center gap-3">
          <Truck width={16} height={16} className="text-gold-deep" />
          Free delivery on orders above ₹2,000
        </li>
        <li className="flex items-center gap-3">
          <ShieldCheck width={16} height={16} className="text-gold-deep" />
          7-day easy returns & COD available
        </li>
        <li className="flex items-center gap-3">
          <Check width={16} height={16} className="text-gold-deep" />
          Authenticity guaranteed — sourced directly from looms
        </li>
      </ul>

      <SizeGuide open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </div>
  );
}
