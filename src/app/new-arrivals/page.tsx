import { Shop } from "@/components/shop/Shop";
import { pageMetadata } from "@/lib/seo";
import { listProducts } from "@/server/services/products";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "New Arrivals",
  description:
    "Fresh from the UMA collection — the latest sarees, chudithars and designs for the modern woman.",
  path: "/new-arrivals",
});

export default async function NewArrivalsPage() {
  return (
    <Shop
      products={await listProducts({ isNew: true })}
      title="New Arrivals"
      description="Fresh from the atelier — the newest additions to the collection, ready to become your next favourite."
    />
  );
}
