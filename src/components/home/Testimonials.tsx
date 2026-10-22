"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { reviews } from "@/lib/data";
import type { Review } from "@/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Rating } from "@/components/ui/Rating";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

function ReviewFigure({ review }: { review: Review }) {
  return (
    <figure className="flex h-full flex-col border-t border-clay/70 pt-7">
      <Rating value={review.rating} />
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-charcoal/80">
        “{review.text}”
      </blockquote>
      <figcaption className="mt-7 flex items-center gap-3">
        {review.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={review.image}
            alt={review.name}
            loading="lazy"
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-soft text-xs font-medium text-white">
            {getInitials(review.name)}
          </span>
        )}
        <div>
          <p className="text-sm font-medium text-charcoal">{review.name}</p>
          <p className="text-xs text-mist">
            {review.location}
            {review.product ? ` · ${review.product}` : ""}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  const prefersReduced = useReducedMotion();
  const trackRef = useRef<HTMLUListElement>(null);
  const indexRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(0);
  const count = reviews.length;

  const scrollToIndex = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[i] as HTMLElement | undefined;
    if (child) {
      track.scrollTo({ left: child.offsetLeft - track.offsetLeft, behavior: "smooth" });
    }
    indexRef.current = i;
    setActive(i);
  };

  useEffect(() => {
    if (paused || prefersReduced) return;
    const id = window.setInterval(() => {
      scrollToIndex((indexRef.current + 1) % count);
    }, 4500);
    return () => window.clearInterval(id);
  }, [paused, prefersReduced, count]);

  const syncOnScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    Array.from(track.children).forEach((node, i) => {
      const el = node as HTMLElement;
      const elCenter = el.offsetLeft - track.offsetLeft + el.clientWidth / 2;
      const currentCenter =
        (track.children[closest] as HTMLElement).offsetLeft -
        track.offsetLeft +
        (track.children[closest] as HTMLElement).clientWidth / 2;
      if (Math.abs(elCenter - center) < Math.abs(currentCenter - center)) closest = i;
    });
    indexRef.current = closest;
    setActive(closest);
  };

  const pauseProps = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onTouchStart: () => setPaused(true),
    onTouchEnd: () => setPaused(false),
  };

  return (
    <section className="bg-ivory">
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-32">
        <SectionHeading
          eyebrow="Reviews"
          title="What Our Customers Say"
          subtitle="Real notes from the women who wear UMA."
        />

        {/* sm / md: auto-scrolling carousel */}
        <div className="lg:hidden" {...pauseProps}>
          <ul
            ref={trackRef}
            onScroll={syncOnScroll}
            className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-px-5 px-5 pb-2 sm:-mx-8 sm:scroll-px-8 sm:px-8"
            style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
          >
            {reviews.map((review) => (
              <li
                key={review.id}
                className="w-[86vw] shrink-0 snap-center sm:w-[46vw] md:w-[31vw]"
              >
                <ReviewFigure review={review} />
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-center gap-0.5">
            {reviews.map((review, i) => (
              <button
                key={review.id}
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to review ${i + 1}`}
                aria-current={active === i ? "true" : undefined}
                className="group flex h-8 min-w-8 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-gold"
              >
                {/* The dot stays small; the button around it is a full 32px target. */}
                <span
                  aria-hidden
                  className={cn(
                    "block h-1.5 rounded-full transition-all duration-300",
                    active === i ? "w-6 bg-gold-deep" : "w-1.5 bg-clay group-hover:bg-taupe"
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {/* lg: static grid */}
        <div className="hidden gap-y-10 lg:grid lg:grid-cols-4 lg:gap-x-10">
          {reviews.map((review, i) => (
            <motion.figure
              key={review.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="lg:border-l lg:border-t-0 lg:pl-9 first:lg:border-l-0 first:lg:pl-0"
            >
              <ReviewFigure review={review} />
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}