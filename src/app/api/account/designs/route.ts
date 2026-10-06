import { route } from "@/server/http";
import { listDesigns, saveDesign } from "@/server/services/account";
import { savedDesignSchema } from "@/server/validators";

export const GET = route({ auth: "user" }, async ({ user }) => ({ designs: await listDesigns(user.id) }));

export const POST = route({ auth: "user", body: savedDesignSchema }, async ({ user, body }) => ({
  designs: await saveDesign(user.id, body),
}));
