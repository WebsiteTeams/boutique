"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  size = "md",
  className,
}: QuantityStepperProps) {
  const btn = cn(
    "flex items-center justify-center text-charcoal/70 transition-colors hover:text-charcoal",
    size === "sm" ? "h-7 w-7" : "h-10 w-10"
  );
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-clay bg-white/60",
        size === "sm" ? "h-8" : "h-11",
        className
      )}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease quantity"
        disabled={value <= min}
      >
        <Minus width={14} height={14} />
      </button>
      <span
        className={cn(
          "select-none text-center font-medium tabular-nums text-charcoal",
          size === "sm" ? "w-6 text-xs" : "w-8 text-sm"
        )}
      >
        {value}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Increase quantity"
        disabled={value >= max}
      >
        <Plus width={14} height={14} />
      </button>
    </div>
  );
}
