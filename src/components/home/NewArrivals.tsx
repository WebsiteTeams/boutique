import { listProducts } from "@/server/services/products";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LinkButton } from "@/components/ui/Button";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ArrowRight } from "lucide-react";

export async function NewArrivals() {
  const arrivals = await listProducts({ isNew: true, limit: 4 });
  if (arrivals.length === 0) return null;

  return (
    <section className="bg-cream/60">
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-32">
        <SectionHeading
          eyebrow="New Arrivals"
          title="Fresh From The Collection"
          subtitle="Discover our latest pieces, thoughtfully selected for the modern woman."
        />
        <ProductGrid products={arrivals} columns={4} />
        <div className="mt-12 flex justify-center">
          <LinkButton href="/new-arrivals" variant="outline">
            View All New Arrivals
            <ArrowRight width={16} height={16} />
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
