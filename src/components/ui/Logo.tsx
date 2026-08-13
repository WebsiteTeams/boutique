import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  dark?: boolean;
  className?: string;
  compact?: boolean;
}

export function Logo({ dark, className, compact }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex flex-col items-center justify-center leading-none",
        className
      )}
      aria-label="UMA Designers — home"
    >
      <span
        className={cn(
          "serif-display text-[1.7rem] tracking-wide transition-colors",
          dark ? "text-ivory" : "text-charcoal"
        )}
      >
        UMA
      </span>
      <span
        className={cn(
          "mt-[0.3rem] text-[0.52rem] font-medium uppercase tracking-[0.42em] transition-colors",
          dark ? "text-ivory/70" : "text-gold-deep",
          compact && "hidden"
        )}
      >
        Designers
      </span>
    </Link>
  );
}
