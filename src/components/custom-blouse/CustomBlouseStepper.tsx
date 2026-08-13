"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const BL0USE_STEPS = [
  { id: 1, label: "Design", hint: "Pick every detail" },
  { id: 2, label: "Measurements", hint: "Your perfect fit" },
  { id: 3, label: "Upload", hint: "Reference & notes" },
  { id: 4, label: "Review", hint: "Confirm your blouse" },
];

interface CustomBlouseStepperProps {
  current: number;
  onChange?: (step: number) => void;
  className?: string;
}

export function CustomBlouseStepper({ current, onChange, className }: CustomBlouseStepperProps) {
  return (
    <ol
      className={cn(
        "grid grid-cols-2 gap-y-5 sm:grid-cols-4",
        className
      )}
      aria-label="Customization progress"
    >
      {BL0USE_STEPS.map((step, i) => {
        const state =
          current > step.id ? "done" : current === step.id ? "current" : "upcoming";
        return (
          <li key={step.id} className="relative">
            {i > 0 && (
              <span
                className={cn(
                  "absolute left-[-50%] top-[15px] hidden h-px w-full sm:block",
                  current > step.id - 1 ? "bg-gold" : "bg-clay/60"
                )}
                aria-hidden
              />
            )}
            <button
              type="button"
              onClick={() => onChange?.(step.id)}
              disabled={!onChange}
              className="group flex flex-col items-start gap-2 sm:items-center sm:text-center"
              aria-current={state === "current" ? "step" : undefined}
            >
              <span
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium transition-all duration-300",
                  state === "done" && "border-gold bg-gold text-white",
                  state === "current" &&
                    "border-charcoal bg-charcoal text-ivory shadow-soft",
                  state === "upcoming" && "border-clay bg-ivory text-taupe"
                )}
              >
                {state === "done" ? <Check width={14} height={14} strokeWidth={2.5} /> : `0${step.id}`}
                {state === "current" && (
                  <motion.span
                    layoutId="stepper-pulse"
                    className="absolute inset-0 rounded-full border border-charcoal/40"
                    animate={{ scale: [1, 1.18, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </span>
              <span className="flex flex-col gap-0.5">
                <span
                  className={cn(
                    "text-[0.72rem] font-medium uppercase tracking-[0.14em]",
                    state === "current"
                      ? "text-charcoal"
                      : state === "done"
                        ? "text-gold-deep"
                        : "text-taupe"
                  )}
                >
                  {step.label}
                </span>
                <span className="hidden text-[0.62rem] text-mist sm:block">{step.hint}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
