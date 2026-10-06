import { Shop } from "@/components/shop/Shop";
import { P } from "@/lib/images";
import { pageMetadata } from "@/lib/seo";
import { listProducts } from "@/server/services/products";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Sarees",
  description:
    "Shop handwoven silk, handloom, cotton and designer sarees — curated by UMA Designers for every occasion.",
  path: "/sarees",
  image: P.categories.sarees,
});

export default async function SareesPage() {
  return (
    <Shop
      products={await listProducts({ category: "sarees" })}
      title="Sarees"
      description="Handwoven silks, feather-light handlooms and designer drapes — a considered edit for weddings, festive evenings and every day in between."
      image={P.categories.sarees}
    />
  );
}
