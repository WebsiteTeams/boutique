import { cn, discountPercent, formatINR } from "@/lib/utils";

interface PriceProps {
  price: number;
  mrp?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { main: "text-sm", mrp: "text-[0.7rem]", off: "text-[0.68rem]" },
  md: { main: "text-[0.95rem]", mrp: "text-xs", off: "text-[0.7rem]" },
  lg: { main: "text-xl", mrp: "text-sm", off: "text-[0.75rem]" },
};

export function Price({ price, mrp, size = "md", className }: PriceProps) {
  const off = discountPercent(price, mrp);
  const s = sizeMap[size];
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-medium tabular-nums text-charcoal", s.main)}>
        {formatINR(price)}
      </span>
      {mrp && mrp > price && (
        <>
          <span className={cn("tabular-nums text-taupe line-through", s.mrp)}>
            {formatINR(mrp)}
          </span>
          {off && (
            <span className={cn("font-medium text-gold-deep", s.off)}>{off}% off</span>
          )}
        </>
      )}
    </div>
  );
}
