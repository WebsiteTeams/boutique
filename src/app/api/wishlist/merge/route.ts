import { route } from "@/server/http";
import { mergeWishlist } from "@/server/services/account";
import { wishlistSchema } from "@/server/validators";

export const POST = route({ auth: "user", body: wishlistSchema }, async ({ user, body }) => ({
  productIds: await mergeWishlist(user.id, body.productIds),
}));
