import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shop } from "@/components/shop/Shop";
import { pageMetadata } from "@/lib/seo";
import { getCollection } from "@/server/services/admin";
import { listProducts } from "@/server/services/products";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const collection = await getCollection(id);
  if (!collection) notFound();
  return pageMetadata({
    title: collection.name,
    description: collection.description,
    path: `/collections/${collection.id}`,
    image: collection.image,
  });
}

export default async function CollectionPage({ params }: PageProps) {
  const { id } = await params;
  const collection = await getCollection(id);
  if (!collection) notFound();
  return (
    <Shop
      products={await listProducts({ collection: collection.id })}
      title={collection.name}
      description={collection.description}
      image={collection.image}
    />
  );
}
