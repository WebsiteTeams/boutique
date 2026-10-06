import { route } from "@/server/http";
import { confirmPayment } from "@/server/services/orders";
import { paymentVerifySchema } from "@/server/validators";

/** Verifies the gateway signature server-side before the order is marked paid. */
export const POST = route({ auth: "user", body: paymentVerifySchema }, async ({ user, params, body }) => ({
  order: await confirmPayment(params.id, user, body),
}));
