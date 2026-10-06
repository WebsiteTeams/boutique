import { createSession } from "@/server/auth/session";
import { route } from "@/server/http";
import { RATE_LIMITS } from "@/server/middleware/rate-limit";
import { authenticate } from "@/server/services/account";
import { loginSchema } from "@/server/validators";

export const POST = route({ body: loginSchema, rateLimit: RATE_LIMITS.login }, async ({ body }) => {
  const user = await authenticate(body.email, body.password);
  await createSession(user.id);
  return { user };
});
