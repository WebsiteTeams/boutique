import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { OCCASIONS } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";
import { listCollections } from "@/server/services/admin";
import { getFacets } from "@/server/services/products";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { StylistButton } from "@/components/ui/StylistButton";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Collections",
  description:
    "Explore UMA Designers' curated edits — wedding silks, festive drapes, bridal trousseaux and everyday handlooms — or shop by occasion.",
  path: "/collections",
  image: "/images/collections/collection-wedding.png",
});

const QUICK_EDITS = [
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Best Sellers", href: "/shop?edit=bestsellers" },
  { label: "Designer Picks", href: "/shop?edit=designer-picks" },
  { label: "Shop Everything", href: "/shop" },
];

export default async function CollectionsPage() {
  const [collections, facets] = await Promise.all([listCollections(), getFacets()]);
  const occasions = OCCASIONS.filter((o) => facets.occasions.includes(o));

  return (
    <>
      <header className="border-b border-clay/50 bg-cream/50">
        <div className="mx-auto max-w-4xl px-5 pb-14 pt-32 text-center sm:px-8 lg:pt-40">
          <p className="eyebrow mb-4 flex items-center justify-center gap-3 text-gold-deep">
            <span className="h-px w-8 bg-gold" />
            The Edit
            <span className="h-px w-8 bg-gold" />
          </p>
          <h1 className="type-display-lg text-charcoal">Curated Collections</h1>
          <p className="mx-auto mt-5 max-w-xl type-body leading-relaxed text-mist">
            Considered edits — from grand wedding silks to everyday handloom — each one a story waiting to
            be worn.
          </p>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {QUICK_EDITS.map((edit) => (
              <li key={edit.href}>
                <Link
                  href={edit.href}
                  className="type-btn inline-flex items-center gap-1.5 rounded-full border border-clay bg-white/40 px-5 py-2.5 text-charcoal transition-all duration-300 hover:border-charcoal hover:bg-charcoal hover:text-ivory"
                >
                  {edit.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <RevealGroup className="grid gap-5 md:grid-cols-2 lg:gap-8">
          {collections.map((c, i) => (
            <RevealItem key={c.id} className={i % 2 === 1 ? "md:translate-y-14" : ""}>
              <Link href={`/collections/${c.id}`} className="group relative block w-full overflow-hidden bg-ink outline-offset-4 focus-visible:outline-2 focus-visible:outline-gold">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image}
                  alt=""
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-[1200ms] ease-luxe motion-safe:group-hover:scale-[1.04]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/45 via-40% to-transparent to-75%" />
                <span className="absolute inset-x-0 bottom-0 flex flex-col p-7 sm:p-9">
                  <span className="eyebrow flex items-center gap-2 text-ivory/85">
                    <span className="h-px w-6 bg-gold-soft" aria-hidden />
                    {c.tagline}
                  </span>
                  <span className="type-heading-xl mt-3 block text-ivory">{c.name}</span>
                  <span className="mt-3 block max-w-sm type-body text-ivory/80">{c.description}</span>
                  <span className="type-btn mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-ivory px-6 py-2.5 text-charcoal transition-colors duration-300 group-hover:bg-white">
                    Shop this edit
                    <ArrowUpRight width={14} height={14} />
                  </span>
                </span>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>

        {occasions.length > 0 && (
          <Reveal className="mt-24 lg:mt-36">
            <h2 className="type-heading-xl text-center text-charcoal">Shop by Occasion</h2>
            <ul className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
              {occasions.map((occasion) => (
                <li key={occasion}>
                  <Link
                    href={`/shop?occasion=${encodeURIComponent(occasion)}`}
                    className="flex min-h-16 items-center justify-center border border-clay/70 bg-white/40 px-4 py-4 text-center text-sm font-medium text-charcoal transition-colors hover:border-charcoal hover:bg-charcoal hover:text-ivory"
                  >
                    {occasion}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        )}

        <Reveal className="mt-20 text-center lg:mt-28">
          <p className="type-heading-lg text-charcoal">Looking for something specific?</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-mist">
            Tell us the occasion and our stylists will curate a personal edit for you.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <StylistButton />
            <LinkButton href="/contact" variant="ghost">
              Contact Us
              <ArrowRight width={16} height={16} />
            </LinkButton>
          </div>
        </Reveal>
      </section>
    </>
  );
}
