"use client";

import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineStep {
  label: string;
  date: string;
  done: boolean;
}

interface OrderTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function OrderTimeline({ steps, className }: OrderTimelineProps) {
  return (
    <ol className={cn("relative", className)}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const current = step.done && (i === steps.length - 1 || !steps[i + 1].done);
        return (
          <motion.li
            key={step.label}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.45, delay: i * 0.06 }}
            className="relative flex gap-4 pb-8 last:pb-0"
          >
            {/* Connector line */}
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[11px] top-6 h-full w-px",
                  step.done ? "bg-gold" : "bg-clay/60"
                )}
                aria-hidden
              />
            )}

            <span className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-ivory">
              {step.done ? (
                <Check
                  width={12}
                  height={12}
                  className={cn("text-ivory", current ? "text-charcoal" : "text-gold-deep")}
                  strokeWidth={2.5}
                />
              ) : (
                <Circle width={11} height={11} className="text-clay" strokeWidth={1.6} />
              )}
            </span>

            <div className="pt-0.5">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.done ? "text-charcoal" : "text-taupe"
                )}
              >
                {step.label}
              </p>
              <p className="mt-0.5 text-xs text-mist">{step.date}</p>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
