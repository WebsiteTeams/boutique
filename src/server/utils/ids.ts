import { randomBytes } from "node:crypto";
import { Counters } from "@/server/db/models";

export const now = () => new Date().toISOString();

/** Random URL-safe id with a readable prefix, e.g. `usr_4f9c…`. */
export const newId = (prefix: string) => `${prefix}_${randomBytes(9).toString("base64url")}`;

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

/** Atomically increments and returns a named sequence (a single-document upsert, safe under concurrency). */
export async function nextSequence(name: string): Promise<number> {
  const doc = await Counters.findOneAndUpdate(
    { _id: name },
    { $inc: { value: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return doc!.value;
}

/** UMA-2026-000001 */
export async function nextOrderId(): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextSequence(`order-${year}`);
  return `UMA-${year}-${String(seq).padStart(6, "0")}`;
}

/** CB-2026-0001 */
export async function nextCustomBlouseId(): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextSequence(`custom-blouse-${year}`);
  return `CB-${year}-${String(seq).padStart(4, "0")}`;
}

