export type ProductCategory = "sarees" | "chudithars" | "blouses";

export type BadgeType = "new" | "bestseller" | "sale";

export interface Product {
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
  badge?: BadgeType;
  rating: number;
  reviewCount: number;
  sizes?: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  inStock: boolean;
  customizable?: boolean;
  care: string[];
  details: string[];
  tags: string[];
}

export interface CartItem {
  key: string;
  productId: string;
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
  neck: string;
  sleeve: string;
  back: string;
  embroidery: string;
  border: string;
  stitching: string;
  instructions?: string;
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

export interface Review {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  image?: string;
  product?: string;
}

export interface Order {
  id: string;
  placedOn: string;
  items: CartItem[];
  total: number;
  status: string;
  eta: string;
  paymentMethod: string;
  isCustomBlouse: boolean;
  timeline: { label: string; date: string; done: boolean }[];
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
