import { categories } from "@/lib/data";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryCard } from "@/components/home/CategoryCard";
import { cn } from "@/lib/utils";

export function FeaturedCategories() {
  const [primary, ...rest] = categories;

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-32">
      <SectionHeading
        eyebrow="The Collection"
        title="Explore Our Categories"
        subtitle="Three worlds of Indian craftsmanship — each piece chosen by our styling team."
      />
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-8">
        <CategoryCard
          category={primary}
          className="aspect-[3/4] sm:aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[560px]"
        />
        <div className="grid grid-rows-2 gap-5 lg:gap-8">
          {rest.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              className={cn("aspect-[16/11] sm:aspect-[16/9] lg:aspect-auto")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
