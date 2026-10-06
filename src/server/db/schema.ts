import { index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { Address, CartItem, CustomizationSummary } from "@/types";

const json = <T>(name: string) => text(name, { mode: "json" }).$type<T>();
const bool = (name: string) => integer(name, { mode: "boolean" });
/** ISO-8601 timestamp. */
const timestamp = (name: string) => text(name);

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["customer", "admin"] }).notNull().default("customer"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  createdAt: timestamp("created_at").notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    /** SHA-256 of the session token — the raw token only lives in the cookie. */
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)]
);

export const collections = sqliteTable("collections", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull().default(""),
  description: text("description").notNull().default(""),
  image: text("image").notNull().default(""),
  accent: text("accent"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: bool("is_active").notNull().default(true),
});

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    shortDescription: text("short_description").notNull().default(""),
    price: integer("price").notNull(),
    mrp: integer("mrp"),
    images: json<string[]>("images").notNull(),
    videos: json<string[]>("videos").notNull(),
    category: text("category", { enum: ["sarees", "chudithars", "blouses"] }).notNull(),
    subcategory: text("subcategory").notNull().default(""),
    fabric: text("fabric").notNull().default(""),
    color: text("color").notNull().default(""),
    colors: json<string[]>("colors").notNull(),
    sizes: json<string[]>("sizes").notNull(),
    occasions: json<string[]>("occasions").notNull(),
    pattern: text("pattern").notNull().default(""),
    tags: json<string[]>("tags").notNull(),
    collections: json<string[]>("collections").notNull(),
    care: json<string[]>("care").notNull(),
    details: json<string[]>("details").notNull(),
    stock: integer("stock").notNull().default(0),
    sku: text("sku").notNull().default(""),
    isNew: bool("is_new").notNull().default(false),
    isBestseller: bool("is_bestseller").notNull().default(false),
    isFeatured: bool("is_featured").notNull().default(false),
    isCustomizable: bool("is_customizable").notNull().default(false),
    isActive: bool("is_active").notNull().default(true),
    rating: real("rating").notNull().default(0),
    reviewCount: integer("review_count").notNull().default(0),
    soldCount: integer("sold_count").notNull().default(0),
    deliveryType: text("delivery_type", { enum: ["ready", "made_to_order"] }).notNull().default("ready"),
    estimatedDelivery: text("estimated_delivery").notNull().default(""),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (t) => [index("products_category_idx").on(t.category)]
);

export const carts = sqliteTable("carts", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  items: json<CartItem[]>("items").notNull(),
  couponCode: text("coupon_code"),
  updatedAt: timestamp("updated_at").notNull(),
});

export const wishlistItems = sqliteTable(
  "wishlist_items",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })]
);

export const addresses = sqliteTable(
  "addresses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    label: text("label", { enum: ["Home", "Work", "Other"] }).notNull().default("Home"),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2").notNull().default(""),
    city: text("city").notNull(),
    state: text("state").notNull(),
    pincode: text("pincode").notNull(),
    isDefault: bool("is_default").notNull().default(false),
    createdAt: timestamp("created_at").notNull(),
  },
  (t) => [index("addresses_user_idx").on(t.userId)]
);

export const measurementProfiles = sqliteTable(
  "measurement_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    bust: text("bust").notNull().default(""),
    waist: text("waist").notNull().default(""),
    shoulder: text("shoulder").notNull().default(""),
    armhole: text("armhole").notNull().default(""),
    sleeveLength: text("sleeve_length").notNull().default(""),
    blouseLength: text("blouse_length").notNull().default(""),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (t) => [index("measurements_user_idx").on(t.userId)]
);

export const savedDesigns = sqliteTable(
  "saved_designs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    options: json<Record<string, string>>("options").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (t) => [index("designs_user_idx").on(t.userId)]
);

export const coupons = sqliteTable("coupons", {
  code: text("code").primaryKey(),
  description: text("description").notNull().default(""),
  type: text("type", { enum: ["percent", "flat"] }).notNull(),
  value: integer("value").notNull(),
  minSubtotal: integer("min_subtotal").notNull().default(0),
  maxDiscount: integer("max_discount"),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  isActive: bool("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull(),
});

export const orders = sqliteTable(
  "orders",
  {
    /** Human-facing id, e.g. UMA-2026-000001. */
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    status: text("status").notNull(),
    isCustom: bool("is_custom").notNull().default(false),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull().default(0),
    shipping: integer("shipping").notNull().default(0),
    tax: integer("tax").notNull().default(0),
    total: integer("total").notNull(),
    couponCode: text("coupon_code"),
    shippingMethod: text("shipping_method").notNull(),
    shippingAddress: json<Address>("shipping_address").notNull(),
    contact: json<{ email: string; phone: string }>("contact").notNull(),
    paymentMethod: text("payment_method").notNull(),
    paymentStatus: text("payment_status").notNull(),
    paymentProvider: text("payment_provider"),
    providerOrderId: text("provider_order_id"),
    providerPaymentId: text("provider_payment_id"),
    estimatedDelivery: text("estimated_delivery").notNull().default(""),
    timeline: json<{ status: string; at: string }[]>("timeline").notNull(),
    internalNotes: json<{ note: string; at: string; by: string }[]>("internal_notes").notNull(),
    stockReleased: bool("stock_released").notNull().default(false),
    pointsAwarded: integer("points_awarded").notNull().default(0),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (t) => [
    index("orders_user_idx").on(t.userId),
    index("orders_created_idx").on(t.createdAt),
    index("orders_provider_idx").on(t.providerOrderId),
  ]
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull(),
    slug: text("slug").notNull().default(""),
    name: text("name").notNull(),
    image: text("image").notNull().default(""),
    price: integer("price").notNull(),
    mrp: integer("mrp"),
    size: text("size").notNull().default(""),
    color: text("color").notNull().default(""),
    quantity: integer("quantity").notNull(),
    customBlouseId: text("custom_blouse_id"),
  },
  (t) => [index("order_items_order_idx").on(t.orderId), index("order_items_product_idx").on(t.productId)]
);

export const customBlouses = sqliteTable(
  "custom_blouses",
  {
    /** e.g. CB-2026-0001 */
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id),
    customization: json<CustomizationSummary>("customization").notNull(),
    price: integer("price").notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (t) => [index("custom_blouses_order_idx").on(t.orderId)]
);

export const appointments = sqliteTable(
  "appointments",
  {
    /** e.g. APT-2026-0001 */
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    purpose: text("purpose").notNull(),
    date: text("date").notNull(),
    time: text("time").notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    notes: text("notes").notNull().default(""),
    status: text("status").notNull(),
    adminNotes: text("admin_notes").notNull().default(""),
    createdAt: timestamp("created_at").notNull(),
  },
  (t) => [index("appointments_user_idx").on(t.userId), index("appointments_date_idx").on(t.date)]
);

export const reviews = sqliteTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    orderId: text("order_id"),
    rating: integer("rating").notNull(),
    title: text("title").notNull().default(""),
    comment: text("comment").notNull().default(""),
    images: json<string[]>("images").notNull(),
    verifiedPurchase: bool("verified_purchase").notNull().default(false),
    status: text("status").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (t) => [index("reviews_product_idx").on(t.productId), index("reviews_user_idx").on(t.userId)]
);

export const contactMessages = sqliteTable("contact_messages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  topic: text("topic").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  email: text("email").primaryKey(),
  status: text("status", { enum: ["subscribed", "unsubscribed"] }).notNull(),
  token: text("token").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

/** Admin-facing activity feed (new orders, appointments, messages…). */
export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    link: text("link").notNull().default(""),
    isRead: bool("is_read").notNull().default(false),
    createdAt: timestamp("created_at").notNull(),
  },
  (t) => [index("notifications_created_idx").on(t.createdAt)]
);

/** Admin-editable configuration (e.g. loyalty rules), stored as JSON by key. */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: json<unknown>("value").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

/** Monotonic sequences for human-facing ids. */
export const counters = sqliteTable("counters", {
  name: text("name").primaryKey(),
  value: integer("value").notNull(),
});
