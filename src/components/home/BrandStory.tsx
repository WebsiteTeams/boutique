"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { P } from "@/lib/images";

const ease = [0.22, 1, 0.36, 1] as const;

const PILLARS = [
  {
    title: "Quality",
    text: "Only pure silks, handloom cottons and considered blends ever make it to the shelf.",
  },
  {
    title: "Craftsmanship",
    text: "Every drape is woven, dyed and finished by hands that have held looms for generations.",
  },
  {
    title: "Personalization",
    text: "Your measurements, your details — our bespoke atelier stitches to fit only you.",
  },
  {
    title: "Timeless Aesthetics",
    text: "Designs rooted in tradition, cut with a modern eye. Quiet luxury, never loud.",
  },
];

export function BrandStory() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.1, ease }}
          className="relative order-2 overflow-hidden lg:order-1"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={P.brandStory}
            alt="Inside the UMA atelier"
            loading="lazy"
            className="aspect-[4/5] w-full object-cover"
          />
          <div className="absolute bottom-5 left-5 rounded-full bg-ivory/90 px-4 py-2 backdrop-blur">
            <p className="type-label-sm text-charcoal">
              Est. 2012 · Chennai
            </p>
          </div>
        </motion.div>

        {/* Content */}
        <div className="order-1 lg:order-2">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease }}
          >
            <p className="eyebrow mb-5 flex items-center gap-3 text-gold-deep">
              <span className="h-px w-10 bg-gold" />
              Our Story
            </p>
            <h2 className="type-display-lg text-balance">
              Where Tradition Meets
              <br className="hidden sm:block" />
              <em className="text-gold-deep">Modern Elegance</em>
            </h2>
            <p className="mt-6 max-w-[46ch] type-body text-mist">
              UMA began as a single tailoring table and a quiet obsession with the drape
              of a good saree. Today we curate handwoven pieces from looms across India —
              every order still handled with the same care as the first one.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.1 + i * 0.08, ease }}
              >
                <div className="mb-2 h-px w-8 bg-gold" />
                <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-charcoal">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{p.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5, ease }}
            className="mt-10 flex items-center gap-6"
          >
            <LinkButton href="/about" variant="outline">
              Read Our Story
            </LinkButton>
            <div className="flex items-center gap-3">
              <Quote width={20} height={20} className="text-gold" />
              <p className="text-xs italic leading-snug text-mist">
                “Every drape has a story.
                <br />
                We help you wear it.”
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
