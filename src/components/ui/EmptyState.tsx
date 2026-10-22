"use client";

import { cn } from "@/lib/utils";
import { Button, LinkButton } from "@/components/ui/Button";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  className?: string;
  /** Heading level for the title; use h2 when the empty state is the main content under the page h1. */
  titleAs?: "h2" | "h3";
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  href,
  className,
  titleAs: Title = "h3",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-20 text-center",
        className
      )}
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-clay bg-cream text-gold-deep">
        {icon}
      </div>
      <Title className="type-heading-lg text-charcoal">{title}</Title>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-mist">{description}</p>
      )}
      {actionLabel &&
        (href ? (
          <LinkButton href={href} variant="outline" size="sm" className="mt-6">
            {actionLabel}
          </LinkButton>
        ) : (
          <Button variant="outline" size="sm" className="mt-6" onClick={onAction}>
            {actionLabel}
          </Button>
        ))}
    </div>
  );
}
