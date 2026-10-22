"use client";

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product/ProductCard";

interface ProductCarouselProps {
  products: Product[];
  className?: string;
}

/**
 * Horizontal product rail. Scrolling is contained in the track, which lines up
 * with the page gutter, so the document itself never grows wider than the window.
 */
export function ProductCarousel({ products, className }: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [edges, setEdges] = useState({ start: true, end: true });

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      observer.disconnect();
    };
  }, [updateEdges, products.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const scrollable = !(edges.start && edges.end);

  return (
    <div className={cn("min-w-0", className)}>
      <div
        ref={trackRef}
        role="list"
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-5 px-5 pb-3 sm:gap-6 sm:scroll-px-8 sm:px-8 lg:gap-8 lg:scroll-px-10 lg:px-10"
        style={{ scrollbarWidth: "none" }}
      >
        {products.map((p, i) => (
          <div
            key={p.id}
            role="listitem"
            className="w-[72%] shrink-0 snap-start sm:w-[44%] md:w-[30%] lg:w-[calc((100%-6rem)/4)] xl:w-[calc((100%-8rem)/5)]"
          >
            <ProductCard product={p} index={i} />
          </div>
        ))}
      </div>

      {scrollable && (
        <div className="mt-6 hidden items-center justify-center gap-3 lg:flex">
          <CarouselArrow dir={-1} disabled={edges.start} onClick={() => scrollBy(-1)} />
          <CarouselArrow dir={1} disabled={edges.end} onClick={() => scrollBy(1)} />
        </div>
      )}
    </div>
  );
}

function CarouselArrow({ dir, disabled, onClick }: { dir: 1 | -1; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-clay text-charcoal transition-colors duration-200 hover:border-charcoal hover:bg-charcoal hover:text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:scale-95 disabled:pointer-events-none disabled:opacity-35"
      aria-label={dir === 1 ? "Show next products" : "Show previous products"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{ transform: dir === 1 ? "none" : "rotate(180deg)" }}>
        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
