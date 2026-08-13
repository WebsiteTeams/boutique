import { cn } from "@/lib/utils";
import type { BadgeType } from "@/types";

const badgeStyles: Record<BadgeType, string> = {
  new: "bg-charcoal text-ivory",
  bestseller: "bg-gold text-white",
  sale: "bg-ink text-gold-soft",
};

export function Badge({
  type,
  className,
}: {
  type: BadgeType;
  className?: string;
}) {
  const label = type === "bestseller" ? "Bestseller" : type === "sale" ? "Sale" : "New";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.16em]",
        badgeStyles[type],
        className
      )}
    >
      {label}
    </span>
  );
}
