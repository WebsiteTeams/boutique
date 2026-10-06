import { route } from "@/server/http";
import { updateCustomBlouseStatus } from "@/server/services/orders";
import { customBlouseUpdateSchema } from "@/server/validators";

export const PATCH = route({ auth: "admin", body: customBlouseUpdateSchema }, async ({ params, body, user }) => {
  await updateCustomBlouseStatus(params.id, body.status, user.name);
  return { ok: true };
});
