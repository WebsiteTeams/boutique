import { createSession } from "@/server/auth/session";
import { route } from "@/server/http";
import { RATE_LIMITS } from "@/server/middleware/rate-limit";
import { authenticate } from "@/server/services/account";
import { unauthorized } from "@/server/utils/errors";
import { loginSchema } from "@/server/validators";

/**
 * Staff sign-in. Only admin accounts get a session here; a customer account gets
 * the same message as a wrong password, so this page never reveals who is staff.
 */
export const POST = route({ body: loginSchema, rateLimit: RATE_LIMITS.adminLogin }, async ({ body }) => {
  const user = await authenticate(body.email, body.password);
  if (user.role !== "admin") throw unauthorized("Incorrect email or password.");
  await createSession(user.id);
  return { user };
});
