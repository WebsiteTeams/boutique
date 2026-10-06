import { route } from "@/server/http";
import { cancelOrderAsCustomer } from "@/server/services/orders";
import { revalidateCatalog } from "@/server/revalidate";

export const POST = route({ auth: "user" }, async ({ user, params }) => {
  const order = await cancelOrderAsCustomer(params.id, user);
  revalidateCatalog();
  return { order };
});
