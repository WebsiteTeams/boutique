"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FilterSidebar, type FilterGroup } from "@/components/product/FilterSidebar";
import { SizeGuide } from "@/components/product/SizeGuide";

interface ShopProps {
  /** Catalog for this listing, loaded from the database by the page. */
  products: Product[];
  title: string;
  description: string;
  image?: string;
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
    {
      id: "occasion",
      label: "Occasion",
      options: Array.from(new Set(list.flatMap((p) => p.occasions))),
    },
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
    const hay = `${product.name} ${product.fabric} ${product.color} ${product.occasions.join(" ")} ${product.subcategory} ${product.tags.join(" ")}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  for (const [group, values] of Object.entries(selected)) {
    if (values.length === 0) continue;
    if (group === "price") {
      const ok = values.some((v) => PRICE_BANDS.find((b) => b.label === v)?.test(product.price));
      if (!ok) return false;
    } else if (group === "category") {
      if (!values.includes(product.subcategory)) return false;
    } else if (group === "availability") {
      const ok =
        (values.includes("In Stock") && product.deliveryType === "ready" && product.inStock) ||
        (values.includes("Made to Order") && product.deliveryType === "made_to_order");
      if (!ok) return false;
    } else if (group === "occasion") {
      if (!values.some((v) => product.occasions.includes(v))) return false;
    } else {
      if (!values.includes(String(product[group as keyof Product]))) return false;
    }
  }
  return true;
}

export function Shop(props: ShopProps) {
  return (
    <Suspense fallback={null}>
      <ShopInner {...props} />
    </Suspense>
  );
}

/** URL parameter used for each filter group — the URL is the single source of truth. */
const PARAM_BY_GROUP: Record<string, string> = {
  category: "sub",
  price: "price",
  color: "color",
  fabric: "fabric",
  occasion: "occasion",
  pattern: "pattern",
  availability: "availability",
};

function ShopInner({ products: list, title, description, showSizeGuide, image }: ShopProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const groups = useMemo(() => buildGroups(list), [list]);

  // Filters, sort and search are derived from the URL on every render, so
  // navigating between e.g. ?sub=Silk and ?sub=Cotton updates immediately.
  const paramString = searchParams.toString();
  const selected = useMemo(() => {
    const params = new URLSearchParams(paramString);
    const out: Record<string, string[]> = {};
    for (const [group, param] of Object.entries(PARAM_BY_GROUP)) {
      const values = params.getAll(param);
      if (values.length > 0) out[group] = values;
    }
    return out;
  }, [paramString]);
  const sort = SORTS.some((s) => s.id === searchParams.get("sort")) ? searchParams.get("sort")! : "newest";
  const urlSearch = searchParams.get("q") ?? "";

  const [search, setSearch] = useState(urlSearch);
  const [syncedSearch, setSyncedSearch] = useState(urlSearch);
  if (urlSearch !== syncedSearch) {
    setSyncedSearch(urlSearch);
    setSearch(urlSearch);
  }
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const activeCount = Object.values(selected).reduce((a, v) => a + v.length, 0);

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(paramString);
      mutate(params);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [paramString, pathname, router]
  );

  // Keep the search box in the URL (debounced) so results are shareable.
  useEffect(() => {
    if (search === urlSearch) return;
    const timer = setTimeout(() => {
      updateParams((params) => {
        if (search.trim()) params.set("q", search);
        else params.delete("q");
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, urlSearch, updateParams]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [filtersOpen]);

  // Toggling one value only touches that group's parameter; everything else is preserved.
  const toggle = (groupId: string, value: string) => {
    const param = PARAM_BY_GROUP[groupId];
    if (!param) return;
    updateParams((params) => {
      const current = params.getAll(param);
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      params.delete(param);
      next.forEach((v) => params.append(param, v));
    });
  };

  const clear = () =>
    updateParams((params) => {
      Object.values(PARAM_BY_GROUP).forEach((param) => params.delete(param));
    });

  const setSort = (value: string) =>
    updateParams((params) => {
      if (value === "newest") params.delete("sort");
      else params.set("sort", value);
    });

  const results = useMemo(() => {
    let out = list.filter((p) => matches(p, selected, search));
    switch (sort) {
      case "newest":
        // The server already returns newest first.
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
      <header
        className={cn(
          "relative overflow-hidden border-b border-clay/50",
          image ? "bg-ink" : "bg-cream/50"
        )}
      >
        {image && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/40 to-ink/20" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink/70 to-transparent" />
          </>
        )}
        <div className="relative z-10 mx-auto max-w-[1440px] px-5 pb-12 pt-32 sm:px-8 lg:px-10 lg:pt-40 lg:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p
              className={cn(
                "eyebrow mb-3 flex items-center gap-3",
                image ? "text-gold-soft" : "text-gold-deep"
              )}
            >
              <span className="h-px w-8 bg-gold" />
              UMA Collection
            </p>
            <h1
              className={cn(
                "type-display-lg",
                image ? "text-ivory" : "text-charcoal"
              )}
            >
              {title}
            </h1>
            <p
              className={cn(
                "mt-4 max-w-xl type-body leading-relaxed",
                image ? "text-ivory/80" : "text-mist"
              )}
            >
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
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
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
