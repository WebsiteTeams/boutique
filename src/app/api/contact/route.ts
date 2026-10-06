import { route } from "@/server/http";
import { RATE_LIMITS } from "@/server/middleware/rate-limit";
import { createContactMessage } from "@/server/services/boutique";
import { contactSchema } from "@/server/validators";

export const POST = route({ body: contactSchema, rateLimit: RATE_LIMITS.contact }, async ({ body }) =>
  createContactMessage(body)
);
