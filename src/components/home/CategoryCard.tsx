"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { CategoryItem } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: CategoryItem;
  className?: string;
}

export function CategoryCard({ category, className }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn("group relative overflow-hidden bg-ink", className)}
    >
      <Link
        href={category.href}
        className="relative block h-full w-full overflow-hidden"
        aria-label={category.name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={category.image}
          alt={category.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent transition-colors duration-500 group-hover:from-ink/90" />

        <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
          <p className="eyebrow mb-3 flex items-center gap-3 text-gold-soft">
            <span className="h-px w-8 bg-gold-soft/70" />
            {category.name}
          </p>
          <h3 className="type-heading-lg max-w-[16ch] text-ivory">
            {category.description}
          </h3>
          <span className="mt-5 inline-flex items-center gap-2 type-btn text-ivory/90">
            {category.cta}
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ivory/30 transition-all duration-300 group-hover:border-ivory group-hover:bg-ivory group-hover:text-charcoal">
              <ArrowUpRight width={15} height={15} />
            </span>
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
