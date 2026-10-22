import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EditorialCardProps {
  href: string;
  image: string;
  /** Describes the photograph; the title is read separately as the link text. */
  alt: string;
  title: string;
  eyebrow?: string;
  caption?: string;
  cta?: string;
  /** Tailwind aspect-ratio class(es) for the image frame, e.g. "aspect-[4/5] sm:aspect-[21/9]". */
  aspect?: string;
  className?: string;
  titleAs?: "h2" | "h3";
}

/**
 * Full-bleed image card with copy set on a gradient at the foot of the frame.
 * The whole card is one link; the CTA is a visual cue, not a second target.
 */
export function EditorialCard({
  href,
  image,
  alt,
  title,
  eyebrow,
  caption,
  cta = "Explore",
  aspect = "aspect-[4/5]",
  className,
  titleAs: Title = "h3",
}: EditorialCardProps) {
  return (
    <Link
      href={href}
      data-editorial-card
      className={cn(
        "group relative block overflow-hidden rounded-2xl bg-ink outline-offset-4 focus-visible:outline-2 focus-visible:outline-gold",
        className
      )}
    >
      <div className={cn("relative w-full overflow-hidden", aspect)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-luxe motion-safe:group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 p-5 sm:p-7">
        <div className="min-w-0 max-w-xl">
          {eyebrow && <p className="eyebrow mb-2 text-ivory/80">{eyebrow}</p>}
          <Title className="type-heading-lg text-balance text-ivory">{title}</Title>
          {caption && <p className="mt-1.5 line-clamp-2 type-body-sm text-ivory/80">{caption}</p>}
        </div>
        <span className="type-label-sm inline-flex shrink-0 items-center gap-2 rounded-full border border-ivory/45 px-4 py-2.5 text-ivory transition-colors duration-200 group-hover:border-ivory group-hover:bg-ivory group-hover:text-charcoal">
          {cta}
          <ArrowUpRight width={14} height={14} aria-hidden />
        </span>
      </div>
    </Link>
  );
}
