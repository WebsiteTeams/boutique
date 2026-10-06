"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import type { Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";

interface ProductCarouselProps {
  products: Product[];
  className?: string;
}

export function ProductCarousel({ products, className }: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * (trackRef.current.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <div className={className}>
      <div
        ref={trackRef}
        className="no-scrollbar mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-3 sm:-mx-8 sm:gap-6 sm:scroll-px-8 sm:px-8 lg:-mx-10 lg:gap-8 lg:scroll-px-10 lg:px-10"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        {products.map((p, i) => (
          <div
            key={p.id}
            className="w-[74vw] mx-1 shrink-0 snap-start sm:w-[45vw] md:w-[32vw] lg:w-[23%] xl:w-[19%]"
          >
            <ProductCard product={p} index={i} />
          </div>
        ))}
      </div>

      {/* Arrow controls */}
      <div className="mt-6 hidden items-center justify-center gap-3 lg:flex">
        <CarouselArrow dir={-1} onClick={() => scrollBy(-1)} />
        <CarouselArrow dir={1} onClick={() => scrollBy(1)} />
      </div>
    </div>
  );
}

function CarouselArrow({ dir, onClick }: { dir: 1 | -1; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-clay text-charcoal transition-colors hover:border-charcoal hover:bg-charcoal hover:text-ivory"
      aria-label={dir === 1 ? "Scroll forward" : "Scroll backward"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ transform: dir === 1 ? "none" : "rotate(180deg)" }}>
        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.button>
  );
}
