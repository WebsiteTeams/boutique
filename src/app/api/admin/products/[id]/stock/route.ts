import { route } from "@/server/http";
import { updateStock } from "@/server/services/products";
import { badRequest } from "@/server/utils/errors";
import { stockSchema } from "@/server/validators";
import { revalidateCatalog } from "@/server/revalidate";

/** Set stock, or adjust it (e.g. `{ "adjust": -1 }` to record an in-store sale). */
export const PATCH = route({ auth: "admin", body: stockSchema }, async ({ params, body }) => {
  if (body.stock == null && body.adjust == null) throw badRequest("Provide a stock level or an adjustment.");
  const product = await updateStock(params.id, body);
  revalidateCatalog();
  return { product };
});
