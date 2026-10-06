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
      {/* sm / md: swipeable carousel of portrait cards */}
      <div className="lg:hidden">
        <div
          className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 pb-2 sm:-mx-8 sm:scroll-px-8 sm:px-8"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
        >
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="w-[72%] shrink-0 snap-start sm:w-[46%]"
            >
              <CategoryCard
                category={cat}
                className="aspect-[3/4] h-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* lg+: editorial grid */}
      <div className="hidden gap-5 lg:grid lg:grid-cols-2 lg:gap-8">
        <CategoryCard
          category={primary}
          className="aspect-auto h-full min-h-[560px]"
        />
        <div className="grid grid-rows-2 gap-5 lg:gap-8">
          {rest.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              className={cn("aspect-auto")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
