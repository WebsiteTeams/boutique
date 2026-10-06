import { route } from "@/server/http";
import { RATE_LIMITS } from "@/server/middleware/rate-limit";
import { createOrder, listOrdersForUser } from "@/server/services/orders";
import { orderSchema } from "@/server/validators";

export const GET = route({ auth: "user" }, async ({ user }) => ({ orders: await listOrdersForUser(user.id) }));

export const POST = route(
  { auth: "user", body: orderSchema, rateLimit: RATE_LIMITS.order },
  async ({ user, body }) => createOrder(user, body)
);
