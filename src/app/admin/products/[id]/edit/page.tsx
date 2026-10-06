import { notFound } from "next/navigation";
import { listCollections } from "@/server/services/admin";
import { getProductRowById, toProduct } from "@/server/services/products";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageTitle } from "@/components/admin/ui";
import { LinkButton } from "@/components/ui/Button";

export const metadata = { title: "Edit Product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row, collections] = await Promise.all([getProductRowById(decodeURIComponent(id)), listCollections(true)]);
  if (!row) notFound();

  return (
    <>
      <PageTitle
        title="Edit Product"
        description={row.name}
        action={
          row.isActive ? (
            <LinkButton href={`/product/${row.slug}`} variant="outline" size="sm">
              View on Storefront
            </LinkButton>
          ) : undefined
        }
      />
      <ProductForm product={toProduct(row)} isActive={row.isActive} collections={collections} />
    </>
  );
}
