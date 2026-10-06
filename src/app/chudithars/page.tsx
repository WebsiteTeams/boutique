import { Shop } from "@/components/shop/Shop";
import { P } from "@/lib/images";
import { pageMetadata } from "@/lib/seo";
import { listProducts } from "@/server/services/products";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Chudithars",
  description:
    "Shop ready-made chudithars in linen, silk, cotton and more — sizes S to XXL, made for the modern woman.",
  path: "/chudithars",
  image: P.categories.chudithars,
});

export default async function ChuditharsPage() {
  return (
    <Shop
      products={await listProducts({ category: "chudithars" })}
      title="Chudithars"
      description="Ready-made chudithars in crisp linen, flowing silk and breathable cotton — designed to move with your day, sized S to XXL."
      showSizeGuide
      image={P.categories.chudithars}
    />
  );
}
