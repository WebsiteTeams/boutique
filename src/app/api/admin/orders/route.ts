import { route } from "@/server/http";
import { listAllOrders } from "@/server/services/orders";

export const GET = route({ auth: "admin" }, async ({ query }) => ({
  orders: await listAllOrders({ status: query.get("status") ?? undefined }),
}));
