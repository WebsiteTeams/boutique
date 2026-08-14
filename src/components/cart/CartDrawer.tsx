"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Truck, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FREE_DELIVERY_THRESHOLD, getProductById } from "@/lib/data";
import { useCart } from "@/context/store";
import { cn, formatINR } from "@/lib/utils";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Button, LinkButton } from "@/components/ui/Button";

export function CartDrawer() {
  const { items, isOpen, closeCart, subtotal, updateQuantity, removeItem, count } = useCart();
  const router = useRouter();

  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[65]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={closeCart} aria-hidden />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-ivory"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-clay/60 px-6 py-5">
              <h2 className="type-heading-md flex items-center gap-2.5 text-charcoal">
                <ShoppingBag width={18} height={18} />
                Your Bag
                <span className="text-sm text-mist">({count})</span>
              </h2>
              <button
                onClick={closeCart}
                className="rounded-full p-2 text-charcoal/60 transition-colors hover:bg-sand/60 hover:text-charcoal"
                aria-label="Close cart"
              >
                <X width={20} height={20} />
              </button>
            </div>

            {/* Free delivery progress */}
            {items.length > 0 && (
              <div className="border-b border-clay/40 px-6 py-4">
                {remaining > 0 ? (
                  <p className="flex items-center gap-2 text-xs text-mist">
                    <Truck width={14} height={14} className="text-gold-deep" />
                    Add <span className="font-medium text-charcoal">{formatINR(remaining)}</span> more
                    to unlock free delivery.
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-xs font-medium text-gold-deep">
                    <Truck width={14} height={14} />
                    You&apos;ve unlocked free delivery.
                  </p>
                )}
                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-sand">
                  <motion.div
                    className="h-full rounded-full bg-gold"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream text-gold-deep">
                    <ShoppingBag width={24} height={24} />
                  </div>
                  <p className="type-heading-md text-charcoal">Your bag is empty</p>
                  <p className="mt-1.5 max-w-[26ch] text-sm text-mist">
                    Discover sarees, chudithars and made-to-measure blouses.
                  </p>
                  <LinkButton href="/sarees" variant="outline" size="sm" className="mt-6">
                    Start Shopping
                  </LinkButton>
                </div>
              ) : (
                <ul className="divide-y divide-clay/50">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.key}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: 24 }}
                        className="flex gap-4 py-5"
                      >
                        <Link
                          href={`/product/${getProductById(item.productId)?.slug ?? "bespoke-silk-custom-blouse"}`}
                          onClick={closeCart}
                          className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-cream"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link
                                href={`/product/${getProductById(item.productId)?.slug ?? "bespoke-silk-custom-blouse"}`}
                                onClick={closeCart}
                                className="block truncate text-sm font-medium text-charcoal hover:text-gold-deep"
                              >
                                {item.name}
                              </Link>
                              <p className="mt-0.5 text-xs capitalize text-mist">
                                {item.size}
                                {item.color ? ` · ${item.color}` : ""}
                              </p>
                            </div>
                            <button
                              onClick={() => removeItem(item.key)}
                              className="shrink-0 text-xs text-taupe underline underline-offset-4 hover:text-charcoal"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <QuantityStepper
                              size="sm"
                              value={item.quantity}
                              onChange={(q) => updateQuantity(item.key, q)}
                            />
                            <span className="text-sm font-medium tabular-nums text-charcoal">
                              {formatINR(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-clay/60 px-6 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-mist">Subtotal</span>
                  <span className="text-lg font-medium tabular-nums text-charcoal">
                    {formatINR(subtotal)}
                  </span>
                </div>
                <Button
                  fullWidth
                  onClick={() => {
                    closeCart();
                    router.push("/checkout");
                  }}
                >
                  Checkout
                  <ArrowRight width={16} height={16} />
                </Button>
                <button
                  onClick={closeCart}
                  className={cn(
                    "mt-3 w-full text-center text-xs font-medium uppercase tracking-[0.18em] text-charcoal/70 transition-colors hover:text-charcoal"
                  )}
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
