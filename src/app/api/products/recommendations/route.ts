import { route } from "@/server/http";
import { getRecommendations } from "@/server/services/products";

/** Personalised picks based on product ids the shopper viewed or saved. */
export const GET = route({}, async ({ query }) => {
  const seeds = (query.get("seeds") ?? "").split(",").filter(Boolean).slice(0, 20);
  return { products: await getRecommendations(seeds, 8) };
});
