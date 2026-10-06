import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { OCCASIONS } from "@/lib/config";
import { getFacets } from "@/server/services/products";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StylistButton } from "@/components/ui/StylistButton";

/** Occasion shortcuts — only occasions that currently have products are shown. */
export async function ShopByOccasion() {
  const { occasions } = await getFacets();
  const available = OCCASIONS.filter((o) => occasions.includes(o));
  if (available.length === 0) return null;

  const card = (occasion: (typeof OCCASIONS)[number]) => (
    <Link
      href={`/shop?occasion=${encodeURIComponent(occasion)}`}
      className="group flex h-full min-h-24 items-center justify-between gap-3 border border-clay/70 bg-white/40 px-5 py-5 transition-all duration-300 hover:border-charcoal hover:bg-charcoal"
    >
      <span className="type-heading-md text-charcoal transition-colors group-hover:text-ivory">
        {occasion}
      </span>
      <ArrowUpRight
        width={17}
        height={17}
        className="shrink-0 text-gold-deep transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold-soft"
      />
    </Link>
  );

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
      <SectionHeading
        eyebrow="Shop by Occasion"
        title="Dressed For The Moment"
        subtitle="Tell us where you are going — we will show you what to wear."
      />

      {/* sm / md: swipeable carousel */}
      <ul
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-1 sm:-mx-8 sm:gap-4 sm:scroll-px-8 sm:px-8 lg:hidden"
        style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
      >
        {available.map((occasion) => (
          <li
            key={occasion}
            className="w-[58%] shrink-0 snap-start min-[420px]:w-[48%] sm:w-[38%] md:w-[27%]"
          >
            {card(occasion)}
          </li>
        ))}
      </ul>

      {/* lg+: grid */}
      <ul className="hidden grid-cols-4 gap-4 lg:grid">
        {available.map((occasion) => (
          <li key={occasion}>{card(occasion)}</li>
        ))}
      </ul>

      <div className="mt-12 flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-mist">Need help choosing an outfit? Chat with our stylist.</p>
        <StylistButton />
      </div>
    </section>
  );
}
