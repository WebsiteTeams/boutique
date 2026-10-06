import { z } from "zod";
import { route } from "@/server/http";
import { unsubscribeNewsletter } from "@/server/services/boutique";

export const POST = route({ body: z.object({ token: z.string().min(1).max(100) }) }, async ({ body }) => ({
  email: await unsubscribeNewsletter(body.token),
}));
