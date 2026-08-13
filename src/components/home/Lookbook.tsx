"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { collections } from "@/lib/data";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

const layout: Record<string, string> = {
  wedding: "md:col-span-7 md:row-span-2 aspect-[3/4]",
  festive: "md:col-span-5 aspect-[4/5]",
  everyday: "md:col-span-5 aspect-[4/5]",
  bridal: "md:col-span-12 aspect-[3/4] md:aspect-[21/9]",
};

export function Lookbook() {
  return (
    <section className="bg-cream/60">
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-32">
        <SectionHeading
          eyebrow="The Lookbook"
          title="Styled For Every Moment"
          subtitle="From intimate ceremonies to grand celebrations — four edits, one considered wardrobe."
        />

        <div className="grid gap-5 md:grid-cols-12 md:grid-rows-2 sm:gap-6">
          {collections.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.75, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={cn("group relative overflow-hidden rounded-2xl", layout[c.id])}
            >
              <Link href="/collections" className="relative block h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image}
                  alt={c.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1300ms] ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent transition-opacity duration-500" />

                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <p className="eyebrow mb-1.5 text-gold-soft">{c.tagline}</p>
                  <h3 className="serif-display text-2xl text-ivory sm:text-3xl">{c.name}</h3>
                  <p className="mt-2 max-w-[36ch] text-sm leading-relaxed text-ivory/70">
                    {c.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ivory/90">
                    Explore Edit
                    <ArrowRight width={15} height={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
