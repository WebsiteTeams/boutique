import { route } from "@/server/http";
import { getCart, saveCart } from "@/server/services/account";
import { cartSchema } from "@/server/validators";

export const GET = route({ auth: "user" }, async ({ user }) => getCart(user.id));

export const PUT = route({ auth: "user", body: cartSchema }, async ({ user, body }) =>
  saveCart(user.id, { items: body.items, couponCode: body.couponCode ?? null })
);
