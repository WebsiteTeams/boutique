import { route } from "@/server/http";
import { RATE_LIMITS } from "@/server/middleware/rate-limit";
import { changePassword } from "@/server/services/account";
import { passwordChangeSchema } from "@/server/validators";

export const POST = route(
  { auth: "user", body: passwordChangeSchema, rateLimit: RATE_LIMITS.login },
  async ({ user, body }) => {
    await changePassword(user.id, body.currentPassword, body.newPassword);
    return { ok: true };
  }
);
