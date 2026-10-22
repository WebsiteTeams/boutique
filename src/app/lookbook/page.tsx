import { pageMetadata } from "@/lib/seo";
import { listCollections } from "@/server/services/admin";
import { listProducts } from "@/server/services/products";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EditorialCard } from "@/components/ui/EditorialCard";
import { CollectionCard } from "@/components/home/CollectionCard";

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

      <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24" aria-labelledby="looks-heading">
        <h2 id="looks-heading" className="sr-only">This season&apos;s looks</h2>
        <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:gap-8">
          {LOOKS.map((look) => {
            const product = shot(look.product);
            return (
              <RevealItem key={look.id} className={look.wide ? "sm:col-span-2" : ""}>
                <EditorialCard
                  href={product ? `/product/${product.slug}` : "/shop"}
                  image={look.image}
                  alt=""
                  title={look.name}
                  caption={look.caption}
                  cta="Shop the look"
                  aspect={look.wide ? "aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]" : "aspect-[4/5]"}
                />
              </RevealItem>
            );
          })}
        </RevealGroup>

        <Reveal className="mt-20 lg:mt-28">
          <SectionHeading
            eyebrow="The Archive"
            title="Past Edits, Still Timeless"
            align="center"
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {collections.map((c) => (
              <CollectionCard key={c.id} collection={c} aspect="aspect-[3/4]" />
            ))}
          </div>
        </Reveal>
      </section>
    </>
  );
}
