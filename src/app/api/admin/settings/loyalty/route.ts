import { route } from "@/server/http";
import { getLoyaltySettings, saveLoyaltySettings } from "@/server/services/loyalty";
import { loyaltySettingsSchema } from "@/server/validators";

export const GET = route({ auth: "admin" }, async () => ({ settings: await getLoyaltySettings() }));

export const PUT = route({ auth: "admin", body: loyaltySettingsSchema }, async ({ body }) => ({
  settings: await saveLoyaltySettings(body),
}));
