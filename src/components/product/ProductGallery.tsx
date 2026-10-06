"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SmartImage } from "@/components/ui/SmartImage";

interface ProductGalleryProps {
  images: string[];
  videos?: string[];
  name: string;
  className?: string;
}

type Media = { type: "image" | "video"; src: string };

export function ProductGallery({ images, videos = [], name, className }: ProductGalleryProps) {
  const media: Media[] = [
    ...images.map((src) => ({ type: "image" as const, src })),
    ...videos.map((src) => ({ type: "video" as const, src })),
  ];
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const frameRef = useRef<HTMLDivElement>(null);
  const current = media[Math.min(active, media.length - 1)];

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  if (!current) return null;

  return (
    <div className={cn("flex flex-col-reverse gap-4 sm:flex-row", className)}>
      {/* Thumbnails */}
      {media.length > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto sm:flex-col sm:overflow-visible">
          {media.map((item, i) => (
            <button
              key={`${item.type}-${item.src}`}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-20 w-16 shrink-0 overflow-hidden bg-cream transition-all duration-300 sm:h-[5.5rem]",
                active === i
                  ? "ring-2 ring-gold ring-offset-2 ring-offset-ivory"
                  : "opacity-70 hover:opacity-100"
              )}
              aria-label={item.type === "video" ? `Play video of ${name}` : `View image ${i + 1} of ${name}`}
              aria-current={active === i}
            >
              {item.type === "image" ? (
                <SmartImage src={item.src} alt="" fill sizes="64px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-ink text-ivory">
                  <Play width={18} height={18} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main frame */}
      <div
        ref={frameRef}
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={handleMove}
        className={cn(
          "relative flex-1 overflow-hidden bg-cream",
          current.type === "image" && "cursor-zoom-in"
        )}
      >
        <motion.div
          key={active}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[4/5] w-full"
        >
          {current.type === "image" ? (
            <SmartImage
              src={current.src}
              alt={`${name} — image ${active + 1}`}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              loading={active === 0 ? "eager" : "lazy"}
              fetchPriority={active === 0 ? "high" : "auto"}
              className={cn("object-cover transition-transform duration-200", zoom && "scale-[1.6]")}
              style={{ transformOrigin: origin }}
            />
          ) : (
            <video
              src={current.src}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full bg-ink object-contain"
              aria-label={`Video of ${name}`}
            />
          )}
        </motion.div>

        {media.length > 1 && (
          <div className="type-label-sm pointer-events-none absolute bottom-4 right-4 rounded-full bg-ink/60 px-3 py-1 text-ivory backdrop-blur">
            {active + 1} / {media.length}
          </div>
        )}
      </div>
    </div>
  );
}
