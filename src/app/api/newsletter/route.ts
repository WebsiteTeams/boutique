import { route } from "@/server/http";
import { RATE_LIMITS } from "@/server/middleware/rate-limit";
import { subscribeNewsletter } from "@/server/services/boutique";
import { newsletterSchema } from "@/server/validators";

export const POST = route({ body: newsletterSchema, rateLimit: RATE_LIMITS.newsletter }, async ({ body }) =>
  subscribeNewsletter(body.email)
);
