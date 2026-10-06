import { route } from "@/server/http";
import { RATE_LIMITS } from "@/server/middleware/rate-limit";
import { resolveCoupon } from "@/server/services/coupons";
import { couponValidateSchema } from "@/server/validators";

export const POST = route({ body: couponValidateSchema, rateLimit: RATE_LIMITS.coupon }, async ({ body }) => ({
  coupon: await resolveCoupon(body.code, body.subtotal),
}));
