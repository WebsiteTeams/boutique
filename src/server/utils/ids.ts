import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import { counters } from "@/server/db/schema";

export const now = () => new Date().toISOString();

/** Random URL-safe id with a readable prefix, e.g. `usr_4f9c…`. */
export const newId = (prefix: string) => `${prefix}_${randomBytes(9).toString("base64url")}`;

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

type Executor = Pick<Database, "insert">;

/** Atomically increments and returns a named sequence. Call inside the surrounding transaction. */
export async function nextSequence(tx: Executor, name: string): Promise<number> {
  const [row] = await tx
    .insert(counters)
    .values({ name, value: 1 })
    .onConflictDoUpdate({ target: counters.name, set: { value: sql`${counters.value} + 1` } })
    .returning({ value: counters.value });
  return row.value;
}

/** UMA-2026-000001 */
export async function nextOrderId(tx: Executor): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextSequence(tx, `order-${year}`);
  return `UMA-${year}-${String(seq).padStart(6, "0")}`;
}

/** CB-2026-0001 */
export async function nextCustomBlouseId(tx: Executor): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextSequence(tx, `custom-blouse-${year}`);
  return `CB-${year}-${String(seq).padStart(4, "0")}`;
}

/** APT-2026-0001 */
export async function nextAppointmentId(tx: Executor): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextSequence(tx, `appointment-${year}`);
  return `APT-${year}-${String(seq).padStart(4, "0")}`;
}
