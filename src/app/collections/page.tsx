import { collections } from "@/lib/data";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { ArrowRight, ArrowUpRight } from "lucide-react";

const EDIT_LINKS: Record<string, string> = {
  wedding: "/sarees?occasion=Wedding",
  festive: "/sarees?occasion=Festive",
  everyday: "/sarees?occasion=Everyday",
  bridal: "/sarees?occasion=Bridal",
};

export default function CollectionsPage() {
  return (
    <>
      <header className="border-b border-clay/50 bg-cream/50">
        <div className="mx-auto max-w-4xl px-5 pb-14 pt-32 text-center sm:px-8 lg:pt-20">
          <p className="eyebrow mb-4 flex items-center justify-center gap-3 text-gold-deep">
            <span className="h-px w-8 bg-gold" />
            The Edit
            <span className="h-px w-8 bg-gold" />
          </p>
          <h1 className="type-display-lg text-charcoal">
            Curated Collections
          </h1>
          <p className="mx-auto mt-5 max-w-xl type-body leading-relaxed text-mist">
            Four considered edits — from grand wedding silks to everyday handloom —
            each one a story waiting to be worn.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <RevealGroup className="grid gap-5 md:grid-cols-2 lg:gap-8">
          {collections.map((c, i) => (
            <RevealItem key={c.id} className={i % 2 === 1 ? "md:translate-y-14" : ""}>
              <a
                href={EDIT_LINKS[c.id] ?? "/sarees"}
                className="group relative block w-full overflow-hidden bg-ink"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image}
                  alt={c.name}
                  className="aspect-[4/5] w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex flex-col p-7 sm:p-9">
                  <span
                    className="eyebrow flex items-center gap-2"
                    style={{ color: c.accent }}
                  >
                    <span className="h-px w-6" style={{ backgroundColor: c.accent }} />
                    {c.tagline}
                  </span>
                  <span className="type-heading-xl mt-3 block text-ivory">
                    {c.name}
                  </span>
                  <span className="mt-3 block max-w-sm type-body text-ivory/80">
                    {c.description}
                  </span>
                  <span className="type-btn mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-ivory px-6 py-2.5 text-charcoal transition-colors duration-300 group-hover:bg-white">
                    Shop this edit
                    <ArrowUpRight width={14} height={14} />
                  </span>
                </span>
              </a>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-20 text-center lg:mt-32">
          <p className="type-heading-lg text-charcoal">
            Looking for something specific?
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-mist">
            Tell us the occasion and our stylists will curate a personal edit for you.
          </p>
          <LinkButton href="/contact" variant="outline" className="mt-6">
            Talk to a Stylist
            <ArrowRight width={16} height={16} />
          </LinkButton>
        </Reveal>
      </section>
    </>
  );
}
