/**
 * Seeds the database with the starter catalog, collections, the UMA10 coupon,
 * default UMA Rewards rules and (optionally) the first admin account.
 *
 * Idempotent: existing documents are never overwritten, so it is safe to re-run.
 * Run with: npm run db:seed
 *
 * To create the admin account set ADMIN_EMAIL and ADMIN_PASSWORD (and
 * optionally ADMIN_NAME) in .env.local before running.
 */
import { collections as seedCollections, seedProducts } from "../src/lib/data";
import { CUSTOM_BLOUSE_DELIVERY } from "../src/lib/blouse";
import { hashPassword } from "../src/server/auth/password";
import { connectDb, disconnectDb } from "../src/server/db/client";
import { Collections, Coupons, Products, Settings, Users } from "../src/server/db/models";
import { DEFAULT_LOYALTY_SETTINGS } from "../src/server/services/loyalty";
import { newId, now } from "../src/server/utils/ids";

const OCCASION_MAP: Record<string, string[]> = {
  Wedding: ["Wedding Guest", "Reception"],
  Bridal: ["Bridal", "Engagement"],
  Festive: ["Festive"],
  Everyday: ["Casual"],
  Reception: ["Reception", "Engagement"],
  Party: ["Party"],
  Work: ["Office"],
  Any: ["Bridal", "Wedding Guest", "Festive", "Party"],
};

const COLLECTION_MAP: Record<string, string[]> = {
  Wedding: ["wedding"],
  Bridal: ["bridal", "wedding"],
  Festive: ["festive"],
  Everyday: ["everyday"],
  Reception: ["wedding"],
  Party: ["festive"],
  Work: ["everyday"],
  Any: ["bridal"],
};

const CATEGORY_SKU: Record<string, string> = { sarees: "SAR", chudithars: "CHU", blouses: "BLO" };
const OPENING_STOCK = [6, 4, 8, 12, 5, 7, 3, 9, 15, 10, 6, 20, 5, 8, 2, 0];
const FEATURED = new Set(["pr-01", "pr-05", "pr-11", "pr-13"]);

async function main() {
  await connectDb();
  const timestamp = now();
  /** Inserts documents that do not exist yet; returns how many were new. */
  const insertMissing = async (model: typeof Products, docs: { _id: string }[]) => {
    if (docs.length === 0) return 0;
    const res = await model.bulkWrite(
      docs.map((doc) => ({ updateOne: { filter: { _id: doc._id }, update: { $setOnInsert: doc }, upsert: true } }))
    );
    return res.upsertedCount;
  };

  await insertMissing(
    Collections,
    seedCollections.map((c, i) => ({
        _id: c.id,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        image: c.image,
        accent: c.accent ?? null,
        sortOrder: i,
        isActive: true,
      }))
  );

  const productValues = seedProducts.map((p, i) => {
    const madeToOrder = p.category === "blouses";
    return {
      _id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      shortDescription: p.description.split(". ")[0].replace(/\.$/, "") + ".",
      price: p.price,
      mrp: p.mrp ?? null,
      images: p.images,
      videos: [],
      category: p.category,
      subcategory: p.subcategory,
      fabric: p.fabric,
      color: p.color,
      colors: [p.color],
      sizes: p.sizes ?? [],
      occasions: OCCASION_MAP[p.occasion] ?? [p.occasion],
      pattern: p.pattern,
      tags: p.tags,
      collections: COLLECTION_MAP[p.occasion] ?? [],
      care: p.care,
      details: p.details,
      stock: madeToOrder ? 0 : OPENING_STOCK[i] ?? 5,
      sku: `UMA-${CATEGORY_SKU[p.category]}-${String(i + 1).padStart(3, "0")}`,
      isNewArrival: Boolean(p.isNew),
      isBestseller: Boolean(p.isBestSeller),
      isFeatured: FEATURED.has(p.id),
      isCustomizable: Boolean(p.customizable),
      isActive: true,
      rating: 0,
      reviewCount: 0,
      soldCount: 0,
      deliveryType: madeToOrder ? ("made_to_order" as const) : ("ready" as const),
      estimatedDelivery: madeToOrder ? CUSTOM_BLOUSE_DELIVERY : "Ships in 2–4 working days",
      // Stagger creation times so "Newest" has a stable, meaningful order.
      createdAt: new Date(Date.now() - (seedProducts.length - i) * 86_400_000).toISOString(),
      updatedAt: timestamp,
    };
  });
  const insertedProducts = await insertMissing(Products, productValues);

  await insertMissing(Coupons, [
    {
      _id: "UMA10",
      description: "10% off your order",
      type: "percent",
      value: 10,
      minSubtotal: 0,
      maxDiscount: null,
      usageLimit: null,
      usedCount: 0,
      expiresAt: null,
      isActive: true,
      createdAt: timestamp,
    } as { _id: string },
  ]);

  await insertMissing(Settings, [{ _id: "loyalty", value: DEFAULT_LOYALTY_SETTINGS, updatedAt: timestamp } as { _id: string }]);

  console.log(`Seeded ${insertedProducts} new products (${seedProducts.length} in the starter catalog).`);

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.log("No admin created: set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local and re-run to create one.");
    return;
  }
  if (adminPassword.length < 10) {
    throw new Error("ADMIN_PASSWORD must be at least 10 characters.");
  }
  const existing = await Users.findOne({ email: adminEmail }).lean();
  if (existing) {
    if (existing.role !== "admin") {
      await Users.updateOne({ _id: existing._id }, { $set: { role: "admin" } });
      console.log(`Promoted ${adminEmail} to admin.`);
    } else {
      console.log(`Admin ${adminEmail} already exists.`);
    }
    return;
  }
  await Users.create({
    _id: newId("usr"),
    name: process.env.ADMIN_NAME?.trim() || "UMA Admin",
    email: adminEmail,
    passwordHash: await hashPassword(adminPassword),
    phone: "",
    role: "admin",
    loyaltyPoints: 0,
    createdAt: timestamp,
  });
  console.log(`Created admin account ${adminEmail}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(disconnectDb);
