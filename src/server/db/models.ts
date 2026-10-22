/**
 * MongoDB collections (Mongoose models).
 *
 * Conventions:
 *  - The readable string id (usr_…, UMA-2026-000001, CB-2026-0001) is the document `_id`.
 *    `plain()` turns a lean document back into the `{ id, …fields }` row shape services use.
 *  - Timestamps are ISO-8601 strings, so string comparison orders them correctly.
 *  - Money is whole rupees stored as integers.
 *  - Orders embed their line items, so placing an order is a single document write.
 */
import mongoose, { Schema, type Model } from "mongoose";
import type { Address, CartItem, CustomizationSummary } from "@/types";
import { connectDb } from "./client";

mongoose.set("strictQuery", true);

// Every operation connects first (a cached promise after the first call), so a server
// that started while MongoDB was down recovers on the next request instead of hanging.
const QUERY_OPS = /^(countDocuments|deleteMany|deleteOne|distinct|estimatedDocumentCount|find|findOne|findOneAndDelete|findOneAndUpdate|replaceOne|updateMany|updateOne)$/;
const globalPlugins = globalThis as unknown as { __umaMongoPlugin?: boolean };
if (!globalPlugins.__umaMongoPlugin) {
  globalPlugins.__umaMongoPlugin = true;
  mongoose.plugin((schema) => {
    const ensure = async () => {
      await connectDb();
    };
    schema.pre(QUERY_OPS, ensure);
    schema.pre("save", ensure);
    schema.pre("aggregate", ensure);
    schema.pre("insertMany", ensure);
    schema.pre("bulkWrite", ensure);
  });
}

const str = (required = true, def?: string) => ({ type: String, required, ...(def !== undefined ? { default: def } : {}) });
const int = (def?: number) => ({ type: Number, required: def === undefined, ...(def !== undefined ? { default: def } : {}) });
const bool = (def: boolean) => ({ type: Boolean, required: true, default: def });
const strings = { type: [String], default: [] };
const mixed = { type: Schema.Types.Mixed };
const opts = { versionKey: false as const, minimize: false };

/**
 * Reuses compiled models across hot reloads.
 *
 * Models are deliberately typed loosely: Mongoose's fully generic query types made the
 * project take minutes and gigabytes to type-check. Services convert results with
 * `plain<SomeRow>()`, and the row interfaces below are the typed contract.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseModel = Model<any>;
function model<T>(name: string, schema: Schema): LooseModel {
  void (null as unknown as T); // T documents the stored shape for readers.
  return (mongoose.models[name] as LooseModel) ?? mongoose.model(name, schema);
}

/** Lean document → `{ id, ...fields }` without Mongo internals. */
export function plain<T>(doc: unknown): T;
export function plain<T>(doc: unknown | null): T | null;
export function plain<T>(doc: unknown): T | null {
  if (!doc) return null;
  const { _id, __v: _v, ...rest } = doc as Record<string, unknown>;
  void _v;
  return ("id" in rest ? rest : { id: _id, ...rest }) as T;
}
export const plainAll = <T>(docs: unknown[]): T[] => docs.map((d) => plain<T>(d));

/* ---------------- Identity ---------------- */

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: "customer" | "admin";
  loyaltyPoints: number;
  createdAt: string;
}
export const Users = model<UserRow & { _id: string }>(
  "User",
  new Schema(
    {
      _id: String,
      name: str(),
      email: { type: String, required: true, unique: true },
      phone: str(false, ""),
      passwordHash: str(),
      role: { type: String, enum: ["customer", "admin"], required: true, default: "customer" },
      loyaltyPoints: int(0),
      createdAt: str(),
    },
    opts
  )
);

export interface SessionRow {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}
export const Sessions = model<SessionRow & { _id: string }>(
  "Session",
  new Schema({ _id: String, userId: { ...str(), index: true }, expiresAt: str(), createdAt: str() }, opts)
);

export interface PasswordResetTokenRow {
  id: string;
  userId: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}
export const PasswordResetTokens = model<PasswordResetTokenRow & { _id: string }>(
  "PasswordResetToken",
  new Schema(
    { _id: String, userId: { ...str(), index: true }, expiresAt: str(), usedAt: { type: String, default: null }, createdAt: str() },
    opts
  )
);

/* ---------------- Catalog ---------------- */

export interface CollectionRow {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  accent: string | null;
  sortOrder: number;
  isActive: boolean;
}
export const Collections = model<CollectionRow & { _id: string }>(
  "Collection",
  new Schema(
    {
      _id: String,
      name: str(),
      tagline: str(false, ""),
      description: str(false, ""),
      image: str(false, ""),
      accent: { type: String, default: null },
      sortOrder: int(0),
      isActive: bool(true),
    },
    opts
  )
);

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  mrp: number | null;
  images: string[];
  videos: string[];
  category: "sarees" | "chudithars" | "blouses";
  subcategory: string;
  fabric: string;
  color: string;
  colors: string[];
  sizes: string[];
  occasions: string[];
  pattern: string;
  tags: string[];
  collections: string[];
  care: string[];
  details: string[];
  stock: number;
  sku: string;
  isNew: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
  isCustomizable: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  soldCount: number;
  deliveryType: "ready" | "made_to_order";
  estimatedDelivery: string;
  createdAt: string;
  updatedAt: string;
}
/** Product documents store `isNew` as `isNewArrival`; these convert at the service boundary. */
export function productFromDoc(doc: unknown): ProductRow;
export function productFromDoc(doc: unknown | null): ProductRow | null;
export function productFromDoc(doc: unknown): ProductRow | null {
  const row = plain<Record<string, unknown>>(doc);
  if (!row) return null;
  const { isNewArrival, ...rest } = row;
  return { ...rest, isNew: Boolean(isNewArrival) } as unknown as ProductRow;
}
export function productToDoc<T extends { isNew?: boolean }>(row: T): Omit<T, "isNew"> & { isNewArrival?: boolean } {
  const { isNew, ...rest } = row;
  return isNew === undefined ? rest : { ...rest, isNewArrival: isNew };
}

export const Products = model<ProductRow & { _id: string }>(
  "Product",
  new Schema(
    {
      _id: String,
      slug: { type: String, required: true, unique: true },
      name: str(),
      description: str(false, ""),
      shortDescription: str(false, ""),
      price: int(),
      mrp: { type: Number, default: null },
      images: strings,
      videos: strings,
      category: { type: String, enum: ["sarees", "chudithars", "blouses"], required: true, index: true },
      subcategory: str(false, ""),
      fabric: str(false, ""),
      color: str(false, ""),
      colors: strings,
      sizes: strings,
      occasions: strings,
      pattern: str(false, ""),
      tags: strings,
      collections: strings,
      care: strings,
      details: strings,
      stock: int(0),
      sku: str(false, ""),
      // "isNew" is reserved by Mongoose (it decides insert vs update), so it is stored under this name.
      isNewArrival: bool(false),
      isBestseller: bool(false),
      isFeatured: bool(false),
      isCustomizable: bool(false),
      isActive: bool(true),
      rating: { type: Number, required: true, default: 0 },
      reviewCount: int(0),
      soldCount: int(0),
      deliveryType: { type: String, enum: ["ready", "made_to_order"], required: true, default: "ready" },
      estimatedDelivery: str(false, ""),
      createdAt: { ...str(), index: true },
      updatedAt: str(),
    },
    opts
  )
);

/* ---------------- Shopper data ---------------- */

export interface CartRow {
  userId: string;
  items: CartItem[];
  couponCode: string | null;
  updatedAt: string;
}
/** One document per user; `_id` is the user id. */
export const Carts = model<{ _id: string; items: CartItem[]; couponCode: string | null; updatedAt: string }>(
  "Cart",
  new Schema({ _id: String, items: { type: [mixed], default: [] }, couponCode: { type: String, default: null }, updatedAt: str() }, opts)
);

export interface WishlistRow {
  userId: string;
  productId: string;
  createdAt: string;
}
export const WishlistItems = model<WishlistRow>(
  "WishlistItem",
  new Schema({ userId: str(), productId: { ...str(), index: true }, createdAt: str() }, opts).index(
    { userId: 1, productId: 1 },
    { unique: true }
  )
);

export interface AddressRow {
  id: string;
  userId: string;
  label: "Home" | "Work" | "Other";
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: string;
}
export const Addresses = model<AddressRow & { _id: string }>(
  "Address",
  new Schema(
    {
      _id: String,
      userId: { ...str(), index: true },
      label: { type: String, enum: ["Home", "Work", "Other"], required: true, default: "Home" },
      fullName: str(),
      phone: str(),
      line1: str(),
      line2: str(false, ""),
      city: str(),
      state: str(),
      pincode: str(),
      isDefault: bool(false),
      createdAt: str(),
    },
    opts
  )
);

export interface MeasurementProfileRow {
  id: string;
  userId: string;
  name: string;
  bust: string;
  waist: string;
  shoulder: string;
  armhole: string;
  sleeveLength: string;
  blouseLength: string;
  updatedAt: string;
}
export const MeasurementProfiles = model<MeasurementProfileRow & { _id: string }>(
  "MeasurementProfile",
  new Schema(
    {
      _id: String,
      userId: { ...str(), index: true },
      name: str(),
      bust: str(false, ""),
      waist: str(false, ""),
      shoulder: str(false, ""),
      armhole: str(false, ""),
      sleeveLength: str(false, ""),
      blouseLength: str(false, ""),
      updatedAt: str(),
    },
    opts
  )
);

export interface SavedDesignRow {
  id: string;
  userId: string;
  name: string;
  options: Record<string, string>;
  createdAt: string;
}
export const SavedDesigns = model<SavedDesignRow & { _id: string }>(
  "SavedDesign",
  new Schema({ _id: String, userId: { ...str(), index: true }, name: str(), options: { ...mixed, default: {} }, createdAt: str() }, opts)
);

/* ---------------- Commerce ---------------- */

export interface CouponRow {
  code: string;
  description: string;
  type: "percent" | "flat";
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}
/** `_id` is the coupon code. */
export const Coupons = model<Omit<CouponRow, "code"> & { _id: string }>(
  "Coupon",
  new Schema(
    {
      _id: String,
      description: str(false, ""),
      type: { type: String, enum: ["percent", "flat"], required: true },
      value: int(),
      minSubtotal: int(0),
      maxDiscount: { type: Number, default: null },
      usageLimit: { type: Number, default: null },
      usedCount: int(0),
      expiresAt: { type: String, default: null },
      isActive: bool(true),
      createdAt: str(),
    },
    opts
  )
);

export interface OrderItemRow {
  id: string;
  orderId: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  mrp: number | null;
  size: string;
  color: string;
  quantity: number;
  customBlouseId: string | null;
}

export interface OrderRow {
  id: string;
  userId: string;
  status: string;
  isCustom: boolean;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode: string | null;
  shippingMethod: string;
  shippingAddress: Address;
  contact: { email: string; phone: string };
  paymentMethod: string;
  paymentStatus: string;
  paymentProvider: string | null;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  estimatedDelivery: string;
  timeline: { status: string; at: string }[];
  internalNotes: { note: string; at: string; by: string }[];
  stockReleased: boolean;
  pointsAwarded: number;
  items: OrderItemRow[];
  createdAt: string;
  updatedAt: string;
}
const orderItemSchema = new Schema(
  {
    id: str(),
    orderId: str(),
    productId: { ...str(), index: true },
    slug: str(false, ""),
    name: str(),
    image: str(false, ""),
    price: int(),
    mrp: { type: Number, default: null },
    size: str(false, ""),
    color: str(false, ""),
    quantity: int(),
    customBlouseId: { type: String, default: null },
  },
  { _id: false, versionKey: false }
);
export const Orders = model<Omit<OrderRow, "id"> & { _id: string }>(
  "Order",
  new Schema(
    {
      _id: String,
      userId: { ...str(), index: true },
      status: str(),
      isCustom: bool(false),
      subtotal: int(),
      discount: int(0),
      shipping: int(0),
      tax: int(0),
      total: int(),
      couponCode: { type: String, default: null },
      shippingMethod: str(),
      shippingAddress: { ...mixed, required: true },
      contact: { ...mixed, required: true },
      paymentMethod: str(),
      paymentStatus: str(),
      paymentProvider: { type: String, default: null },
      providerOrderId: { type: String, default: null, index: true },
      providerPaymentId: { type: String, default: null },
      estimatedDelivery: str(false, ""),
      timeline: { type: [mixed], default: [] },
      internalNotes: { type: [mixed], default: [] },
      stockReleased: bool(false),
      pointsAwarded: int(0),
      items: { type: [orderItemSchema], default: [] },
      createdAt: { ...str(), index: true },
      updatedAt: str(),
    },
    opts
  )
);

/** Order rows carry `items`; this strips the embedded list for code that wants the order alone. */
export const orderOf = (doc: unknown): OrderRow => plain<OrderRow>(doc);

export interface CustomBlouseRow {
  id: string;
  orderId: string;
  userId: string;
  customization: CustomizationSummary;
  price: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}
export const CustomBlouses = model<CustomBlouseRow & { _id: string }>(
  "CustomBlouse",
  new Schema(
    {
      _id: String,
      orderId: { ...str(), index: true },
      userId: str(),
      customization: { ...mixed, required: true },
      price: int(),
      status: str(),
      createdAt: { ...str(), index: true },
      updatedAt: str(),
    },
    opts
  )
);

export interface BlouseDesignRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  image: string;
  gallery: string[];
  price: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
export const BlouseDesigns = model<BlouseDesignRow & { _id: string }>(
  "BlouseDesign",
  new Schema(
    {
      _id: String,
      slug: { type: String, required: true, unique: true },
      name: str(),
      description: str(false, ""),
      category: str(false, ""),
      image: str(),
      gallery: strings,
      price: int(0),
      isActive: bool(true),
      sortOrder: int(0),
      createdAt: str(),
      updatedAt: str(),
    },
    opts
  ).index({ isActive: 1, sortOrder: 1 })
);

export interface BlouseOptionRow {
  groupId: string;
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
}
/** `_id` is `${groupId}/${id}`; the option id itself is kept in `id`. */
export const BlouseOptions = model<BlouseOptionRow & { _id: string }>(
  "BlouseOption",
  new Schema(
    { _id: String, groupId: str(), id: str(), name: str(), price: int(0), isActive: bool(true), sortOrder: int(0), updatedAt: str() },
    { ...opts, id: false }
  ).index({ groupId: 1, sortOrder: 1 })
);

/* ---------------- Boutique ---------------- */

export interface ReviewRow {
  id: string;
  productId: string;
  userId: string;
  orderId: string | null;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  verifiedPurchase: boolean;
  status: string;
  createdAt: string;
}
export const Reviews = model<ReviewRow & { _id: string }>(
  "Review",
  new Schema(
    {
      _id: String,
      productId: { ...str(), index: true },
      userId: { ...str(), index: true },
      orderId: { type: String, default: null },
      rating: int(),
      title: str(false, ""),
      comment: str(false, ""),
      images: strings,
      verifiedPurchase: bool(false),
      status: str(),
      createdAt: str(),
    },
    opts
  )
);

export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  status: string;
  createdAt: string;
}
export const ContactMessages = model<ContactMessageRow & { _id: string }>(
  "ContactMessage",
  new Schema(
    { _id: String, name: str(), email: str(), phone: str(false, ""), topic: str(), message: str(), status: str(), createdAt: { ...str(), index: true } },
    opts
  )
);

export interface NewsletterSubscriberRow {
  email: string;
  status: "subscribed" | "unsubscribed";
  token: string;
  subscribedAt: string;
  unsubscribedAt: string | null;
}
/** `_id` is the email address. */
export const NewsletterSubscribers = model<Omit<NewsletterSubscriberRow, "email"> & { _id: string }>(
  "NewsletterSubscriber",
  new Schema(
    {
      _id: String,
      status: { type: String, enum: ["subscribed", "unsubscribed"], required: true },
      token: { type: String, required: true, unique: true },
      subscribedAt: str(),
      unsubscribedAt: { type: String, default: null },
    },
    opts
  )
);

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}
export const Notifications = model<NotificationRow & { _id: string }>(
  "Notification",
  new Schema(
    { _id: String, type: str(), title: str(), body: str(false, ""), link: str(false, ""), isRead: bool(false), createdAt: { ...str(), index: true } },
    opts
  )
);

/* ---------------- System ---------------- */

/** Admin-editable configuration stored as JSON; `_id` is the setting key. */
export const Settings = model<{ _id: string; value: unknown; updatedAt: string }>(
  "Setting",
  new Schema({ _id: String, value: { ...mixed, required: true }, updatedAt: str() }, opts)
);

/** Monotonic sequences for human-facing ids; `_id` is the sequence name. */
export const Counters = model<{ _id: string; value: number }>(
  "Counter",
  new Schema({ _id: String, value: int() }, opts)
);
