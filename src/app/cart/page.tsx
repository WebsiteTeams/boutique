"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Tag, Trash2, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FREE_DELIVERY_THRESHOLD, SHIPPING_FEE, getProductById } from "@/lib/data";
import { useCart, useToast } from "@/context/store";
import { cn, formatINR } from "@/lib/utils";
import { Button, LinkButton } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<null | { code: string; off: number }>(null);

  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const shipping = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : SHIPPING_FEE;
  const discount = applied ? Math.min(applied.off, subtotal) : 0;
  const total = subtotal - discount + shipping;

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (code === "UMA10") {
      setApplied({ code, off: Math.round(subtotal * 0.1) });
      showToast("Coupon applied", "UMA10 — 10% off unlocked");
    } else {
      showToast("Invalid coupon", "Try UMA10 for 10% off", "error");
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-32 pb-16 sm:px-8 lg:pt-40">
        <h1 className="type-heading-xl mb-8 text-center text-charcoal">Your Bag</h1>
        <div className="rounded-2xl border border-clay/60 bg-white/60">
          <EmptyState
            icon={<ShoppingBag width={26} height={26} />}
            title="Your bag is empty"
            description="Fill it with sarees, chudithars and bespoke blouses you'll love."
            actionLabel="Start Shopping"
            href="/sarees"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-32 sm:px-8 lg:px-10 lg:pt-40">
      <h1 className="type-heading-xl mb-8 text-charcoal">Your Bag</h1>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        {/* Items */}
        <div>
          <div className="mb-4 flex items-center justify-between text-sm text-mist">
            <span>{items.length} {items.length === 1 ? "item" : "items"}</span>
            <button
              onClick={() => {
                clearCart();
                showToast("Cart cleared", undefined, "info");
              }}
              className="flex items-center gap-1.5 text-xs text-taupe underline underline-offset-4 hover:text-charcoal"
            >
              <Trash2 width={13} height={13} />
              Clear bag
            </button>
          </div>

          {remaining > 0 && (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl bg-cream px-4 py-3 text-sm text-mist">
              <Truck width={16} height={16} className="shrink-0 text-gold-deep" />
              Add <span className="font-medium text-charcoal">{formatINR(remaining)}</span> more to unlock free delivery.
              <span className="ml-auto hidden text-xs text-taupe sm:block">Minimum ₹{formatINR(FREE_DELIVERY_THRESHOLD)}</span>
            </div>
          )}

          <ul className="divide-y divide-clay/50 border-y border-clay/50">
            <AnimatePresence initial={false}>
              {items.map((item) => {
                const product = getProductById(item.productId);
                const href = `/product/${product?.slug ?? "bespoke-silk-custom-blouse"}`;
                return (
                  <motion.li
                    key={item.key}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-5 py-6"
                  >
                    <Link href={href} className="relative h-32 w-26 shrink-0 overflow-hidden rounded-xl bg-cream sm:w-28">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      {item.customizable && (
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-gold px-2 py-0.5 text-[0.55rem] font-medium uppercase tracking-wide text-white">
                          Bespoke
                        </span>
                      )}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={href} className="block truncate font-medium text-charcoal hover:text-gold-deep">
                            {item.name}
                          </Link>
                          <p className="mt-1 text-xs capitalize text-mist">
                            {item.size}
                            {item.color ? ` · ${item.color}` : ""}
                            {item.fabric ? ` · ${item.fabric}` : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.key)}
                          className="shrink-0 text-taupe transition-colors hover:text-red-600"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 width={16} height={16} />
                        </button>
                      </div>

                      {item.customization && (
                        <p className="mt-2 line-clamp-2 rounded-lg bg-cream px-3 py-2 text-xs italic text-mist">
                          {item.customization.neck} neck · {item.customization.sleeve} · {item.customization.back} · {item.customization.embroidery}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between pt-3">
                        <QuantityStepper
                          size="sm"
                          value={item.quantity}
                          onChange={(q) => updateQuantity(item.key, q)}
                        />
                        <div className="text-right">
                          <span className="block font-medium tabular-nums text-charcoal">
                            {formatINR(item.price * item.quantity)}
                          </span>
                          {item.mrp && (
                            <span className="text-xs tabular-nums text-taupe line-through">
                              {formatINR(item.mrp * item.quantity)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          <div className="mt-6 flex justify-center sm:justify-start">
            <LinkButton href="/sarees" variant="outline" size="sm">
              Continue Shopping
              <ArrowRight width={14} height={14} />
            </LinkButton>
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-2xl border border-clay/60 bg-white/60 p-6 sm:p-7">
            <h2 className="type-heading-md mb-5 text-charcoal">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-mist">Subtotal</span>
                <span className="tabular-nums text-charcoal">{formatINR(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-mist">Shipping</span>
                <span className="tabular-nums text-charcoal">
                  {shipping === 0 ? <span className="text-gold-deep">Free</span> : formatINR(shipping)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-gold-deep">
                  <span className="flex items-center gap-1.5">
                    <Tag width={13} height={13} />
                    Coupon {applied?.code}
                  </span>
                  <span className="tabular-nums">−{formatINR(discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-clay/60 pt-4 text-base">
                <span className="font-medium text-charcoal">Total</span>
                <span className="type-price-lg tabular-nums text-charcoal">
                  {formatINR(total)}
                </span>
              </div>
              <p className="text-xs text-mist">Inclusive of all taxes. GST invoice issued.</p>
            </div>

            {/* Coupon */}
            <div className="mt-6">
              <div className="flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Coupon code (try UMA10)"
                  className="h-11 flex-1 rounded-full border border-clay bg-white px-4 text-sm text-charcoal placeholder:text-taupe focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold-soft/40"
                  aria-label="Coupon code"
                />
                <button
                  onClick={applyCoupon}
                  className={cn(
                    "h-11 rounded-full px-5 text-[0.68rem] font-medium uppercase tracking-[0.16em] transition-colors",
                    applied
                      ? "cursor-default bg-gold-soft/30 text-gold-deep"
                      : "bg-charcoal text-ivory hover:bg-ink"
                  )}
                >
                  Apply
                </button>
              </div>
            </div>

            <Button fullWidth size="lg" className="mt-6" onClick={() => router.push("/checkout")}>
              Proceed to Checkout
              <ArrowRight width={16} height={16} />
            </Button>

            <div className="mt-4 flex items-center justify-center gap-3 text-xs text-mist">
              <span>Secure UPI · Cards</span>
              <span className="h-1 w-1 rounded-full bg-taupe" />
              <span>COD Available</span>
              <span className="h-1 w-1 rounded-full bg-taupe" />
              <span>7-Day Returns</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
