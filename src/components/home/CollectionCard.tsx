"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { CollectionItem } from "@/types";
import { cn } from "@/lib/utils";

interface CollectionCardProps {
  collection: CollectionItem;
  className?: string;
  aspect?: string;
  revealDelay?: number;
}

export function CollectionCard({
  collection,
  className,
  aspect = "aspect-[4/5]",
  revealDelay = 0,
}: CollectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, delay: revealDelay, ease: [0.22, 1, 0.36, 1] }}
      className={cn("group relative overflow-hidden rounded-2xl", className)}
    >
      <Link href="/collections" className="relative block">
        <div className={cn("relative overflow-hidden", aspect)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={collection.image}
            alt={collection.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.07]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/15 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
          <p className="eyebrow mb-1.5 text-gold-soft">{collection.tagline}</p>
          <h3 className="serif-display text-2xl leading-tight text-ivory sm:text-[1.9rem]">
            {collection.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 max-w-[26ch] text-xs leading-relaxed text-ivory/70">
            {collection.description}
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ivory/90">
            Explore
            <ArrowRight width={15} height={15} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
