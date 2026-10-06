import { listProducts } from "@/server/services/products";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCarousel } from "@/components/product/ProductCarousel";

export async function BestSellers() {
  const bestsellers = await listProducts({ isBestseller: true, sort: "popular", limit: 10 });
  if (bestsellers.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1440px] py-20 lg:py-32">
      <div className="px-5 sm:px-8 lg:px-10">
        <SectionHeading
          eyebrow="Most Loved"
          title="The Bestsellers"
          subtitle="The pieces our customers can't stop wearing."
        />
      </div>
      <ProductCarousel products={bestsellers} />
    </section>
  );
}
