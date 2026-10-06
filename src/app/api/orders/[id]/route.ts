import { route } from "@/server/http";
import { getOrderForUser } from "@/server/services/orders";

export const GET = route({ auth: "user" }, async ({ user, params }) => ({
  order: await getOrderForUser(params.id, user),
}));
