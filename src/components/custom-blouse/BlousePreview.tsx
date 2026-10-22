"use client";

import { useMemo, useState } from "react";
import { blouseSvg, type BlouseView } from "@/lib/blouse-art";
import { cn } from "@/lib/utils";

interface BlousePreviewProps {
  selected: Record<string, string>;
  className?: string;
}

/** Live line drawing of the blouse as currently designed, front or back. */
export function BlousePreview({ selected, className }: BlousePreviewProps) {
  const [view, setView] = useState<BlouseView>("front");
  // The markup comes from our own drawing code (no user input), so it is safe to inline.
  const svg = useMemo(() => blouseSvg({ view, ...selected }), [view, selected]);

  return (
    <div className={cn("relative rounded-xl bg-cream", className)}>
      <div
        className="mx-auto aspect-square w-full max-w-[260px] p-3 [&_svg]:h-full [&_svg]:w-full"
        role="img"
        aria-label={`Preview of your blouse, ${view} view`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="absolute left-2 top-2 flex rounded-full bg-ivory/90 p-0.5 text-[0.62rem] font-medium uppercase tracking-[0.14em]" role="group" aria-label="Preview side">
        {(["front", "back"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={cn(
              "h-8 min-w-12 rounded-full px-3 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold",
              view === v ? "bg-charcoal text-ivory" : "text-taupe hover:text-charcoal"
            )}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
