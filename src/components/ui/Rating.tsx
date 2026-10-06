import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  className,
  size = 14,
}: {
  value: number;
  count?: number;
  className?: string;
  size?: number;
}) {
  const hasReviews = count === undefined || count > 0;
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="img"
      aria-label={hasReviews ? `Rated ${value.toFixed(1)} out of 5${count ? ` from ${count} reviews` : ""}` : "No reviews yet"}
    >
      <div className="flex items-center gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={
              hasReviews && i <= Math.round(value)
                ? "fill-gold text-gold"
                : "fill-transparent text-clay"
            }
            strokeWidth={1}
          />
        ))}
      </div>
      {typeof count === "number" && (
        <span className="text-xs text-mist" aria-hidden>
          {count > 0 ? `${value.toFixed(1)} · ${count} ${count === 1 ? "review" : "reviews"}` : "No reviews yet"}
        </span>
      )}
    </div>
  );
}
