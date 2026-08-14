"use client";

import { motion } from "framer-motion";
import { reviews } from "@/lib/data";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Rating } from "@/components/ui/Rating";
import { getInitials } from "@/lib/utils";

export function Testimonials() {
  return (
    <section className="bg-ivory">
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-32">
        <SectionHeading
          eyebrow="Reviews"
          title="What Our Customers Say"
          subtitle="Real notes from the women who wear UMA."
        />
        <div className="grid gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-10">
          {reviews.map((review, i) => (
            <motion.figure
              key={review.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col border-t border-clay/70 pt-7 lg:border-l lg:border-t-0 lg:pt-0 lg:pl-9 first:lg:border-l-0 first:lg:pl-0"
            >
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
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
