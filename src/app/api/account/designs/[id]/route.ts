import { route } from "@/server/http";
import { deleteDesign } from "@/server/services/account";

export const DELETE = route({ auth: "user" }, async ({ user, params }) => ({
  designs: await deleteDesign(user.id, params.id),
}));
