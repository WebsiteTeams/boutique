import { route } from "@/server/http";
import { updateProfile } from "@/server/services/account";
import { profileSchema } from "@/server/validators";

export const PATCH = route({ auth: "user", body: profileSchema }, async ({ user, body }) => ({
  user: await updateProfile(user.id, body),
}));
