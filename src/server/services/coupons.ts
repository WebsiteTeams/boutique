import type { z } from "zod";
import { couponIneligibleReason, type CouponRule } from "@/lib/pricing";
import { Coupons, type CouponRow } from "@/server/db/models";
import { badRequest, conflict, notFound } from "@/server/utils/errors";
import { now } from "@/server/utils/ids";
import type { couponSchema } from "@/server/validators";

export type { CouponRow };

/** Coupon documents use the code as `_id`. */
const toRow = (doc: { _id: string } & Omit<CouponRow, "code">): CouponRow => {
  const { _id, ...rest } = doc;
  return { code: _id, ...rest };
};

export const toCouponRule = (row: CouponRow): CouponRule => ({
  code: row.code,
  description: row.description,
  type: row.type,
  value: row.value,
  minSubtotal: row.minSubtotal,
  maxDiscount: row.maxDiscount,
});

/**
 * Looks up a coupon and checks every rule against the given subtotal.
 * Throws a customer-facing error when it cannot be applied.
 */
export async function resolveCoupon(code: string, subtotal: number): Promise<CouponRule> {
  const doc = await Coupons.findById(code.toUpperCase()).lean();
  const row = doc ? toRow(doc) : null;
  if (!row || !row.isActive) throw badRequest("This coupon code is not valid.");
  if (row.expiresAt && row.expiresAt < now()) throw badRequest("This coupon has expired.");
  if (row.usageLimit != null && row.usedCount >= row.usageLimit) {
    throw badRequest("This coupon has reached its usage limit.");
  }
  const rule = toCouponRule(row);
  const reason = couponIneligibleReason(rule, subtotal);
  if (reason) throw badRequest(reason);
  return rule;
}

export async function recordCouponUse(code: string) {
  await Coupons.updateOne({ _id: code }, { $inc: { usedCount: 1 } });
}

export const listCoupons = async () => (await Coupons.find().sort({ createdAt: -1 }).lean()).map(toRow);

export async function createCoupon(input: z.infer<typeof couponSchema>) {
  if (await Coupons.exists({ _id: input.code })) throw conflict("A coupon with this code already exists.");
  const doc = await Coupons.create({
    _id: input.code,
    description: input.description,
    type: input.type,
    value: input.value,
    minSubtotal: input.minSubtotal,
    maxDiscount: input.maxDiscount ?? null,
    usageLimit: input.usageLimit ?? null,
    expiresAt: input.expiresAt ? `${input.expiresAt}T23:59:59.999Z` : null,
    isActive: input.isActive,
    createdAt: now(),
  });
  return toRow(doc.toObject());
}

export async function setCouponActive(code: string, isActive: boolean) {
  const doc = await Coupons.findOneAndUpdate({ _id: code }, { $set: { isActive } }, { new: true }).lean();
  if (!doc) throw notFound("Coupon not found.");
  return toRow(doc);
}

export async function deleteCoupon(code: string) {
  const res = await Coupons.deleteOne({ _id: code });
  if (res.deletedCount === 0) throw notFound("Coupon not found.");
}
