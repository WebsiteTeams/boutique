export type ProductCategory = "sarees" | "chudithars" | "blouses";

export type BadgeType = "new" | "bestseller" | "sale";

export type DeliveryType = "ready" | "made_to_order";

export type StockStateLabel = "In Stock" | "Low Stock" | "Out of Stock" | "Made to Order";

/** Catalog product as served by the API / product service. */
export interface Product {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  subcategory: string;
  price: number;
  mrp?: number;
  description: string;
  shortDescription?: string;
  fabric: string;
  color: string;
  colors: string[];
  /** Primary occasion (first of `occasions`). */
  occasion: string;
  occasions: string[];
  pattern: string;
  images: string[];
  videos: string[];
  badge?: BadgeType;
  rating: number;
  reviewCount: number;
  sizes?: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  /** Purchasable right now (in stock, or made to order). */
  inStock: boolean;
  stock: number;
  stockState: StockStateLabel;
  sku?: string;
  customizable?: boolean;
  deliveryType: DeliveryType;
  estimatedDelivery: string;
  care: string[];
  details: string[];
  tags: string[];
  collections: string[];
}

/** Shape of the bundled catalog used only to seed the database. */
export interface SeedProduct {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  subcategory: string;
  price: number;
  mrp?: number;
  description: string;
  fabric: string;
  color: string;
  occasion: string;
  pattern: string;
  images: string[];
  sizes?: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  customizable?: boolean;
  care: string[];
  details: string[];
  tags: string[];
}

export interface CartItem {
  key: string;
  productId: string;
  slug?: string;
  name: string;
  image: string;
  price: number;
  mrp?: number;
  size: string;
  color: string;
  fabric?: string;
  quantity: number;
  customizable?: boolean;
  customization?: CustomizationSummary | null;
}

export interface CustomizationSummary {
  /** Display names of the chosen options. */
  neck: string;
  sleeve: string;
  back: string;
  embroidery: string;
  border: string;
  stitching: string;
  /** Option ids per customization group — the server re-prices from these. */
  options: Record<string, string>;
  /** Measurements in inches, keyed by measurement field id. */
  measurements: Record<string, string>;
  /** Name of the saved measurement profile used, if any. */
  measurementProfile?: string;
  instructions?: string;
  /** URL of the uploaded reference image. */
  referenceImage?: string;
  basePrice: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  image: string;
  cta: string;
  href: string;
}

export interface CollectionItem {
  id: string;
  name: string;
  tagline: string;
  image: string;
  description: string;
  accent?: string;
}

/** Editorial testimonial shown on the home page. */
export interface Review {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  image?: string;
  product?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  productName?: string;
  productSlug?: string;
  author: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  verifiedPurchase: boolean;
  status: string;
  createdAt: string;
}

export interface Address {
  fullName: string;
  phone: string;
  email: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface SavedAddress {
  id: string;
  label: "Home" | "Work" | "Other";
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface MeasurementProfile {
  id: string;
  name: string;
  bust: string;
  waist: string;
  shoulder: string;
  armhole: string;
  sleeveLength: string;
  blouseLength: string;
  updatedAt: string;
}

export interface SavedDesign {
  id: string;
  name: string;
  options: Record<string, string>;
  price: number;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  slug?: string;
  name: string;
  image: string;
  price: number;
  mrp?: number;
  size: string;
  color: string;
  quantity: number;
  customBlouseId?: string;
  customization?: CustomizationSummary | null;
  customStatus?: string;
}

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  isCustom: boolean;
  items: OrderItem[];
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
  timeline: { status: string; at: string }[];
  estimatedDelivery: string;
  customer?: { id: string; name: string; email: string };
  internalNotes?: { note: string; at: string; by: string }[];
}

export interface Appointment {
  id: string;
  purpose: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin";
  createdAt: string;
}

export interface LoyaltySummary {
  points: number;
  tier: string;
  nextTier: { name: string; pointsNeeded: number } | null;
  pointsPerHundred: number;
  tiers: { name: string; minPoints: number; perk: string }[];
}

export interface CustomizationOption {
  id: string;
  name: string;
  image: string;
  price: number;
}

export interface CustomizationGroup {
  id: string;
  label: string;
  options: CustomizationOption[];
}

export interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  variant?: "success" | "error" | "info";
}
