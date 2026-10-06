import { route } from "@/server/http";
import { applyOrderUpdate, getOrderForAdmin } from "@/server/services/orders";
import { orderUpdateSchema } from "@/server/validators";
import { revalidateCatalog } from "@/server/revalidate";

export const GET = route({ auth: "admin" }, async ({ params }) => ({
  order: await getOrderForAdmin(params.id),
}));

export const PATCH = route({ auth: "admin", body: orderUpdateSchema }, async ({ params, body, user }) => {
  const order = await applyOrderUpdate(params.id, body, user.name);
  revalidateCatalog();
  return { order };
});
