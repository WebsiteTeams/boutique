import { route } from "@/server/http";
import { deleteProduct, getProductRowById, toProduct, updateProduct } from "@/server/services/products";
import { notFound } from "@/server/utils/errors";
import { productSchema } from "@/server/validators";
import { revalidateCatalog } from "@/server/revalidate";

export const GET = route({ auth: "admin" }, async ({ params }) => {
  const row = await getProductRowById(params.id);
  if (!row) throw notFound("Product not found.");
  return { product: toProduct(row) };
});

export const PUT = route({ auth: "admin", body: productSchema }, async ({ params, body }) => {
  const product = await updateProduct(params.id, body);
  revalidateCatalog();
  return { product };
});

export const DELETE = route({ auth: "admin" }, async ({ params }) => {
  await deleteProduct(params.id);
  revalidateCatalog();
  return { ok: true };
});
