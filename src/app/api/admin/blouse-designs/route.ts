import { route } from "@/server/http";
import { createBlouseDesign, getBlouseCatalog } from "@/server/services/blouse-catalog";
import { blouseDesignSchema } from "@/server/validators";

export const GET = route({ auth: "admin" }, async () => ({ designs: (await getBlouseCatalog()).designs }));

export const POST = route({ auth: "admin", body: blouseDesignSchema }, async ({ body }) => ({
  design: await createBlouseDesign(body),
}));
