import { eq, sql } from "drizzle-orm";
import type { z } from "zod";
import type { LoyaltySummary } from "@/types";
import { db, type Database } from "@/server/db/client";
import { settings, users } from "@/server/db/schema";
import { now } from "@/server/utils/ids";
import type { loyaltySettingsSchema } from "@/server/validators";

export type LoyaltySettings = z.infer<typeof loyaltySettingsSchema>;

const SETTINGS_KEY = "loyalty";

/** Starting rules for UMA Rewards — editable from Admin → Rewards. */
export const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  enabled: true,
  pointsPerHundred: 1,
  tiers: [
    { name: "Silver", minPoints: 0, perk: "Early access to new collections" },
    { name: "Gold", minPoints: 500, perk: "Priority tailoring slots and festive previews" },
    { name: "VIP", minPoints: 1500, perk: "Personal stylist and private boutique appointments" },
  ],
};

export async function getLoyaltySettings(): Promise<LoyaltySettings> {
  const [row] = await db.select().from(settings).where(eq(settings.key, SETTINGS_KEY)).limit(1);
  const value = (row?.value as LoyaltySettings | undefined) ?? DEFAULT_LOYALTY_SETTINGS;
  return { ...value, tiers: [...value.tiers].sort((a, b) => a.minPoints - b.minPoints) };
}

export async function saveLoyaltySettings(value: LoyaltySettings) {
  await db
    .insert(settings)
    .values({ key: SETTINGS_KEY, value, updatedAt: now() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: now() } });
  return getLoyaltySettings();
}

export function pointsForAmount(amount: number, config: LoyaltySettings): number {
  if (!config.enabled) return 0;
  return Math.floor(amount / 100) * config.pointsPerHundred;
}

export function summariseLoyalty(points: number, config: LoyaltySettings): LoyaltySummary {
  const tiers = config.tiers;
  const current = [...tiers].reverse().find((t) => points >= t.minPoints) ?? tiers[0];
  const next = tiers.find((t) => t.minPoints > points) ?? null;
  return {
    points,
    tier: current.name,
    nextTier: next ? { name: next.name, pointsNeeded: next.minPoints - points } : null,
    pointsPerHundred: config.pointsPerHundred,
    tiers,
  };
}

export async function getLoyaltySummary(userId: string): Promise<LoyaltySummary | null> {
  const config = await getLoyaltySettings();
  if (!config.enabled) return null;
  const [row] = await db.select({ points: users.loyaltyPoints }).from(users).where(eq(users.id, userId)).limit(1);
  return summariseLoyalty(row?.points ?? 0, config);
}

export async function adjustPoints(tx: Pick<Database, "update">, userId: string, delta: number) {
  if (delta === 0) return;
  await tx
    .update(users)
    .set({ loyaltyPoints: sql`max(0, ${users.loyaltyPoints} + ${delta})` })
    .where(eq(users.id, userId));
}
