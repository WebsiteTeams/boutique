"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "gold" | "outline" | "ghost" | "light" | "dark-ghost";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-charcoal text-ivory hover:bg-ink focus-visible:outline-gold shadow-soft",
  gold: "bg-gold text-white hover:bg-gold-deep focus-visible:outline-gold",
  outline:
    "border border-charcoal/30 text-charcoal hover:border-charcoal hover:bg-charcoal hover:text-ivory",
  ghost: "text-charcoal hover:bg-sand/60",
  light: "bg-ivory text-charcoal hover:bg-white",
  "dark-ghost": "border border-white/30 text-white hover:bg-white/10",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.7rem] tracking-[0.16em] gap-2",
  md: "h-12 px-7 text-[0.72rem] tracking-[0.16em] gap-2.5",
  lg: "h-14 px-9 text-[0.74rem] tracking-[0.16em] gap-3",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
}

export interface ButtonProps
  extends BaseProps,
    React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: undefined;
}

export interface LinkButtonProps
  extends BaseProps,
    React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", fullWidth, className, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold uppercase transition-all duration-300 ease-out",
        "[&_svg]:transition-transform [&_svg]:duration-300 ease-out hover:[&_svg]:translate-x-1",
        "active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  function LinkButton(
    { variant = "primary", size = "md", fullWidth, className, children, ...rest },
    ref
  ) {
    return (
      <Link
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium uppercase transition-all duration-300 ease-out",
          "[&_svg]:transition-transform [&_svg]:duration-300 ease-out hover:[&_svg]:translate-x-1",
          "active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...rest}
      >
        {children}
      </Link>
    );
  }
);
