import type { Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGridProps {
  products: Product[];
  className?: string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  resetFilters?: () => void;
  columns?: 2 | 3 | 4;
}

export function ProductGrid({
  products,
  className,
  loading,
  emptyTitle = "No pieces match your filters",
  emptyDescription = "Try adjusting or clearing your filters to see more from the collection.",
  resetFilters,
  columns = 4,
}: ProductGridProps) {
  if (loading) {
    return <ProductGridSkeleton count={columns * 2} />;
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<SearchX width={28} height={28} />}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={resetFilters ? "Clear all filters" : undefined}
        onAction={resetFilters}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:gap-y-12",
        columns === 4 && "lg:grid-cols-4",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        columns === 2 && "sm:grid-cols-2",
        className
      )}
    >
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}
