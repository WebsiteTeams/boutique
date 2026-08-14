"use client";

import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  dark,
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "mb-10 flex flex-col sm:mb-14",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            "eyebrow mb-4 inline-flex items-center gap-3 text-gold-deep",
            align === "center" && "justify-center"
          )}
        >
          <span className="h-px w-8 bg-gold-soft" />
          {eyebrow}
          {align === "center" && <span className="h-px w-8 bg-gold-soft" />}
        </span>
      )}
      <h2
        className={cn(
          "type-heading-xl max-w-3xl text-balance",
          dark ? "text-ivory" : "text-charcoal"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-5 max-w-xl type-body",
            dark ? "text-ivory/70" : "text-mist",
            align === "center" && "text-center"
          )}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
