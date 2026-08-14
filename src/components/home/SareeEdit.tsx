import { products } from "@/lib/data";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LinkButton } from "@/components/ui/Button";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ArrowRight } from "lucide-react";

const SHORTCUTS = [
  { label: "Silk", href: "/sarees?sub=Silk%20Sarees" },
  { label: "Handloom", href: "/sarees?sub=Handloom%20Sarees" },
  { label: "Cotton", href: "/sarees?sub=Cotton%20Sarees" },
  { label: "Designer", href: "/sarees?sub=Designer%20Sarees" },
  { label: "Bridal", href: "/sarees?occasion=Bridal" },
  { label: "Festive", href: "/sarees?occasion=Festive" },
];

export function SareeEdit() {
  const sarees = products.filter((p) => p.category === "sarees").slice(0, 8);

  return (
    <section className="bg-cream/60">
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-32">
        <SectionHeading
          eyebrow="The Saree Edit"
          title="Woven Stories, Made to Last."
          subtitle="From handloom cottons to regal silks, each saree carries the story of the hands that wove it."
        />

        {/* <div className="mb-12 flex  items-center justify-center gap-2.5 sm:gap-3">
          {SHORTCUTS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              className="type-btn group inline-flex items-center gap-1.5 rounded-full border border-clay bg-white/40 px-5 py-2.5 text-charcoal transition-all duration-300 hover:border-charcoal hover:bg-charcoal hover:text-ivory"
            >
              {s.label}
              <ArrowRight
                width={13}
                height={13}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </a>
          ))}
        </div> */}
        <div className="mb-12 flex items-center justify-start gap-2.5 overflow-x-auto px-1 pb-2 sm:justify-center sm:gap-3 scrollbar-hide">
  {SHORTCUTS.map((s) => (
    <a
      key={s.label}
      href={s.href}
      className="type-btn group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-clay bg-white/40 px-5 py-2.5 text-charcoal transition-all duration-300 hover:border-charcoal hover:bg-charcoal hover:text-ivory"
    >
      {s.label}

      <ArrowRight
        width={13}
        height={13}
        className="shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
      />
    </a>
  ))}
</div>

        <ProductGrid products={sarees} columns={4} />

        <div className="mt-14 flex justify-center">
          <LinkButton href="/sarees" variant="outline">
            View All Sarees
            <ArrowRight width={16} height={16} />
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
