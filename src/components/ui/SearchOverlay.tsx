"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/types";
import { api } from "@/lib/api";
import { useDialog } from "@/lib/use-dialog";
import { formatINR } from "@/lib/utils";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [wasOpen, setWasOpen] = useState(open);

  const [results, setResults] = useState<Product[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const panelRef = useRef<HTMLDivElement>(null);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      setQuery("");
      setResults([]);
      setStatus("idle");
    }
  }

  useDialog(open, panelRef, onClose);

  const term = query.trim();

  // Debounced catalog search against the products API.
  useEffect(() => {
    if (!term) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setStatus("loading");
      api<{ products: Product[] }>(`/api/products?limit=6&q=${encodeURIComponent(term)}`, {
        signal: controller.signal,
      })
        .then((res) => {
          setResults(res.products);
          setStatus("done");
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setStatus("error");
        });
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

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
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
            className="absolute inset-x-0 top-0 max-h-full overflow-y-auto bg-ivory"
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
              ) : status === "error" ? (
                <div className="py-10 text-center" role="alert">
                  <p className="type-heading-md text-charcoal">Search is unavailable</p>
                  <p className="mt-2 text-sm text-mist">Please try again in a moment.</p>
                </div>
              ) : status !== "done" ? (
                <p className="py-10 text-center text-sm text-mist" role="status">
                  Searching…
                </p>
              ) : results.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="type-heading-md text-charcoal">No results found</p>
                  <p className="mt-2 text-sm text-mist">
                    Try “silk”, “linen” or “organza” instead.
                  </p>
                </div>
              ) : (
                <>
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
                          {formatINR(p.price)}
                        </span>
                        <ArrowRight className="h-4 w-4 text-charcoal/40 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/shop?q=${encodeURIComponent(term)}`}
                  onClick={onClose}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gold-deep underline underline-offset-4"
                >
                  View all results
                  <ArrowRight className="h-4 w-4" />
                </Link>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
