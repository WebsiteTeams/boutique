import { cn, discountPercent, formatINR } from "@/lib/utils";

interface PriceProps {
  price: number;
  mrp?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { main: "text-[0.9375rem]", mrp: "text-[0.75rem]", off: "text-[0.6875rem]" },
  md: { main: "text-[1.125rem]", mrp: "text-[0.8125rem]", off: "text-[0.6875rem]" },
  lg: { main: "text-[1.625rem]", mrp: "text-[0.875rem]", off: "text-[0.75rem]" },
};

export function Price({ price, mrp, size = "md", className }: PriceProps) {
  const off = discountPercent(price, mrp);
  const s = sizeMap[size];
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-semibold tabular-nums text-charcoal", s.main)}>
        {formatINR(price)}
      </span>
      {mrp && mrp > price && (
        <>
          <span className={cn("tabular-nums text-muted line-through", s.mrp)}>
            {formatINR(mrp)}
          </span>
          {off && (
            <span className={cn("font-medium uppercase tracking-[0.08em] text-gold-deep", s.off)}>
              {off}% OFF
            </span>
          )}
        </>
      )}
    </div>
  );
}
