"use client";

import { collections } from "@/lib/data";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";

export default function CollectionsPage() {
  return (
    <>
      <header className="border-b border-clay/50 bg-cream/50">
        <div className="mx-auto max-w-4xl px-5 pb-12 pt-32 text-center sm:px-8 lg:pt-20">
          <p className="eyebrow mb-3 text-gold-deep">The Edit</p>
          <h1 className="serif-display text-4xl text-charcoal sm:text-5xl lg:text-6xl">
            Curated Collections
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-mist">
            Four considered edits — from grand wedding silks to everyday handloom —
            each one a story waiting to be worn.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <RevealGroup className="grid gap-8 md:grid-cols-2">
          {collections.map((c, i) => (
            <RevealItem
              key={c.id}
              className={i % 2 === 1 ? "md:translate-y-14" : ""}
            >
              <LinkButton
                href={c.id === "bridal" ? "/sarees?collection=bridal" : "/sarees"}
                variant="ghost"
                className="group relative block w-full overflow-hidden rounded-2xl p-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image}
                  alt={c.name}
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent" />
                <span className="absolute inset-x-6 bottom-6 text-left">
                  <span
                    className="text-[0.62rem] uppercase tracking-[0.22em]"
                    style={{ color: c.accent }}
                  >
                    {c.tagline}
                  </span>
                  <span className="serif-display mt-1 block text-3xl text-ivory">{c.name}</span>
                  <span className="mt-3 block max-w-sm text-sm leading-relaxed text-ivory/85">
                    {c.description}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-ivory px-5 py-2 text-xs font-medium uppercase tracking-[0.16em] text-charcoal transition-colors group-hover:bg-gold-soft group-hover:text-ink">
                    Shop this edit
                  </span>
                </span>
              </LinkButton>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-20 text-center">
          <p className="serif-display text-2xl text-charcoal">Looking for something specific?</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-mist">
            Tell us the occasion and our stylists will curate a personal edit for you.
          </p>
          <LinkButton href="/contact" variant="outline" className="mt-6">
            Talk to a Stylist
          </LinkButton>
        </Reveal>
      </section>
    </>
  );
}
