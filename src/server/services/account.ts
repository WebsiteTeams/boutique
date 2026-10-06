import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { z } from "zod";
import type { CartItem, MeasurementProfile, SavedAddress, SavedDesign, SessionUser } from "@/types";
import { calculateBlousePrice, isValidBlouseSelection } from "@/lib/blouse";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { toSessionUser } from "@/server/auth/session";
import { db } from "@/server/db/client";
import {
  addresses,
  carts,
  measurementProfiles,
  orders,
  products,
  savedDesigns,
  users,
  wishlistItems,
} from "@/server/db/schema";
import { badRequest, conflict, notFound, unauthorized } from "@/server/utils/errors";
import { newId, now } from "@/server/utils/ids";
import type {
  addressSchema,
  measurementProfileSchema,
  profileSchema,
  registerSchema,
  savedDesignSchema,
} from "@/server/validators";

/* ---------------- Identity ---------------- */

export async function registerUser(input: z.infer<typeof registerSchema>): Promise<SessionUser> {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (existing) throw conflict("An account with this email already exists. Please sign in instead.");
  const [row] = await db
    .insert(users)
    .values({
      id: newId("usr"),
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      role: "customer",
      createdAt: now(),
    })
    .returning();
  return toSessionUser(row);
}

// Used to keep login timing similar whether or not the email exists.
const DUMMY_HASH = "scrypt$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(86);

export async function authenticate(email: string, password: string): Promise<SessionUser> {
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const ok = await verifyPassword(password, row?.passwordHash ?? DUMMY_HASH);
  if (!row || !ok) throw unauthorized("Incorrect email or password.");
  return toSessionUser(row);
}

export async function updateProfile(userId: string, input: z.infer<typeof profileSchema>) {
  const [row] = await db
    .update(users)
    .set({ name: input.name, phone: input.phone })
    .where(eq(users.id, userId))
    .returning();
  return toSessionUser(row);
}

export async function changePassword(userId: string, current: string, next: string) {
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!row || !(await verifyPassword(current, row.passwordHash))) {
    throw badRequest("Please check the highlighted fields.", { currentPassword: "Current password is incorrect" });
  }
  await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, userId));
}

/* ---------------- Addresses ---------------- */

const toAddress = (row: typeof addresses.$inferSelect): SavedAddress => ({
  id: row.id,
  label: row.label,
  fullName: row.fullName,
  phone: row.phone,
  line1: row.line1,
  line2: row.line2 || undefined,
  city: row.city,
  state: row.state,
  pincode: row.pincode,
  isDefault: row.isDefault,
});

export async function listAddresses(userId: string): Promise<SavedAddress[]> {
  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, userId))
    .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
  return rows.map(toAddress);
}

type AddressInput = z.infer<typeof addressSchema>;

export async function saveAddress(userId: string, input: AddressInput, id?: string): Promise<SavedAddress[]> {
  await db.transaction(async (tx) => {
    const existing = await tx.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, userId));
    if (id && !existing.some((a) => a.id === id)) throw notFound("Address not found.");
    if (!id && existing.length >= 10) throw badRequest("You can save up to 10 addresses.");
    const makeDefault = input.isDefault || existing.length === 0;
    if (makeDefault) await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    const values = { ...input, isDefault: makeDefault };
    if (id) {
      await tx.update(addresses).set(values).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
    } else {
      await tx.insert(addresses).values({ id: newId("adr"), userId, ...values, createdAt: now() });
    }
  });
  return listAddresses(userId);
}

export async function deleteAddress(userId: string, id: string): Promise<SavedAddress[]> {
  const deleted = await db
    .delete(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
    .returning();
  if (deleted.length === 0) throw notFound("Address not found.");
  if (deleted[0].isDefault) {
    const [next] = await db.select().from(addresses).where(eq(addresses.userId, userId)).limit(1);
    if (next) await db.update(addresses).set({ isDefault: true }).where(eq(addresses.id, next.id));
  }
  return listAddresses(userId);
}

/* ---------------- Measurements ---------------- */

const toMeasurement = (row: typeof measurementProfiles.$inferSelect): MeasurementProfile => ({
  id: row.id,
  name: row.name,
  bust: row.bust,
  waist: row.waist,
  shoulder: row.shoulder,
  armhole: row.armhole,
  sleeveLength: row.sleeveLength,
  blouseLength: row.blouseLength,
  updatedAt: row.updatedAt,
});

export async function listMeasurements(userId: string): Promise<MeasurementProfile[]> {
  const rows = await db
    .select()
    .from(measurementProfiles)
    .where(eq(measurementProfiles.userId, userId))
    .orderBy(desc(measurementProfiles.updatedAt));
  return rows.map(toMeasurement);
}

export async function saveMeasurement(
  userId: string,
  input: z.infer<typeof measurementProfileSchema>,
  id?: string
): Promise<MeasurementProfile[]> {
  if (id) {
    const updated = await db
      .update(measurementProfiles)
      .set({ ...input, updatedAt: now() })
      .where(and(eq(measurementProfiles.id, id), eq(measurementProfiles.userId, userId)))
      .returning({ id: measurementProfiles.id });
    if (updated.length === 0) throw notFound("Measurement profile not found.");
  } else {
    const existing = await listMeasurements(userId);
    if (existing.length >= 10) throw badRequest("You can save up to 10 measurement profiles.");
    await db.insert(measurementProfiles).values({ id: newId("msr"), userId, ...input, updatedAt: now() });
  }
  return listMeasurements(userId);
}

export async function deleteMeasurement(userId: string, id: string): Promise<MeasurementProfile[]> {
  const deleted = await db
    .delete(measurementProfiles)
    .where(and(eq(measurementProfiles.id, id), eq(measurementProfiles.userId, userId)))
    .returning({ id: measurementProfiles.id });
  if (deleted.length === 0) throw notFound("Measurement profile not found.");
  return listMeasurements(userId);
}

/* ---------------- Saved designs ---------------- */

export async function listDesigns(userId: string): Promise<SavedDesign[]> {
  const rows = await db
    .select()
    .from(savedDesigns)
    .where(eq(savedDesigns.userId, userId))
    .orderBy(desc(savedDesigns.createdAt));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    options: r.options,
    price: calculateBlousePrice(r.options),
    createdAt: r.createdAt,
  }));
}

export async function saveDesign(userId: string, input: z.infer<typeof savedDesignSchema>) {
  if (!isValidBlouseSelection(input.options)) throw badRequest("This design is incomplete.");
  const existing = await listDesigns(userId);
  if (existing.length >= 20) throw badRequest("You can save up to 20 designs.");
  await db
    .insert(savedDesigns)
    .values({ id: newId("dsn"), userId, name: input.name, options: input.options, createdAt: now() });
  return listDesigns(userId);
}

export async function deleteDesign(userId: string, id: string) {
  const deleted = await db
    .delete(savedDesigns)
    .where(and(eq(savedDesigns.id, id), eq(savedDesigns.userId, userId)))
    .returning({ id: savedDesigns.id });
  if (deleted.length === 0) throw notFound("Design not found.");
  return listDesigns(userId);
}

/* ---------------- Cart ---------------- */

export interface StoredCart {
  items: CartItem[];
  couponCode: string | null;
}

const MAX_QUANTITY = 20;

export async function getCart(userId: string): Promise<StoredCart> {
  const [row] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  return { items: row?.items ?? [], couponCode: row?.couponCode ?? null };
}

export async function saveCart(userId: string, cart: StoredCart): Promise<StoredCart> {
  const values = { items: cart.items, couponCode: cart.couponCode ?? null, updatedAt: now() };
  await db
    .insert(carts)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: carts.userId, set: values });
  return { items: values.items, couponCode: values.couponCode };
}

/**
 * Merges a guest cart into the account cart on sign-in. Lines with the same
 * key (product + size) keep the larger quantity, so signing in twice with the
 * same guest cart never double-counts; lines only in one cart are kept.
 */
export async function mergeCart(userId: string, guest: StoredCart): Promise<StoredCart> {
  const saved = await getCart(userId);
  const merged = new Map<string, CartItem>(saved.items.map((i) => [i.key, i]));
  for (const item of guest.items) {
    const existing = merged.get(item.key);
    merged.set(
      item.key,
      existing ? { ...existing, quantity: Math.min(MAX_QUANTITY, Math.max(existing.quantity, item.quantity)) } : item
    );
  }
  return saveCart(userId, {
    items: Array.from(merged.values()).slice(0, 50),
    couponCode: guest.couponCode ?? saved.couponCode,
  });
}

/* ---------------- Wishlist ---------------- */

export async function getWishlist(userId: string): Promise<string[]> {
  const rows = await db
    .select({ productId: wishlistItems.productId })
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId))
    .orderBy(wishlistItems.createdAt);
  return rows.map((r) => r.productId);
}

async function addToWishlist(userId: string, productIds: string[]) {
  if (productIds.length === 0) return;
  const valid = await db.select({ id: products.id }).from(products).where(inArray(products.id, productIds));
  if (valid.length === 0) return;
  await db
    .insert(wishlistItems)
    .values(valid.map((p) => ({ userId, productId: p.id, createdAt: now() })))
    .onConflictDoNothing();
}

export async function setWishlistItem(userId: string, productId: string, saved: boolean): Promise<string[]> {
  if (saved) await addToWishlist(userId, [productId]);
  else {
    await db
      .delete(wishlistItems)
      .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)));
  }
  return getWishlist(userId);
}

/** Union of the guest wishlist and the account wishlist — never duplicates. */
export async function mergeWishlist(userId: string, guestIds: string[]): Promise<string[]> {
  await addToWishlist(userId, Array.from(new Set(guestIds)));
  return getWishlist(userId);
}

export async function clearWishlist(userId: string) {
  await db.delete(wishlistItems).where(eq(wishlistItems.userId, userId));
}

/* ---------------- Admin: customers ---------------- */

export async function listCustomers() {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      loyaltyPoints: users.loyaltyPoints,
      createdAt: users.createdAt,
      orderCount: sql<number>`count(${orders.id})`,
      spent: sql<number>`coalesce(sum(case when ${orders.status} not in ('Cancelled','Refunded','Returned') then ${orders.total} else 0 end), 0)`,
      lastOrderAt: sql<string | null>`max(${orders.createdAt})`,
    })
    .from(users)
    .leftJoin(orders, eq(orders.userId, users.id))
    .where(eq(users.role, "customer"))
    .groupBy(users.id)
    .orderBy(desc(sql`sum(${orders.total})`), desc(users.createdAt));
  const cities = await db
    .select({ userId: addresses.userId, city: addresses.city })
    .from(addresses)
    .where(eq(addresses.isDefault, true));
  const cityByUser = new Map(cities.map((c) => [c.userId, c.city]));
  return rows.map((r) => ({ ...r, city: cityByUser.get(r.id) ?? "" }));
}
