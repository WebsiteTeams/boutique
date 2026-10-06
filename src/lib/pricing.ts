/**
 * Centralised pricing rules. Cart, checkout, order creation (server) and admin
 * all call these functions — never re-implement totals elsewhere.
 * All amounts are whole rupees.
 */

export const FREE_DELIVERY_THRESHOLD = 2000;
export const SHIPPING_FEE = 99;

export type ShippingMethodId = "standard" | "express" | "pickup";

export interface ShippingMethod {
  id: ShippingMethodId;
  label: string;
  eta: string;
  price: number;
  /** Becomes free once the order crosses FREE_DELIVERY_THRESHOLD. */
  freeAboveThreshold?: boolean;
}

export const SHIPPING_METHODS: ShippingMethod[] = [
  { id: "standard", label: "Standard", eta: "2–4 working days", price: SHIPPING_FEE, freeAboveThreshold: true },
  { id: "express", label: "Express", eta: "1–2 working days", price: 249 },
  { id: "pickup", label: "Boutique Pickup", eta: "Collect from our boutique once ready", price: 0 },
];

export const DEFAULT_SHIPPING_METHOD: ShippingMethodId = "standard";

export const getShippingMethod = (id: string | null | undefined): ShippingMethod =>
  SHIPPING_METHODS.find((m) => m.id === id) ?? SHIPPING_METHODS[0];

export type CouponType = "percent" | "flat";

/** The public shape of a coupon rule, as returned by the coupon validation API. */
export interface CouponRule {
  code: string;
  description?: string | null;
  type: CouponType;
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
}

export interface PricedLine {
  price: number;
  quantity: number;
}

export function calculateSubtotal(lines: PricedLine[]): number {
  return lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
}

/** Returns null when the coupon applies, otherwise a customer-facing reason. */
export function couponIneligibleReason(coupon: CouponRule, subtotal: number): string | null {
  if (subtotal < coupon.minSubtotal) {
    return `${coupon.code} needs a minimum order of ₹${coupon.minSubtotal.toLocaleString("en-IN")}.`;
  }
  return null;
}

export function calculateDiscount(coupon: CouponRule | null | undefined, subtotal: number): number {
  if (!coupon || subtotal <= 0) return 0;
  if (couponIneligibleReason(coupon, subtotal)) return 0;
  const raw = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  const capped = coupon.maxDiscount != null ? Math.min(raw, coupon.maxDiscount) : raw;
  return Math.max(0, Math.min(capped, subtotal));
}

/** Free-delivery eligibility is judged on the pre-discount subtotal. */
export function calculateShipping(methodId: string | null | undefined, subtotal: number): number {
  if (subtotal <= 0) return 0;
  const method = getShippingMethod(methodId);
  if (method.freeAboveThreshold && subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  return method.price;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  /** Prices are GST-inclusive, so no tax is added on top. */
  tax: number;
  total: number;
  couponCode: string | null;
}

export function calculateTotals(input: {
  lines: PricedLine[];
  coupon?: CouponRule | null;
  shippingMethod?: string | null;
}): OrderTotals {
  const subtotal = calculateSubtotal(input.lines);
  const discount = calculateDiscount(input.coupon, subtotal);
  const shipping = calculateShipping(input.shippingMethod ?? DEFAULT_SHIPPING_METHOD, subtotal);
  return {
    subtotal,
    discount,
    shipping,
    tax: 0,
    total: subtotal - discount + shipping,
    couponCode: discount > 0 && input.coupon ? input.coupon.code : null,
  };
}

export const amountToFreeDelivery = (subtotal: number) =>
  Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
