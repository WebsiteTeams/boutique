"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { products } from "@/lib/data";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setQuery("");
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.includes(q) ||
          p.fabric.toLowerCase().includes(q) ||
          p.occasion.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q))
      )
      .slice(0, 6);
  }, [query]);

  const suggestions = ["Banarasi", "Linen", "Chudithar", "Custom Blouse", "Organza"];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-0 bg-ivory"
          >
            <div className="mx-auto max-w-3xl px-6 py-8 sm:py-10">
              <div className="flex items-center gap-4 border-b-2 border-charcoal pb-3">
                <Search className="h-5 w-5 shrink-0 text-gold-deep" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search sarees, chudithars, blouses…"
                  className="w-full bg-transparent text-lg text-charcoal placeholder:text-taupe focus:outline-none sm:text-xl"
                  aria-label="Search products"
                />
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-charcoal/60 hover:bg-sand/60 hover:text-charcoal"
                  aria-label="Close search"
                >
                  <X width={20} height={20} />
                </button>
              </div>

              {query.trim() === "" ? (
                <div className="mt-6">
                  <p className="eyebrow mb-3 text-gold-deep">Popular Searches</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="rounded-full border border-clay px-4 py-1.5 text-sm text-charcoal transition-colors hover:border-gold hover:text-gold-deep"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="serif-display text-xl text-charcoal">No results found</p>
                  <p className="mt-2 text-sm text-mist">
                    Try “silk”, “linen” or “organza” instead.
                  </p>
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-clay/60">
                  {results.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/product/${p.slug}`}
                        onClick={onClose}
                        className="group flex w-full items-center gap-4 py-3 text-left"
                      >
                        <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-md bg-cream">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-charcoal">
                            {p.name}
                          </span>
                          <span className="block text-xs capitalize text-mist">
                            {p.category} · {p.fabric}
                          </span>
                        </span>
                        <span className="text-sm tabular-nums text-gold-deep">
                          ₹{p.price.toLocaleString("en-IN")}
                        </span>
                        <ArrowRight className="h-4 w-4 text-charcoal/40 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
