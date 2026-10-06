import { listCollections } from "@/server/services/admin";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageTitle } from "@/components/admin/ui";

export const metadata = { title: "New Product" };

export default async function NewProductPage() {
  const collections = await listCollections(true);
  return (
    <>
      <PageTitle title="Add Product" description="Create a new piece for the storefront." />
      <ProductForm collections={collections} />
    </>
  );
}
