import { route } from "@/server/http";
import { RATE_LIMITS } from "@/server/middleware/rate-limit";
import { requestPasswordReset } from "@/server/services/password-reset";
import { passwordResetRequestSchema } from "@/server/validators";

export const POST = route(
  { body: passwordResetRequestSchema, rateLimit: RATE_LIMITS.passwordResetRequest },
  async ({ body }) => {
    await requestPasswordReset(body.email);
    return { ok: true };
  }
);
