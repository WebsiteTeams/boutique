import { route } from "@/server/http";
import { clearWishlist, getWishlist, setWishlistItem } from "@/server/services/account";
import { wishlistToggleSchema } from "@/server/validators";

export const GET = route({ auth: "user" }, async ({ user }) => ({ productIds: await getWishlist(user.id) }));

export const PUT = route({ auth: "user", body: wishlistToggleSchema }, async ({ user, body }) => ({
  productIds: await setWishlistItem(user.id, body.productId, body.saved),
}));

export const DELETE = route({ auth: "user" }, async ({ user }) => {
  await clearWishlist(user.id);
  return { productIds: [] };
});
