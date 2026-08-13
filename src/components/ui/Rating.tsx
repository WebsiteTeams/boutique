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
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={
              i <= Math.round(value)
                ? "fill-gold text-gold"
                : "fill-transparent text-clay"
            }
            strokeWidth={1}
          />
        ))}
      </div>
      {typeof count === "number" && (
        <span className="text-xs text-mist">
          {value.toFixed(1)} ({count})
        </span>
      )}
    </div>
  );
}
