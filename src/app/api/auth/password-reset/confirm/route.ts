import { route } from "@/server/http";
import { RATE_LIMITS } from "@/server/middleware/rate-limit";
import { resetPassword } from "@/server/services/password-reset";
import { passwordResetSchema } from "@/server/validators";

export const POST = route(
  { body: passwordResetSchema, rateLimit: RATE_LIMITS.passwordResetConfirm },
  async ({ body }) => {
    await resetPassword(body.token, body.password);
    return { ok: true };
  }
);
