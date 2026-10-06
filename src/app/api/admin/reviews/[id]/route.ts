import { route } from "@/server/http";
import { deleteReview, moderateReview } from "@/server/services/boutique";
import { reviewUpdateSchema } from "@/server/validators";
import { revalidateCatalog } from "@/server/revalidate";

export const PATCH = route({ auth: "admin", body: reviewUpdateSchema }, async ({ params, body }) => {
  await moderateReview(params.id, body.status);
  revalidateCatalog();
  return { ok: true };
});

export const DELETE = route({ auth: "admin" }, async ({ params }) => {
  await deleteReview(params.id);
  revalidateCatalog();
  return { ok: true };
});
