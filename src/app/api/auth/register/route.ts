import { createSession } from "@/server/auth/session";
import { route } from "@/server/http";
import { RATE_LIMITS } from "@/server/middleware/rate-limit";
import { registerUser } from "@/server/services/account";
import { registerSchema } from "@/server/validators";

export const POST = route({ body: registerSchema, rateLimit: RATE_LIMITS.register }, async ({ body }) => {
  const user = await registerUser(body);
  await createSession(user.id);
  return { user };
});
