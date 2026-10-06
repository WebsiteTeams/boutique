import { route } from "@/server/http";
import { RATE_LIMITS } from "@/server/middleware/rate-limit";
import { retryPayment } from "@/server/services/orders";

export const POST = route({ auth: "user", rateLimit: RATE_LIMITS.order }, async ({ user, params }) => ({
  payment: await retryPayment(params.id, user),
}));
