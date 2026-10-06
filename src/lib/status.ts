/**
 * Centralised status vocabularies for orders, payments, custom blouses,
 * appointments, stock, reviews and contact messages. Shared by the API,
 * the storefront and the admin panel.
 */

export const ORDER_STATUSES = [
  "Placed",
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
  "Refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Happy-path progression shown on the customer timeline for ready-made orders. */
export const ORDER_FLOW: OrderStatus[] = ["Placed", "Confirmed", "Processing", "Packed", "Shipped", "Delivered"];

/** Orders containing a custom blouse follow the atelier flow instead. */
export const CUSTOM_ORDER_STATUSES = [
  "Placed",
  "Design Review",
  "Tailoring",
  "Quality Check",
  "Ready",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
  "Refunded",
] as const;
export type CustomOrderStatus = (typeof CUSTOM_ORDER_STATUSES)[number];

export const CUSTOM_ORDER_FLOW: CustomOrderStatus[] = [
  "Placed",
  "Design Review",
  "Tailoring",
  "Quality Check",
  "Ready",
  "Shipped",
  "Delivered",
];

export const ALL_ORDER_STATUSES = Array.from(new Set<string>([...ORDER_STATUSES, ...CUSTOM_ORDER_STATUSES]));

export const TERMINAL_ORDER_STATUSES = ["Cancelled", "Returned", "Refunded"];
/** Statuses that release reserved stock back to inventory. */
export const STOCK_RELEASING_STATUSES = ["Cancelled", "Returned"];

export const orderStatusesFor = (isCustom: boolean): readonly string[] =>
  isCustom ? CUSTOM_ORDER_STATUSES : ORDER_STATUSES;

export const orderFlowFor = (isCustom: boolean): readonly string[] =>
  isCustom ? CUSTOM_ORDER_FLOW : ORDER_FLOW;

export const isPendingOrder = (status: string) =>
  !TERMINAL_ORDER_STATUSES.includes(status) && status !== "Delivered";

export const CUSTOM_BLOUSE_STATUSES = [
  "Pending Review",
  "Design Approved",
  "Tailoring",
  "Quality Check",
  "Ready",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;
export type CustomBlouseStatus = (typeof CUSTOM_BLOUSE_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "Pending",
  "Processing",
  "Paid",
  "Failed",
  "Refunded",
  "Partially Refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["upi", "card", "netbanking", "wallet", "cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Net Banking",
  wallet: "Wallet",
  cod: "Cash on Delivery",
};

export const paymentMethodLabel = (method: string) =>
  PAYMENT_METHOD_LABELS[method as PaymentMethod] ?? method;

export const APPOINTMENT_STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled", "Rescheduled"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_PURPOSES = [
  "Bridal",
  "Wedding Guest",
  "Custom Blouse",
  "Designer Consultation",
  "Saree Selection",
] as const;

export const APPOINTMENT_SLOTS = [
  "10:30",
  "11:30",
  "12:30",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
] as const;

export const REVIEW_STATUSES = ["Pending", "Approved", "Rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const MESSAGE_STATUSES = ["New", "Read", "Replied", "Closed"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const CONTACT_TOPICS = [
  "General",
  "Order Support",
  "Bespoke Blouse",
  "Bulk / Trousseau",
  "Returns & Exchange",
] as const;

/* ---------------- Stock ---------------- */

export const LOW_STOCK_THRESHOLD = 3;
export type StockState = "In Stock" | "Low Stock" | "Out of Stock" | "Made to Order";

export function stockState(product: { stock: number; deliveryType: string }): StockState {
  if (product.deliveryType === "made_to_order") return "Made to Order";
  if (product.stock <= 0) return "Out of Stock";
  if (product.stock <= LOW_STOCK_THRESHOLD) return "Low Stock";
  return "In Stock";
}

/* ---------------- Presentation ---------------- */

const TONE = {
  neutral: "bg-cream text-charcoal",
  gold: "bg-gold/15 text-gold-deep",
  progress: "bg-sky-100 text-sky-800",
  craft: "bg-violet-100 text-violet-800",
  success: "bg-emerald-100 text-emerald-800",
  danger: "bg-red-100 text-red-700",
  warn: "bg-amber-100 text-amber-800",
} as const;

const STATUS_TONES: Record<string, string> = {
  Placed: TONE.neutral,
  Confirmed: TONE.neutral,
  Processing: TONE.progress,
  Packed: TONE.progress,
  Shipped: TONE.gold,
  Delivered: TONE.success,
  Cancelled: TONE.danger,
  Returned: TONE.warn,
  Refunded: TONE.warn,
  "Design Review": TONE.craft,
  "Pending Review": TONE.warn,
  "Design Approved": TONE.craft,
  Tailoring: TONE.craft,
  "Quality Check": TONE.progress,
  Ready: TONE.gold,
  Pending: TONE.warn,
  Paid: TONE.success,
  Failed: TONE.danger,
  "Partially Refunded": TONE.warn,
  Completed: TONE.success,
  Rescheduled: TONE.progress,
  Approved: TONE.success,
  Rejected: TONE.danger,
  New: TONE.gold,
  Read: TONE.neutral,
  Replied: TONE.success,
  Closed: TONE.neutral,
  "In Stock": TONE.success,
  "Low Stock": TONE.warn,
  "Out of Stock": TONE.danger,
  "Made to Order": TONE.craft,
  Active: TONE.success,
  Inactive: TONE.neutral,
};

export const statusTone = (status: string) => STATUS_TONES[status] ?? "bg-cream text-mist";

export interface TimelineEntry {
  status: string;
  at: string;
}

/**
 * Builds the customer-facing timeline from the recorded status history.
 * Steps that have not happened yet are shown as upcoming.
 */
export function buildTimeline(
  isCustom: boolean,
  currentStatus: string,
  history: TimelineEntry[],
  formatDate: (iso: string) => string
): { label: string; date: string; done: boolean }[] {
  const reached = new Map(history.map((h) => [h.status, h.at]));
  const flow = orderFlowFor(isCustom);
  const currentIndex = flow.indexOf(currentStatus);
  const steps = flow.map((label, i) => {
    const at = reached.get(label);
    const done = Boolean(at) || (currentIndex >= 0 && i <= currentIndex);
    return { label, date: at ? formatDate(at) : done ? "Completed" : "Upcoming", done };
  });
  if (TERMINAL_ORDER_STATUSES.includes(currentStatus)) {
    const at = reached.get(currentStatus);
    const completed = steps.filter((s) => s.done);
    return [...completed, { label: currentStatus, date: at ? formatDate(at) : "", done: true }];
  }
  return steps;
}
