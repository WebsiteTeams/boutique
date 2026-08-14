"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  name: string;
  className?: string;
}

export function ProductGallery({ images, name, className }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const frameRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  return (
    <div className={cn("flex flex-col-reverse gap-4 sm:flex-row", className)}>
      {/* Thumbnails */}
      <div className="flex gap-3 overflow-x-auto sm:flex-col sm:overflow-visible no-scrollbar sm:no-scrollbar">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn(
              "relative h-20 w-16 shrink-0 overflow-hidden bg-cream transition-all duration-300 sm:h-[5.5rem]",
              active === i
                ? "ring-2 ring-gold ring-offset-2 ring-offset-ivory"
                : "opacity-70 hover:opacity-100"
            )}
            aria-label={`View image ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {/* Main frame */}
      <div
        ref={frameRef}
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={handleMove}
        className="relative flex-1 cursor-zoom-in overflow-hidden bg-cream"
      >
        <motion.div
          key={active}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="aspect-[4/5] w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[active]}
            alt={`${name} — image ${active + 1}`}
            className={cn(
              "h-full w-full object-cover transition-transform duration-200",
              zoom && "scale-[1.6]"
            )}
            style={{ transformOrigin: origin }}
          />
        </motion.div>

        <div className="type-label-sm pointer-events-none absolute bottom-4 right-4 rounded-full bg-ink/50 px-3 py-1 text-ivory backdrop-blur">
          {active + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
