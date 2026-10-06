import { z } from "zod";
import { SHIPPING_METHODS } from "@/lib/pricing";
import {
  ALL_ORDER_STATUSES,
  APPOINTMENT_PURPOSES,
  APPOINTMENT_SLOTS,
  APPOINTMENT_STATUSES,
  CONTACT_TOPICS,
  CUSTOM_BLOUSE_STATUSES,
  MESSAGE_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  REVIEW_STATUSES,
} from "@/lib/status";

const trimmed = (max: number, min = 0) => z.string().trim().min(min, min ? "Required" : undefined).max(max);

export const emailField = z.string().trim().toLowerCase().max(254).email("Enter a valid email");
export const phoneField = z
  .string()
  .trim()
  .transform((v) => v.replace(/^\+?91[\s-]?/, "").replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"));
const optionalPhone = z.union([z.literal(""), phoneField]).optional().default("");
const passwordField = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128)
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Include at least one letter and one number");

/** Only files we host (local uploads or our Cloudinary account) or bundled images. */
const hostedImage = z
  .string()
  .max(500)
  .refine(
    (v) => v.startsWith("/api/files/") || v.startsWith("/images/") || v.startsWith("https://res.cloudinary.com/"),
    "Unsupported image location"
  );

/* ---------------- Auth & account ---------------- */

export const registerSchema = z.object({
  name: trimmed(80, 2),
  email: emailField,
  phone: optionalPhone,
  password: passwordField,
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Required").max(128),
});

export const profileSchema = z.object({
  name: trimmed(80, 2),
  phone: optionalPhone,
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Required").max(128),
  newPassword: passwordField,
});

export const addressSchema = z.object({
  label: z.enum(["Home", "Work", "Other"]).default("Home"),
  fullName: trimmed(80, 2),
  phone: phoneField,
  line1: trimmed(160, 3),
  line2: trimmed(160).optional().default(""),
  city: trimmed(60, 2),
  state: trimmed(60, 2),
  pincode: z.string().trim().regex(/^\d{6}$/, "6-digit pincode"),
  isDefault: z.boolean().optional().default(false),
});

const measurement = z
  .string()
  .trim()
  .max(6)
  .refine((v) => v === "" || (Number(v) > 0 && Number(v) <= 80), "Enter a valid measurement in inches");

const measurementValues = {
  bust: measurement,
  waist: measurement,
  shoulder: measurement,
  armhole: measurement.optional().default(""),
  sleeveLength: measurement.optional().default(""),
  blouseLength: measurement.optional().default(""),
};

export const measurementProfileSchema = z.object({
  name: trimmed(40, 1),
  ...measurementValues,
  bust: measurement.refine((v) => v !== "", "Required"),
  waist: measurement.refine((v) => v !== "", "Required"),
  shoulder: measurement.refine((v) => v !== "", "Required"),
});

const blouseOptions = z.record(z.string().max(20), z.string().max(30));

export const savedDesignSchema = z.object({
  name: trimmed(60, 1),
  options: blouseOptions,
});

/* ---------------- Cart, wishlist, orders ---------------- */

export const customizationSchema = z.object({
  options: blouseOptions,
  measurements: z.object(measurementValues),
  measurementProfile: trimmed(40).optional(),
  instructions: trimmed(1000).optional(),
  referenceImage: hostedImage.optional(),
});

const storedCustomization = customizationSchema.extend({
  neck: trimmed(40),
  sleeve: trimmed(40),
  back: trimmed(40),
  embroidery: trimmed(40),
  border: trimmed(40),
  stitching: trimmed(40),
  basePrice: z.number().int().nonnegative(),
});

export const cartItemSchema = z.object({
  key: trimmed(120, 1),
  productId: trimmed(60, 1),
  slug: trimmed(160).optional(),
  name: trimmed(160, 1),
  image: z.string().max(500),
  price: z.number().int().nonnegative(),
  mrp: z.number().int().nonnegative().optional(),
  size: trimmed(40),
  color: trimmed(80),
  fabric: trimmed(80).optional(),
  quantity: z.number().int().min(1).max(20),
  customizable: z.boolean().optional(),
  customization: storedCustomization.nullable().optional(),
});

export const cartSchema = z.object({
  items: z.array(cartItemSchema).max(50),
  couponCode: z.string().trim().toUpperCase().max(30).nullable().optional(),
});

export const wishlistSchema = z.object({
  productIds: z.array(trimmed(60, 1)).max(200),
});

export const wishlistToggleSchema = z.object({
  productId: trimmed(60, 1),
  saved: z.boolean(),
});

export const couponValidateSchema = z.object({
  code: z.string().trim().toUpperCase().min(1, "Enter a coupon code").max(30),
  subtotal: z.number().int().nonnegative(),
});

const shippingIds = SHIPPING_METHODS.map((m) => m.id) as [string, ...string[]];

export const orderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: trimmed(60, 1),
        size: trimmed(40).optional().default(""),
        quantity: z.number().int().min(1).max(20),
        customization: customizationSchema.nullable().optional(),
      })
    )
    .min(1, "Your bag is empty")
    .max(50),
  couponCode: z.string().trim().toUpperCase().max(30).nullable().optional(),
  shippingMethod: z.enum(shippingIds),
  contact: z.object({ email: emailField, phone: phoneField }),
  address: addressSchema.omit({ label: true, isDefault: true }).extend({ email: emailField }),
  saveAddress: z.boolean().optional().default(false),
  paymentMethod: z.enum(PAYMENT_METHODS),
});

export const paymentVerifySchema = z.object({
  razorpay_order_id: trimmed(80, 1),
  razorpay_payment_id: trimmed(80, 1),
  razorpay_signature: trimmed(200, 1),
});

/* ---------------- Boutique services ---------------- */

export const appointmentSchema = z.object({
  purpose: z.enum(APPOINTMENT_PURPOSES),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date")
    .refine((v) => {
      const today = new Date().toISOString().slice(0, 10);
      const limit = new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10);
      return v >= today && v <= limit;
    }, "Choose a date within the next 90 days"),
  time: z.enum(APPOINTMENT_SLOTS),
  name: trimmed(80, 2),
  phone: phoneField,
  email: emailField,
  notes: trimmed(1000).optional().default(""),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: trimmed(100).optional().default(""),
  comment: trimmed(2000, 10),
  images: z.array(hostedImage).max(3).optional().default([]),
});

export const contactSchema = z.object({
  name: trimmed(80, 2),
  email: emailField,
  phone: optionalPhone,
  topic: z.enum(CONTACT_TOPICS),
  message: trimmed(3000, 10),
});

export const newsletterSchema = z.object({ email: emailField });

/* ---------------- Admin ---------------- */

const stringList = (maxItems: number, maxLen = 200) =>
  z.array(z.string().trim().min(1).max(maxLen)).max(maxItems).default([]);

export const productSchema = z
  .object({
    name: trimmed(160, 2),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only")
      .max(160)
      .optional()
      .or(z.literal("")),
    description: trimmed(5000, 10),
    shortDescription: trimmed(300).optional().default(""),
    price: z.number().int().positive("Enter a price"),
    mrp: z.number().int().positive().nullable().optional(),
    images: z.array(hostedImage).min(1, "Add at least one image").max(12),
    videos: stringList(4, 500),
    category: z.enum(["sarees", "chudithars", "blouses"]),
    subcategory: trimmed(80).default(""),
    fabric: trimmed(120).default(""),
    color: trimmed(80).default(""),
    colors: stringList(12, 40),
    sizes: stringList(12, 20),
    occasions: stringList(8, 40),
    pattern: trimmed(60).default(""),
    tags: stringList(20, 40),
    collections: stringList(10, 60),
    care: stringList(10),
    details: stringList(12),
    stock: z.number().int().min(0).max(100000),
    sku: trimmed(60).default(""),
    isNew: z.boolean().default(false),
    isBestseller: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    isCustomizable: z.boolean().default(false),
    isActive: z.boolean().default(true),
    deliveryType: z.enum(["ready", "made_to_order"]).default("ready"),
    estimatedDelivery: trimmed(120, 2),
  })
  .refine((p) => !p.mrp || p.mrp >= p.price, { path: ["mrp"], message: "MRP cannot be below the price" });

export const stockSchema = z.object({
  /** Absolute stock level, or a relative adjustment (e.g. -1 for an in-store sale). */
  stock: z.number().int().min(0).max(100000).optional(),
  adjust: z.number().int().min(-1000).max(1000).optional(),
});

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{3,30}$/, "3–30 letters or numbers"),
    description: trimmed(160).default(""),
    type: z.enum(["percent", "flat"]),
    value: z.number().int().positive(),
    minSubtotal: z.number().int().min(0).default(0),
    maxDiscount: z.number().int().positive().nullable().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),
    expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    isActive: z.boolean().default(true),
  })
  .refine((c) => c.type !== "percent" || c.value <= 90, {
    path: ["value"],
    message: "Percentage discounts cannot exceed 90%",
  });

export const couponUpdateSchema = z.object({ isActive: z.boolean() });

export const orderUpdateSchema = z.object({
  status: z.enum(ALL_ORDER_STATUSES as [string, ...string[]]).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  note: trimmed(1000).optional(),
});

export const customBlouseUpdateSchema = z.object({ status: z.enum(CUSTOM_BLOUSE_STATUSES) });

export const appointmentUpdateSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.enum(APPOINTMENT_SLOTS).optional(),
  adminNotes: trimmed(1000).optional(),
});

export const reviewUpdateSchema = z.object({ status: z.enum(REVIEW_STATUSES) });
export const messageUpdateSchema = z.object({ status: z.enum(MESSAGE_STATUSES) });

export const loyaltySettingsSchema = z.object({
  enabled: z.boolean(),
  pointsPerHundred: z.number().int().min(0).max(100),
  tiers: z
    .array(
      z.object({
        name: trimmed(30, 1),
        minPoints: z.number().int().min(0),
        perk: trimmed(160).default(""),
      })
    )
    .min(1)
    .max(6),
});
