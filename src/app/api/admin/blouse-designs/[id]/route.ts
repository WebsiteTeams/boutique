import { route } from "@/server/http";
import { deleteBlouseDesign, updateBlouseDesign } from "@/server/services/blouse-catalog";
import { blouseDesignSchema } from "@/server/validators";

export const PUT = route({ auth: "admin", body: blouseDesignSchema }, async ({ params, body }) => ({
  design: await updateBlouseDesign(params.id, body),
}));

export const DELETE = route({ auth: "admin" }, async ({ params }) => {
  await deleteBlouseDesign(params.id);
  return { ok: true };
});
