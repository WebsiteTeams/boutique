import type { z } from "zod";
import type { LoyaltySummary } from "@/types";
import { Settings, Users } from "@/server/db/models";
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
    { name: "VIP", minPoints: 1500, perk: "Personal stylist and private boutique visits" },
  ],
};

export async function getLoyaltySettings(): Promise<LoyaltySettings> {
  const row = await Settings.findById(SETTINGS_KEY).lean();
  const value = (row?.value as LoyaltySettings | undefined) ?? DEFAULT_LOYALTY_SETTINGS;
  return { ...value, tiers: [...value.tiers].sort((a, b) => a.minPoints - b.minPoints) };
}

export async function saveLoyaltySettings(value: LoyaltySettings) {
  await Settings.updateOne({ _id: SETTINGS_KEY }, { $set: { value, updatedAt: now() } }, { upsert: true });
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
  const row = await Users.findById(userId, { loyaltyPoints: 1 }).lean();
  return summariseLoyalty(row?.loyaltyPoints ?? 0, config);
}

/** Adds (or removes) points atomically, never going below zero. */
export async function adjustPoints(userId: string, delta: number) {
  if (delta === 0) return;
  await Users.updateOne({ _id: userId }, [{ $set: { loyaltyPoints: { $max: [0, { $add: ["$loyaltyPoints", delta] }] } } }], {
    updatePipeline: true,
  });
}
