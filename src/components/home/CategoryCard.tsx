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
      className={cn("group relative overflow-hidden rounded-2xl", className)}
    >
      <Link
        href={category.href}
        className="relative block aspect-[3/4] overflow-hidden sm:aspect-[4/5]"
        aria-label={category.name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={category.image}
          alt={category.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent transition-colors duration-500 group-hover:from-ink/85" />

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
          <p className="eyebrow mb-2 text-gold-soft">{category.name.toUpperCase()}</p>
          <h3 className="serif-display max-w-[16ch] text-2xl leading-tight text-ivory sm:text-[1.8rem]">
            {category.description}
          </h3>
          <span className="mt-4 inline-flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ivory/90">
            {category.cta}
            <ArrowUpRight
              width={15}
              height={15}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
