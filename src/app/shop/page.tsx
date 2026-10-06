import { Shop } from "@/components/shop/Shop";
import { pageMetadata } from "@/lib/seo";
import { listProducts } from "@/server/services/products";

export const dynamic = "force-dynamic";

const EDITS: Record<string, { title: string; description: string; filter: Parameters<typeof listProducts>[0] }> = {
  bestsellers: {
    title: "Best Sellers",
    description: "The pieces our customers return to, season after season.",
    filter: { isBestseller: true },
  },
  "designer-picks": {
    title: "Designer Picks",
    description: "Hand-selected by our design team — the pieces we would choose ourselves.",
    filter: { isFeatured: true },
  },
};

export const metadata = pageMetadata({
  title: "Shop All",
  description:
    "Browse the complete UMA Designers collection — sarees, chudithars and bespoke blouses, filterable by occasion, fabric, colour and price.",
  path: "/shop",
});

export default async function ShopAllPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const selected = edit ? EDITS[edit] : undefined;
  return (
    <Shop
      products={await listProducts(selected?.filter ?? {})}
      title={selected?.title ?? "The Collection"}
      description={
        selected?.description ??
        "Every saree, chudithar and bespoke blouse in one place — filter by occasion, fabric, colour or price to find your piece."
      }
    />
  );
}
