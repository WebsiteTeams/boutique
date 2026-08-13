import { products } from "@/lib/data";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCarousel } from "@/components/product/ProductCarousel";

export function BestSellers() {
  const bestsellers = products.filter((p) => p.isBestSeller);

  return (
    <section className="mx-auto max-w-[1440px] px-0 py-20 sm:px-0 lg:py-32">
      <div className="px-5 sm:px-8 lg:px-10">
        <SectionHeading
          eyebrow="Bestsellers"
          title="Most Loved"
          subtitle="Pieces our customers keep coming back for."
        />
      </div>
      <ProductCarousel products={bestsellers} />
    </section>
  );
}
