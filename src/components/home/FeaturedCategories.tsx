import { categories } from "@/lib/data";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryCard } from "@/components/home/CategoryCard";

export function FeaturedCategories() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-32">
      <SectionHeading
        eyebrow="Curated For You"
        title="Shop by Category"
        subtitle="Three worlds of craftsmanship — each piece chosen by our styling team."
      />
      <div className="grid gap-5 sm:grid-cols-3 sm:gap-6 lg:gap-8">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </section>
  );
}
