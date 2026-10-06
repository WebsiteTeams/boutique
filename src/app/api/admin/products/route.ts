import { route } from "@/server/http";
import { createProduct, listProducts } from "@/server/services/products";
import { productSchema } from "@/server/validators";
import { revalidateCatalog } from "@/server/revalidate";

export const GET = route({ auth: "admin" }, async ({ query }) => ({
  products: await listProducts({
    includeInactive: true,
    search: query.get("q") ?? undefined,
    category: query.get("category") ?? undefined,
  }),
}));

export const POST = route({ auth: "admin", body: productSchema }, async ({ body }) => {
  const product = await createProduct(body);
  revalidateCatalog();
  return { product };
});
