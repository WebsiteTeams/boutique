import { route } from "@/server/http";
import { deleteCoupon, setCouponActive } from "@/server/services/coupons";
import { couponUpdateSchema } from "@/server/validators";

export const PATCH = route({ auth: "admin", body: couponUpdateSchema }, async ({ params, body }) => ({
  coupon: await setCouponActive(params.code.toUpperCase(), body.isActive),
}));

export const DELETE = route({ auth: "admin" }, async ({ params }) => {
  await deleteCoupon(params.code.toUpperCase());
  return { ok: true };
});
