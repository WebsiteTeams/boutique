import { route } from "@/server/http";
import { mergeCart } from "@/server/services/account";
import { cartSchema } from "@/server/validators";

/** Called once after sign-in to fold the guest cart into the account cart. */
export const POST = route({ auth: "user", body: cartSchema }, async ({ user, body }) =>
  mergeCart(user.id, { items: body.items, couponCode: body.couponCode ?? null })
);
