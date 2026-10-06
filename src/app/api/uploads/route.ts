import { route } from "@/server/http";
import { RATE_LIMITS } from "@/server/middleware/rate-limit";
import { saveImage, type UploadFolder } from "@/server/services/storage";
import { badRequest, forbidden, unauthorized } from "@/server/utils/errors";

/**
 * Image upload (multipart form: `file`, `folder`).
 *  - references: blouse reference photos, open to guests and rate limited
 *  - reviews:    signed-in customers
 *  - products:   admins only
 * File type is verified from its bytes and size is capped at 5 MB.
 */
export const POST = route({ rateLimit: RATE_LIMITS.upload }, async ({ request, user }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw badRequest("Invalid upload.");
  }
  const folder = String(form.get("folder") ?? "references") as UploadFolder;
  if (!["references", "reviews", "products"].includes(folder)) throw badRequest("Unknown upload folder.");
  if (folder === "reviews" && !user) throw unauthorized();
  if (folder === "products" && user?.role !== "admin") throw user ? forbidden() : unauthorized();
  const file = form.get("file");
  if (!(file instanceof File)) throw badRequest("No file was uploaded.");
  return { url: await saveImage(file, folder) };
});
