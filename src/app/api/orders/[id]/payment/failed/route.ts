import { route } from "@/server/http";
import { markPaymentFailed } from "@/server/services/orders";

export const POST = route({ auth: "user" }, async ({ user, params }) => {
  await markPaymentFailed(params.id, user);
  return { ok: true };
});
