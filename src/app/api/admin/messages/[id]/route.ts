import { route } from "@/server/http";
import { updateContactMessage } from "@/server/services/boutique";
import { messageUpdateSchema } from "@/server/validators";

export const PATCH = route({ auth: "admin", body: messageUpdateSchema }, async ({ params, body }) => {
  await updateContactMessage(params.id, body.status);
  return { ok: true };
});
