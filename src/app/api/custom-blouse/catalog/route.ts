import { activeCatalog } from "@/lib/blouse-pricing";
import { route } from "@/server/http";
import { getBlouseCatalog } from "@/server/services/blouse-catalog";

/** What the builder may offer right now: active designs and options with current prices. */
export const GET = route({}, async () => ({ catalog: activeCatalog(await getBlouseCatalog()) }));
