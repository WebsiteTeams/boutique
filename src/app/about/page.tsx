"use client";

import { motion } from "framer-motion";
import { HandHeart, Leaf, Ruler, Scissors } from "lucide-react";
import { collections } from "@/lib/data";
import { ImageReveal, Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LinkButton } from "@/components/ui/Button";

const PILLARS = [
  {
    icon: Scissors,
    title: "Handstitched, Always",
    text: "Every blouse is cut and stitched in-house by master tailors who have honed their craft for decades.",
  },
  {
    icon: Leaf,
    title: "Looms, Not Lines",
    text: "We work directly with weavers in Kanchipuram, Chanderi and Pochampally — fair prices, no middlemen.",
  },
  {
    icon: Ruler,
    title: "Made Around You",
    text: "Bespoke fits are our signature. Share measurements once and we tailor every piece to you.",
  },
  {
    icon: HandHeart,
    title: "Fashion, Considered",
    text: "Small batches, natural fabrics and packaging you can gift directly. Elegance shouldn't cost the earth.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <header className="border-b border-clay/50 bg-cream/50">
        <div className="mx-auto max-w-4xl px-5 pb-14 pt-32 text-center sm:px-8 lg:pt-20">
          <p className="eyebrow mb-3 text-gold-deep">Our Story</p>
          <h1 className="type-display-lg text-charcoal">
            Woven by Hand,
            <br />
            Made for You
          </h1>
          <p className="mx-auto mt-5 max-w-xl type-body leading-relaxed text-mist">
            UMA Designers began in a small Madras home with a single sewing machine and a
            belief: Indian fashion should feel personal. Today, our atelier dresses women
            across the country in sarees, chudithars and blouses crafted around their story.
          </p>
        </div>
      </header>

      {/* Heritage strip */}
      <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <RevealGroup className="grid gap-8 sm:grid-cols-3">
          {[
            { n: "25+", label: "Years of tailoring" },
            { n: "4,000+", label: "Women dressed" },
            { n: "40+", label: "Weaving partners" },
          ].map((s) => (
            <RevealItem key={s.label} className="border border-clay/50 p-8 text-center">
              <p className="type-heading-xl text-gold-deep">{s.n}</p>
              <p className="mt-2 type-label text-mist">{s.label}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* Image + story */}
      <section className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-8 lg:px-10 lg:pb-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <ImageReveal
            src="/images/collections/collection-bridal.png"
            alt="A bridal silk saree from the UMA Designers atelier"
            className="aspect-[4/5] rounded-2xl"
          />
          <Reveal>
            <SectionHeading eyebrow="The Atelier" title="Where Tradition Meets Tailoring" />
            <div className="space-y-4 leading-relaxed text-mist">
              <p>
                In our T Nagar studio, handloom weaves are matched with hand-drawn
                patterns and couture techniques. Each order is given a personal
                production card — so we always know whose celebration it is for.
              </p>
              <p>
                From a bride&apos;s trousseau to a first-day-back-to-office chudithar,
                we approach every piece with the same quiet care. When you shop with us,
                you&apos;re not buying a garment — you&apos;re commissioning a memory.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-charcoal">
        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <SectionHeading
            eyebrow="What We Stand For"
            title="The UMA Difference"
            className="[&_*]:text-ivory [&_p]:!text-mist"
          />
          <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-2">
            {PILLARS.map((p) => (
              <RevealItem
                key={p.title}
                className="flex gap-5 border border-ivory/15 p-6"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-soft">
                  <p.icon width={20} height={20} />
                </span>
                <span>
                  <h3 className="mb-1.5 text-lg text-ivory">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-mist">{p.text}</p>
                </span>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Collections */}
      <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <SectionHeading eyebrow="Curated for You" title="Shop the Edits" align="center" />
        <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-2">
          {collections.map((c, i) => (
            <RevealItem
              key={c.id}
              className={i === 0 ? "sm:col-span-2" : ""}
            >
              <LinkButton
                href="/collections"
                variant="ghost"
                className="group relative block h-full w-full overflow-hidden p-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image}
                  alt={c.name}
                  className="aspect-[16/9] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <motion.span className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent" />
                <span className="absolute inset-x-6 bottom-6 flex items-end justify-between text-left">
                  <span>
                    <span className="type-label-sm block text-gold-soft">
                      {c.tagline}
                    </span>
                    <span className="type-heading-lg mt-1 block text-ivory">
                      {c.name}
                    </span>
                  </span>
                  <span className="rounded-full border border-ivory/40 px-4 py-2 text-xs uppercase tracking-[0.16em] text-ivory backdrop-blur-sm transition-colors group-hover:bg-ivory group-hover:text-charcoal">
                    Explore
                  </span>
                </span>
              </LinkButton>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>
    </>
  );
}
