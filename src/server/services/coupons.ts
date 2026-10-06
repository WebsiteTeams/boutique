import { desc, eq, sql } from "drizzle-orm";
import type { z } from "zod";
import { couponIneligibleReason, type CouponRule } from "@/lib/pricing";
import { db, type Database } from "@/server/db/client";
import { coupons } from "@/server/db/schema";
import { badRequest, conflict, notFound } from "@/server/utils/errors";
import { now } from "@/server/utils/ids";
import type { couponSchema } from "@/server/validators";

export type CouponRow = typeof coupons.$inferSelect;

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
  const [row] = await db.select().from(coupons).where(eq(coupons.code, code.toUpperCase())).limit(1);
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

export async function recordCouponUse(tx: Pick<Database, "update">, code: string) {
  await tx
    .update(coupons)
    .set({ usedCount: sql`${coupons.usedCount} + 1` })
    .where(eq(coupons.code, code));
}

export const listCoupons = () => db.select().from(coupons).orderBy(desc(coupons.createdAt));

export async function createCoupon(input: z.infer<typeof couponSchema>) {
  const [existing] = await db.select().from(coupons).where(eq(coupons.code, input.code)).limit(1);
  if (existing) throw conflict("A coupon with this code already exists.");
  const [row] = await db
    .insert(coupons)
    .values({
      code: input.code,
      description: input.description,
      type: input.type,
      value: input.value,
      minSubtotal: input.minSubtotal,
      maxDiscount: input.maxDiscount ?? null,
      usageLimit: input.usageLimit ?? null,
      expiresAt: input.expiresAt ? `${input.expiresAt}T23:59:59.999Z` : null,
      isActive: input.isActive,
      createdAt: now(),
    })
    .returning();
  return row;
}

export async function setCouponActive(code: string, isActive: boolean) {
  const [row] = await db.update(coupons).set({ isActive }).where(eq(coupons.code, code)).returning();
  if (!row) throw notFound("Coupon not found.");
  return row;
}

export async function deleteCoupon(code: string) {
  const deleted = await db.delete(coupons).where(eq(coupons.code, code)).returning({ code: coupons.code });
  if (deleted.length === 0) throw notFound("Coupon not found.");
}
