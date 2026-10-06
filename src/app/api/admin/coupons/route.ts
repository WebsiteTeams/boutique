import { route } from "@/server/http";
import { createCoupon, listCoupons } from "@/server/services/coupons";
import { couponSchema } from "@/server/validators";

export const GET = route({ auth: "admin" }, async () => ({ coupons: await listCoupons() }));

export const POST = route({ auth: "admin", body: couponSchema }, async ({ body }) => ({
  coupon: await createCoupon(body),
}));
