import { pageMetadata } from "@/lib/seo";
import { listCollections } from "@/server/services/admin";
import { listProducts } from "@/server/services/products";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LinkButton } from "@/components/ui/Button";

const LOOKS = [
  {
    id: "look-1",
    name: "The Banarasi Hour",
    caption: "Ivory & gold butterfly silk, styled with a draped dupatta",
    product: "Banarasi Butterfly Silk Saree",
    image: "/images/sarees/saree-banarasi-butterfly-1.png",
    wide: true,
  },
  {
    id: "look-2",
    name: "Monsoon Chanderi",
    caption: "Featherlight chanderi with pearl-trimmed blouse",
    product: "Chanderi Moonlight Saree",
    image: "/images/sarees/saree-chanderi-moonlight-1.png",
  },
  {
    id: "look-3",
    name: "Atelier Afternoon",
    caption: "Sage linen palazzo paired with a boat-neck blouse",
    product: "Sage Linen Palazzo Chudithar",
    image: "/images/chudithars/chudithar-sage-linen-1.png",
  },
  {
    id: "look-4",
    name: "The Bride's Court",
    caption: "Bridal silk with a high-collar custom blouse",
    product: "Kanjivaram Rose Gold Silk Saree",
    image: "/images/collections/collection-bridal.png",
    wide: true,
  },
  {
    id: "look-5",
    name: "Festival Light",
    caption: "Bandhani charm and gold zari for the festive table",
    product: "Bandhani Fuchsia Saree",
    image: "/images/collections/collection-festive.png",
  },
  {
    id: "look-6",
    name: "The Everyday Muse",
    caption: "Handloom cotton, pleated with ease",
    product: "Handloom Organic Cotton Saree",
    image: "/images/collections/collection-everyday.png",
  },
];

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Lookbook",
  description:
    "Styled looks from the current UMA Designers edit — see how our sarees and chudithars drape, pair and celebrate, then shop the look.",
  path: "/lookbook",
  image: "/images/collections/collection-bridal.png",
});

export default async function LookbookPage() {
  const [products, collections] = await Promise.all([listProducts(), listCollections()]);
  const shot = (name: string) => products.find((p) => p.name === name);

  return (
    <>
      <header className="border-b border-clay/50 bg-cream/50">
        <div className="mx-auto max-w-4xl px-5 pb-12 pt-32 text-center sm:px-8 lg:pt-40">
          <p className="eyebrow mb-3 text-gold-deep">The Lookbook</p>
          <h1 className="type-display-lg text-charcoal">
            Seasonal Moods, Editorial Wear
          </h1>
          <p className="mx-auto mt-4 max-w-xl type-body leading-relaxed text-mist">
            Styled looks from the current edit — discover how our weaves drape, pair and
            celebrate, then shop the look with one click.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <RevealGroup className="grid gap-8 sm:grid-cols-2">
          {LOOKS.map((look) => (
            <RevealItem key={look.id} className={look.wide ? "sm:col-span-2" : ""}>
              <LinkButton
                href={shot(look.product) ? `/product/${shot(look.product)?.slug}` : "/shop"}
                variant="ghost"
                className="group relative block w-full overflow-hidden rounded-2xl p-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={look.image}
                  alt={look.name}
                  className={
                    (look.wide ? "aspect-[21/9]" : "aspect-[4/5]") +
                    " w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  }
                />
                <span className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
                <span className="absolute inset-x-6 bottom-6 flex flex-wrap items-end justify-between gap-3 text-left">
                  <span>
                    <span className="type-heading-lg block text-ivory">{look.name}</span>
                    <span className="mt-1 block max-w-sm type-body-sm text-ivory/80">{look.caption}</span>
                  </span>
                  <span className="type-label-sm rounded-full border border-ivory/50 px-4 py-2 text-ivory backdrop-blur-sm transition-colors group-hover:bg-ivory group-hover:text-charcoal">
                    Shop the Look
                  </span>
                </span>
              </LinkButton>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-20">
          <SectionHeading
            eyebrow="The Archive"
            title="Past Edits, Still Timeless"
            align="center"
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {collections.map((c) => (
              <LinkButton
                key={c.id}
                href={`/collections/${c.id}`}
                variant="ghost"
                className="group relative block overflow-hidden p-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image}
                  alt={c.name}
                  className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-charcoal/35 transition-colors group-hover:bg-charcoal/25" />
                <span className="type-heading-md absolute inset-x-4 bottom-4 text-ivory">
                  {c.name}
                </span>
              </LinkButton>
            ))}
          </div>
        </Reveal>
      </section>
    </>
  );
}
