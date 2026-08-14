"use client";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ArrowRight, Check, Heart, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/types";
import { cn, discountPercent, formatINR } from "@/lib/utils";
import { useCart, useToast, useWishlist } from "@/context/store";
import { Button } from "@/components/ui/Button";
import { Rating } from "@/components/ui/Rating";
import { Badge } from "@/components/ui/Badge";

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const mobileVariants = {
  hidden: { opacity: 0, y: "100%" },
  show: { opacity: 1, y: "0%", transition: { duration: 0.45, ease: EASE } },
  exit: { opacity: 0, y: "100%", transition: { duration: 0.25, ease: "easeIn" as const } },
};

const desktopVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE } },
  exit: { opacity: 0, y: 8, scale: 0.97, transition: { duration: 0.25, ease: "easeIn" as const } },
};

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const { toggle, has } = useWishlist();
  const [size, setSize] = useState<string | null>(product.sizes?.[0] ?? null);
  const [active, setActive] = useState(0);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const wished = has(product.id);
  const off = discountPercent(product.price, product.mrp);
  const showReadMore = product.description.length > 110;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusables = dialog.querySelectorAll<HTMLElement>(
      'button, a[href], [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const current = document.activeElement;
    if (e.shiftKey) {
      if (current === first || !dialog.contains(current)) {
        e.preventDefault();
        last.focus();
      }
    } else if (current === last || !dialog.contains(current)) {
      e.preventDefault();
      first.focus();
    }
  };

  const add = () => {
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
      quantity: 1,
      customizable: product.customizable,
    });
    showToast("Added to cart", product.name);
    onClose();
  };

  const toggleWishlist = () => {
    toggle(product.id);
    showToast(
      wished ? "Removed from wishlist" : "Added to wishlist",
      product.name,
      wished ? "info" : "success"
    );
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 60;
    if (info.offset.x < -threshold) {
      setActive((a) => Math.min(a + 1, product.images.length - 1));
    } else if (info.offset.x > threshold) {
      setActive((a) => Math.max(a - 1, 0));
    }
  };

  const details: [string, string][] = [
    ["Fabric", product.fabric],
    ["Colour", product.color],
    ["Pattern", product.pattern],
    ["Occasion", product.occasion],
  ];

  const trust = [
    "Free shipping on orders above ₹2,000",
    "Secure payments · COD available",
    "7-day easy returns",
  ];

  const renderThumbs = (className: string) => (
    <div className={className}>
      {product.images.map((src, i) => (
        <button
          key={i}
          onClick={() => setActive(i)}
          aria-label={`View image ${i + 1}`}
          aria-current={active === i}
          className={cn(
            "relative h-[64px] w-[52px] shrink-0 overflow-hidden border bg-cream transition-all duration-300",
            "lg:h-[92px] lg:w-[100px]",
            active === i
              ? "border-gold-deep opacity-100"
              : "border-clay/70 opacity-75 hover:scale-[1.03] hover:opacity-100"
          )}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes="100px"
            loading="lazy"
            className="object-cover"
          />
        </button>
      ))}
    </div>
  );

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-[rgba(20,18,15,0.55)] backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Quick view — ${product.name}`}
        tabIndex={-1}
        onKeyDown={trapFocus}
        variants={isMobile ? mobileVariants : desktopVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        className={cn(
          "relative flex w-full max-h-[94svh] flex-col overflow-hidden bg-ivory",
          "rounded-t-2xl sm:max-w-3xl sm:rounded-2xl",
          "shadow-[0_24px_80px_rgb(23_20_14/0.45)]",
          "lg:grid lg:h-[min(780px,90vh)] lg:max-h-[90vh] lg:w-[min(1500px,95vw)] lg:grid-cols-[1.4fr_1fr] lg:rounded-2xl"
        )}
      >
        {/* Close */}
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute right-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-ivory/90 text-charcoal shadow-soft backdrop-blur transition-colors duration-300 hover:bg-ink hover:text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <X width={20} height={20} strokeWidth={1.5} />
        </button>

        {/* Image column */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.5, ease: EASE }}
          className="flex shrink-0 flex-col bg-cream lg:h-full lg:flex-row"
        >
          {/* Main frame */}
          <motion.div
            drag={isMobile ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="group relative h-[44svh] min-h-0 w-full overflow-hidden lg:h-full lg:flex-1"
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={active}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="absolute inset-0 transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]"
              >
                <Image
                  src={product.images[active]}
                  alt={`${product.name} — image ${active + 1}`}
                  fill
                  priority={active === 0}
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>

            {product.badge && (
              <div className="pointer-events-none absolute left-4 top-4 z-10">
                <Badge type={product.badge} />
              </div>
            )}

            <div className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-full bg-ink/45 px-3 py-1 type-label-sm tabular-nums text-ivory backdrop-blur">
              {String(active + 1).padStart(2, "0")} / {String(product.images.length).padStart(2, "0")}
            </div>
          </motion.div>

          {/* Thumbnails - Desktop */}
          {renderThumbs("hidden gap-3 p-4 lg:flex lg:flex-col lg:overflow-y-auto no-scrollbar")}

          {/* Thumbnails - Mobile */}
          {renderThumbs("flex gap-2.5 overflow-x-auto px-4 py-3 lg:hidden no-scrollbar")}
        </motion.div>

        {/* Info column */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5, ease: EASE }}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-clay/50 bg-ivory p-5 pb-8 sm:p-8 lg:h-full lg:border-l lg:border-t-0 lg:p-10"
        >
          <p className="type-label-sm text-gold-deep">
            {product.category}
          </p>

          <div className="mt-2.5 flex items-start justify-between gap-4">
            <h3 className="type-title-qv text-charcoal">
              {product.name}
            </h3>
            <button
              onClick={toggleWishlist}
              aria-pressed={wished}
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-clay/70 text-charcoal/70 transition-all duration-300 hover:border-gold-deep hover:text-gold-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <Heart
                width={17}
                height={17}
                strokeWidth={1.6}
                className={cn(wished && "fill-gold-deep text-gold-deep")}
              />
            </button>
          </div>

          <Rating value={product.rating} count={product.reviewCount} size={13} className="mt-3" />

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="type-price-lg text-charcoal">
              {formatINR(product.price)}
            </span>
            {product.mrp && product.mrp > product.price && (
              <>
                <span className="type-price-sm tabular-nums text-muted line-through">
                  {formatINR(product.mrp)}
                </span>
                {off && (
                  <span className="rounded-full bg-gold/15 px-2.5 py-0.5 type-label-sm text-gold-deep">
                    {off}% OFF
                  </span>
                )}
              </>
            )}
          </div>

          <p className="mt-5 type-body text-mist line-clamp-3">
            {product.description}
          </p>
          {showReadMore && (
            <Link
              href={`/product/${product.slug}`}
              onClick={onClose}
              className="mt-2 inline-flex items-center gap-1 type-label-sm text-gold-deep transition-colors hover:text-charcoal"
            >
              Read more
              <ArrowRight width={12} height={12} />
            </Link>
          )}

          <div className="mt-6 border-t border-clay/60 pt-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              {details.map(([label, value]) => (
                <div key={label}>
                  <p className="type-label-sm text-gold-deep/80">
                    {label}
                  </p>
                  <p className="mt-1 text-[0.9rem] text-charcoal">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                product.inStock ? "bg-gold-deep" : "bg-red-500"
              )}
            />
            <p
              className={cn(
                "type-meta",
                product.inStock ? "text-charcoal/80" : "text-red-600"
              )}
            >
              {product.inStock ? "In stock — ships in 2–4 days" : "Out of stock"}
            </p>
          </div>

          {product.sizes && (
            <div className="mt-6">
              <p className="mb-3 type-label-sm text-charcoal/60">
                Size
              </p>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    aria-pressed={size === s}
                    className={cn(
                      "h-10 min-w-10 rounded-full border px-3.5 text-[0.78rem] font-medium transition-all duration-200",
                      size === s
                        ? "border-charcoal bg-charcoal text-ivory"
                        : "border-clay text-charcoal/80 hover:border-charcoal hover:text-charcoal"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={add}
            size="lg"
            fullWidth
            className="mt-7 p-3"
            disabled={!product.inStock}
          >
            <ShoppingBag width={17} height={17} strokeWidth={1.8} />
            {product.inStock ? "Add to Cart" : "Out of Stock"}
          </Button>

          <Link
            href={`/product/${product.slug}`}
            onClick={onClose}
            className="group relative mt-6 inline-flex items-center justify-center gap-2 self-center type-label-sm text-charcoal/70 transition-colors hover:text-charcoal"
          >
            View Full Details
            <ArrowRight
              width={14}
              height={14}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
            <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-gold-deep transition-transform duration-300 group-hover:scale-x-100" />
          </Link>

          <ul className="mt-7 space-y-2.5 border-t border-clay/60 pt-6">
            {trust.map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-[0.75rem] text-taupe">
                <Check width={14} height={14} strokeWidth={1.8} className="shrink-0 text-gold-deep" />
                {t}
              </li>
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
