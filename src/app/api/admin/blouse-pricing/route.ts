import { route } from "@/server/http";
import { getBlouseCatalog, saveBlousePricing } from "@/server/services/blouse-catalog";
import { blousePricingSchema } from "@/server/validators";

export const GET = route({ auth: "admin" }, async () => ({ catalog: await getBlouseCatalog() }));

export const PUT = route({ auth: "admin", body: blousePricingSchema }, async ({ body }) => ({
  catalog: await saveBlousePricing(body),
}));
