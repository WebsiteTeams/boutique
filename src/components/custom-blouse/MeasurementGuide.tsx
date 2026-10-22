"use client";

import { useMemo } from "react";
import { MEASUREMENT_FIELDS } from "@/lib/blouse";
import { measurementGuideSvg } from "@/lib/blouse-art";
import { cn } from "@/lib/utils";

interface MeasurementGuideProps {
  /** Measurement id to call out; null shows every line equally. */
  active?: string | null;
  className?: string;
}

/** Numbered "how to measure" drawing; numbers follow MEASUREMENT_FIELDS order. */
export function MeasurementGuide({ active = null, className }: MeasurementGuideProps) {
  // The markup comes from our own drawing code (no user input), so it is safe to inline.
  const svg = useMemo(() => measurementGuideSvg(active), [active]);
  const index = MEASUREMENT_FIELDS.findIndex((f) => f.id === active);
  const field = index >= 0 ? MEASUREMENT_FIELDS[index] : null;

  return (
    <figure className={cn("rounded-xl bg-cream p-4", className)}>
      <div
        className="mx-auto w-full max-w-[300px] [&_svg]:h-auto [&_svg]:w-full"
        role="img"
        aria-label="How to measure: bust, waist, shoulder, armhole, sleeve length and blouse length"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <figcaption className="mt-3 min-h-[3.75rem] border-t border-clay/60 pt-3" aria-live="polite">
        {field ? (
          <>
            <p className="flex items-center gap-2 text-sm font-medium text-charcoal">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-deep text-[0.62rem] font-bold text-white">
                {index + 1}
              </span>
              {field.label}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-mist">{field.how}</p>
          </>
        ) : (
          <p className="text-xs leading-relaxed text-mist">
            Select a measurement to see exactly where to place the tape.
          </p>
        )}
      </figcaption>
    </figure>
  );
}
