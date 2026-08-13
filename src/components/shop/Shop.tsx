"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Product } from "@/types";
import { products as allProducts } from "@/lib/data";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FilterSidebar, type FilterGroup } from "@/components/product/FilterSidebar";
import { SizeGuide } from "@/components/product/SizeGuide";

interface ShopProps {
  title: string;
  description: string;
  image?: string;
  category?: "sarees" | "chudithars" | "blouses";
  onlyNew?: boolean;
  showSizeGuide?: boolean;
}

const PRICE_BANDS: { id: string; label: string; test: (p: number) => boolean }[] = [
  { id: "Under ₹5,000", label: "Under ₹5,000", test: (p) => p < 5000 },
  { id: "₹5,000 – ₹10,000", label: "₹5,000 – ₹10,000", test: (p) => p >= 5000 && p < 10000 },
  { id: "₹10,000 – ₹20,000", label: "₹10,000 – ₹20,000", test: (p) => p >= 10000 && p < 20000 },
  { id: "Above ₹20,000", label: "Above ₹20,000", test: (p) => p >= 20000 },
];

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "popular", label: "Popular" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
];

function buildGroups(list: Product[]): FilterGroup[] {
  const unique = (key: keyof Product) =>
    Array.from(new Set(list.map((p) => String(p[key])).filter(Boolean)));
  const groups: FilterGroup[] = [
    { id: "price", label: "Price", options: PRICE_BANDS.map((b) => b.label) },
    { id: "color", label: "Color", options: unique("color") },
    { id: "fabric", label: "Fabric", options: unique("fabric") },
    { id: "occasion", label: "Occasion", options: unique("occasion") },
    { id: "pattern", label: "Pattern", options: unique("pattern") },
    { id: "availability", label: "Availability", options: ["In Stock", "Made to Order"] },
  ];
  const sub = unique("subcategory");
  if (sub.length > 1) {
    groups.unshift({ id: "category", label: "Category", options: sub });
  }
  return groups;
}

function matches(product: Product, selected: Record<string, string[]>, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (q) {
    const hay = `${product.name} ${product.fabric} ${product.color} ${product.occasion} ${product.subcategory} ${product.tags.join(" ")}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  for (const [group, values] of Object.entries(selected)) {
    if (values.length === 0) continue;
    if (group === "price") {
      const ok = values.some((v) => PRICE_BANDS.find((b) => b.label === v)?.test(product.price));
      if (!ok) return false;
    } else if (group === "availability") {
      if (values.includes("Made to Order") && !product.customizable) return false;
      if (values.includes("In Stock") && !product.inStock) return false;
    } else {
      if (!values.includes(String(product[group as keyof Product]))) return false;
    }
  }
  return true;
}

export function Shop({ title, description, category, onlyNew, showSizeGuide }: ShopProps) {
  const list = useMemo(() => {
    let base = category ? allProducts.filter((p) => p.category === category) : allProducts;
    if (onlyNew) base = base.filter((p) => p.isNew);
    return base;
  }, [category, onlyNew]);
  const groups = useMemo(() => buildGroups(list), [list]);

  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const activeCount = Object.values(selected).reduce((a, v) => a + v.length, 0);

  const toggle = (groupId: string, value: string) => {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      return {
        ...prev,
        [groupId]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  };

  const clear = () => setSelected({});

  const results = useMemo(() => {
    let out = list.filter((p) => matches(p, selected, search));
    switch (sort) {
      case "newest":
        out = [...out].sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false) || b.id.localeCompare(a.id));
        break;
      case "popular":
        out = [...out].sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "price-asc":
        out = [...out].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        out = [...out].sort((a, b) => b.price - a.price);
        break;
    }
    return out;
  }, [list, selected, search, sort]);

  return (
    <>
      {/* Header */}
      <header className="border-b border-clay/50 bg-cream/50">
        <div className="mx-auto max-w-[1440px] px-5 pb-10 pt-32 sm:px-8 lg:px-10 lg:pt-20 lg:pb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow mb-3 flex items-center gap-3 text-gold-deep">
              <span className="h-px w-8 bg-gold" />
              UMA Collection
            </p>
            <h1 className="serif-display text-4xl text-charcoal sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-mist">
              {description}
            </p>
          </motion.div>
        </div>
      </header>

      {/* Controls */}
      <div className="sticky top-16 z-30 border-b border-clay/50 bg-ivory/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-5 py-3.5 sm:px-8 lg:px-10">
          <label className="relative flex flex-1 items-center lg:max-w-sm">
            <Search width={16} height={16} className="pointer-events-none absolute left-3.5 text-taupe" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}…`}
              className="h-10 w-full rounded-full border border-clay bg-white/70 pl-10 pr-9 text-sm text-charcoal placeholder:text-taupe focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold-soft/40"
              aria-label="Search products"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 text-taupe hover:text-charcoal"
                aria-label="Clear search"
              >
                <X width={15} height={15} />
              </button>
            )}
          </label>

          <div className="ml-auto flex items-center gap-2">
            {showSizeGuide && (
              <button
                onClick={() => setSizeGuideOpen(true)}
                className="hidden h-10 items-center rounded-full border border-clay px-4 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-charcoal md:flex"
              >
                Size Guide
              </button>
            )}
            <button
              onClick={() => setFiltersOpen(true)}
              className="relative flex h-10 items-center gap-2 rounded-full border border-clay px-4 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-charcoal lg:hidden"
              aria-label="Open filters"
            >
              <SlidersHorizontal width={15} height={15} />
              Filters
              {activeCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[0.6rem] text-white">
                  {activeCount}
                </span>
              )}
            </button>
            <label className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-10 appearance-none rounded-full border border-clay bg-white/70 pl-4 pr-9 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-charcoal focus:border-gold focus:outline-none"
                aria-label="Sort products"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id} className="normal-case">
                    {s.label}
                  </option>
                ))}
              </select>
              <svg width="14" height="14" viewBox="0 0 14 14" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/60" fill="none">
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </label>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="flex gap-10">
          {/* Desktop sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-36">
              <FilterSidebar
                groups={groups}
                selected={selected}
                onChange={toggle}
                onClear={clear}
                activeCount={activeCount}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <p className="mb-6 text-sm text-mist">
              {results.length} {results.length === 1 ? "piece" : "pieces"}
              {search && (
                <>
                  {" "}for <span className="text-charcoal">“{search}”</span>
                </>
              )}
            </p>
            <ProductGrid products={results} resetFilters={clear} />
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            className="fixed inset-0 z-[70] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} aria-hidden />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 top-0 h-full"
            >
              <FilterSidebar
                mobile
                groups={groups}
                selected={selected}
                onChange={toggle}
                onClear={clear}
                activeCount={activeCount}
                onClose={() => setFiltersOpen(false)}
                className="max-h-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SizeGuide open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </>
  );
}
