import type { z } from "zod";
import type { CartItem, MeasurementProfile, SavedAddress, SavedDesign, SessionUser } from "@/types";
import { SAVED_DESIGN_KEY } from "@/lib/blouse";
import { priceBlouse, type BlouseCatalog } from "@/lib/blouse-pricing";
import { getBlouseCatalog } from "@/server/services/blouse-catalog";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { toSessionUser } from "@/server/auth/session";
import {
  Addresses,
  Carts,
  MeasurementProfiles,
  Orders,
  plain,
  plainAll,
  Products,
  SavedDesigns,
  Users,
  WishlistItems,
  type AddressRow,
  type MeasurementProfileRow,
  type SavedDesignRow,
  type UserRow,
} from "@/server/db/models";
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
  if (await Users.exists({ email: input.email })) {
    throw conflict("An account with this email already exists. Please sign in instead.");
  }
  try {
    const doc = await Users.create({
      _id: newId("usr"),
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      role: "customer",
      loyaltyPoints: 0,
      createdAt: now(),
    });
    return toSessionUser(plain<UserRow>(doc.toObject()));
  } catch (error) {
    // The unique email index catches two sign-ups racing each other.
    if ((error as { code?: number }).code === 11000) {
      throw conflict("An account with this email already exists. Please sign in instead.");
    }
    throw error;
  }
}

// Used to keep login timing similar whether or not the email exists.
const DUMMY_HASH = "scrypt$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(86);

export async function authenticate(email: string, password: string): Promise<SessionUser> {
  const row = plain<UserRow>(await Users.findOne({ email }).lean());
  const ok = await verifyPassword(password, row?.passwordHash ?? DUMMY_HASH);
  if (!row || !ok) throw unauthorized("Incorrect email or password.");
  return toSessionUser(row);
}

export async function updateProfile(userId: string, input: z.infer<typeof profileSchema>) {
  const doc = await Users.findOneAndUpdate(
    { _id: userId },
    { $set: { name: input.name, phone: input.phone } },
    { new: true }
  ).lean();
  if (!doc) throw notFound("Account not found.");
  return toSessionUser(plain<UserRow>(doc));
}

export async function changePassword(userId: string, current: string, next: string) {
  const row = await Users.findById(userId).lean();
  if (!row || !(await verifyPassword(current, row.passwordHash))) {
    throw badRequest("Please check the highlighted fields.", { currentPassword: "Current password is incorrect" });
  }
  await Users.updateOne({ _id: userId }, { $set: { passwordHash: await hashPassword(next) } });
}

/* ---------------- Addresses ---------------- */

const toAddress = (row: AddressRow): SavedAddress => ({
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
  const rows = await Addresses.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
  return plainAll<AddressRow>(rows).map(toAddress);
}

type AddressInput = z.infer<typeof addressSchema>;

export async function saveAddress(userId: string, input: AddressInput, id?: string): Promise<SavedAddress[]> {
  const existing = await Addresses.find({ userId }, { _id: 1 }).lean();
  if (id && !existing.some((a) => a._id === id)) throw notFound("Address not found.");
  if (!id && existing.length >= 10) throw badRequest("You can save up to 10 addresses.");
  const makeDefault = input.isDefault || existing.length === 0;
  const values = { ...input, isDefault: makeDefault };
  const targetId = id ?? newId("adr");
  if (id) {
    await Addresses.updateOne({ _id: id, userId }, { $set: values });
  } else {
    await Addresses.create({ _id: targetId, userId, ...values, createdAt: now() });
  }
  // Exactly one default: clear the flag elsewhere only after this address is saved.
  if (makeDefault) await Addresses.updateMany({ userId, _id: { $ne: targetId } }, { $set: { isDefault: false } });
  return listAddresses(userId);
}

export async function deleteAddress(userId: string, id: string): Promise<SavedAddress[]> {
  const deleted = await Addresses.findOneAndDelete({ _id: id, userId }).lean();
  if (!deleted) throw notFound("Address not found.");
  if (deleted.isDefault) {
    const next = await Addresses.findOne({ userId }).sort({ createdAt: -1 }).lean();
    if (next) await Addresses.updateOne({ _id: next._id }, { $set: { isDefault: true } });
  }
  return listAddresses(userId);
}

/* ---------------- Measurements ---------------- */

const toMeasurement = (row: MeasurementProfileRow): MeasurementProfile => ({
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
  const rows = await MeasurementProfiles.find({ userId }).sort({ updatedAt: -1 }).lean();
  return plainAll<MeasurementProfileRow>(rows).map(toMeasurement);
}

export async function saveMeasurement(
  userId: string,
  input: z.infer<typeof measurementProfileSchema>,
  id?: string
): Promise<MeasurementProfile[]> {
  if (id) {
    const res = await MeasurementProfiles.updateOne({ _id: id, userId }, { $set: { ...input, updatedAt: now() } });
    if (res.matchedCount === 0) throw notFound("Measurement profile not found.");
  } else {
    if ((await MeasurementProfiles.countDocuments({ userId })) >= 10) {
      throw badRequest("You can save up to 10 measurement profiles.");
    }
    await MeasurementProfiles.create({ _id: newId("msr"), userId, ...input, updatedAt: now() });
  }
  return listMeasurements(userId);
}

export async function deleteMeasurement(userId: string, id: string): Promise<MeasurementProfile[]> {
  const res = await MeasurementProfiles.deleteOne({ _id: id, userId });
  if (res.deletedCount === 0) throw notFound("Measurement profile not found.");
  return listMeasurements(userId);
}

/* ---------------- Saved designs ---------------- */

export async function listDesigns(userId: string): Promise<SavedDesign[]> {
  const rows = plainAll<SavedDesignRow>(await SavedDesigns.find({ userId }).sort({ createdAt: -1 }).lean());
  const catalog = await getBlouseCatalog();
  return rows.map((r) => {
    const priced = priceBlouse(catalog, { designId: r.options[SAVED_DESIGN_KEY], options: r.options });
    return {
      id: r.id,
      name: r.name,
      options: r.options,
      price: priced.ok ? priced.breakdown.total : null,
      rows: savedDesignRows(catalog, r.options),
      createdAt: r.createdAt,
    };
  });
}

/** Names come from the live catalog; anything no longer offered is labelled as such. */
function savedDesignRows(catalog: BlouseCatalog, options: Record<string, string>) {
  const design = catalog.designs.find((d) => d.id === options[SAVED_DESIGN_KEY]);
  const rows = design ? [{ label: "Design", value: design.isActive ? design.name : `${design.name} (unavailable)` }] : [];
  for (const g of catalog.groups) {
    const o = g.options.find((x) => x.id === options[g.id]);
    rows.push({ label: g.label, value: !o ? "—" : o.isActive ? o.name : `${o.name} (unavailable)` });
  }
  return rows;
}

export async function saveDesign(userId: string, input: z.infer<typeof savedDesignSchema>) {
  const priced = priceBlouse(await getBlouseCatalog(), { designId: input.options[SAVED_DESIGN_KEY], options: input.options });
  if (!priced.ok) throw badRequest(priced.reason);
  if ((await SavedDesigns.countDocuments({ userId })) >= 20) throw badRequest("You can save up to 20 designs.");
  await SavedDesigns.create({ _id: newId("dsn"), userId, name: input.name, options: input.options, createdAt: now() });
  return listDesigns(userId);
}

export async function deleteDesign(userId: string, id: string) {
  const res = await SavedDesigns.deleteOne({ _id: id, userId });
  if (res.deletedCount === 0) throw notFound("Design not found.");
  return listDesigns(userId);
}

/* ---------------- Cart ---------------- */

export interface StoredCart {
  items: CartItem[];
  couponCode: string | null;
}

const MAX_QUANTITY = 20;

export async function getCart(userId: string): Promise<StoredCart> {
  const row = await Carts.findById(userId).lean();
  return { items: row?.items ?? [], couponCode: row?.couponCode ?? null };
}

export async function saveCart(userId: string, cart: StoredCart): Promise<StoredCart> {
  const values = { items: cart.items, couponCode: cart.couponCode ?? null, updatedAt: now() };
  await Carts.updateOne({ _id: userId }, { $set: values }, { upsert: true });
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
  const rows = await WishlistItems.find({ userId }, { productId: 1 }).sort({ createdAt: 1 }).lean();
  return rows.map((r) => r.productId);
}

async function addToWishlist(userId: string, productIds: string[]) {
  if (productIds.length === 0) return;
  const valid = await Products.find({ _id: { $in: productIds } }, { _id: 1 }).lean();
  if (valid.length === 0) return;
  const at = now();
  // Upserts make repeated saves (and guest merges) idempotent.
  await WishlistItems.bulkWrite(
    valid.map((p) => ({
      updateOne: {
        filter: { userId, productId: p._id },
        update: { $setOnInsert: { userId, productId: p._id, createdAt: at } },
        upsert: true,
      },
    }))
  );
}

export async function setWishlistItem(userId: string, productId: string, saved: boolean): Promise<string[]> {
  if (saved) await addToWishlist(userId, [productId]);
  else {
    await WishlistItems.deleteOne({ userId, productId });
  }
  return getWishlist(userId);
}

/** Union of the guest wishlist and the account wishlist — never duplicates. */
export async function mergeWishlist(userId: string, guestIds: string[]): Promise<string[]> {
  await addToWishlist(userId, Array.from(new Set(guestIds)));
  return getWishlist(userId);
}

export async function clearWishlist(userId: string) {
  await WishlistItems.deleteMany({ userId });
}

/* ---------------- Admin: customers ---------------- */

export async function listCustomers() {
  const [customers, stats, cities] = await Promise.all([
    Users.find({ role: "customer" }, { passwordHash: 0 }).lean(),
    Orders.aggregate<{ _id: string; orderCount: number; spent: number; total: number; lastOrderAt: string }>([
      {
        $group: {
          _id: "$userId",
          orderCount: { $sum: 1 },
          spent: { $sum: { $cond: [{ $in: ["$status", ["Cancelled", "Refunded", "Returned"]] }, 0, "$total"] } },
          total: { $sum: "$total" },
          lastOrderAt: { $max: "$createdAt" },
        },
      },
    ]),
    Addresses.find({ isDefault: true }, { userId: 1, city: 1 }).lean(),
  ]);
  const statsByUser = new Map(stats.map((st) => [st._id, st]));
  const cityByUser = new Map(cities.map((c) => [c.userId, c.city]));
  // Biggest spenders first, then newest customers.
  return customers
    .map((u) => ({ u, st: statsByUser.get(u._id) }))
    .sort((a, b) => (b.st?.total ?? 0) - (a.st?.total ?? 0) || b.u.createdAt.localeCompare(a.u.createdAt))
    .map(({ u, st }) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      loyaltyPoints: u.loyaltyPoints,
      createdAt: u.createdAt,
      orderCount: st?.orderCount ?? 0,
      spent: st?.spent ?? 0,
      lastOrderAt: st?.lastOrderAt ?? null,
      city: cityByUser.get(u._id) ?? "",
    }));
}
