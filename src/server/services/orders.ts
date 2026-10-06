import { and, desc, eq, gte, inArray, sql, type SQL } from "drizzle-orm";
import type { z } from "zod";
import type { CustomizationSummary, Order, OrderItem, SessionUser } from "@/types";
import {
  buildCustomization,
  CUSTOM_BLOUSE_DELIVERY,
  CUSTOM_BLOUSE_IMAGE,
  CUSTOM_BLOUSE_NAME,
  CUSTOM_BLOUSE_PRODUCT_ID,
  CUSTOM_BLOUSE_SLUG,
  isValidBlouseSelection,
  validateMeasurements,
} from "@/lib/blouse";
import { calculateTotals, getShippingMethod, type CouponRule } from "@/lib/pricing";
import {
  orderStatusesFor,
  paymentMethodLabel,
  STOCK_RELEASING_STATUSES,
  TERMINAL_ORDER_STATUSES,
} from "@/lib/status";
import { formatINR } from "@/lib/utils";
import { db, type Database } from "@/server/db/client";
import { addresses, customBlouses, orderItems, orders, products, users } from "@/server/db/schema";
import { badRequest, conflict, forbidden, notFound } from "@/server/utils/errors";
import { newId, nextCustomBlouseId, nextOrderId, now } from "@/server/utils/ids";
import type { orderSchema, orderUpdateSchema } from "@/server/validators";
import { recordCouponUse, resolveCoupon } from "./coupons";
import { adjustPoints, getLoyaltySettings, pointsForAmount } from "./loyalty";
import { notifyAdmin, sendEmail } from "./notifications";
import {
  createGatewayOrder,
  isOnlinePaymentConfigured,
  PAYMENT_PROVIDER,
  publicPaymentKey,
  verifyPaymentSignature,
} from "./payments";

type OrderRow = typeof orders.$inferSelect;
type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type OrderInput = z.infer<typeof orderSchema>;

export interface PaymentSession {
  provider: string;
  keyId: string;
  gatewayOrderId: string;
  /** Amount in paise. */
  amount: number;
}

/* ---------------- Reading ---------------- */

async function hydrate(rows: OrderRow[], withCustomer = false): Promise<Order[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [items, blouses, customers] = await Promise.all([
    db.select().from(orderItems).where(inArray(orderItems.orderId, ids)),
    db.select().from(customBlouses).where(inArray(customBlouses.orderId, ids)),
    withCustomer
      ? db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(inArray(users.id, Array.from(new Set(rows.map((r) => r.userId)))))
      : Promise.resolve([]),
  ]);
  const blouseById = new Map(blouses.map((b) => [b.id, b]));
  const customerById = new Map(customers.map((c) => [c.id, c]));

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    status: row.status,
    isCustom: row.isCustom,
    items: items
      .filter((i) => i.orderId === row.id)
      .map((i): OrderItem => {
        const blouse = i.customBlouseId ? blouseById.get(i.customBlouseId) : undefined;
        return {
          id: i.id,
          productId: i.productId,
          slug: i.slug || undefined,
          name: i.name,
          image: i.image,
          price: i.price,
          mrp: i.mrp ?? undefined,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
          customBlouseId: i.customBlouseId ?? undefined,
          customization: blouse?.customization ?? null,
          customStatus: blouse?.status,
        };
      }),
    subtotal: row.subtotal,
    discount: row.discount,
    shipping: row.shipping,
    tax: row.tax,
    total: row.total,
    couponCode: row.couponCode,
    shippingMethod: row.shippingMethod,
    shippingAddress: row.shippingAddress,
    contact: row.contact,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    timeline: row.timeline,
    estimatedDelivery: row.estimatedDelivery,
    ...(withCustomer ? { customer: customerById.get(row.userId), internalNotes: row.internalNotes } : {}),
  }));
}

export async function listOrdersForUser(userId: string): Promise<Order[]> {
  const rows = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  return hydrate(rows);
}

/** Loads one order, enforcing that it belongs to the requesting customer. */
export async function getOrderForUser(orderId: string, user: SessionUser): Promise<Order> {
  const [row] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!row) throw notFound("Order not found.");
  if (row.userId !== user.id && user.role !== "admin") throw notFound("Order not found.");
  return (await hydrate([row]))[0];
}

export async function listAllOrders(filters: { status?: string; customOnly?: boolean; limit?: number } = {}) {
  const where: (SQL | undefined)[] = [];
  if (filters.status) where.push(eq(orders.status, filters.status));
  if (filters.customOnly) where.push(eq(orders.isCustom, true));
  const query = db.select().from(orders).where(and(...where)).orderBy(desc(orders.createdAt));
  const rows = filters.limit ? await query.limit(filters.limit) : await query;
  return hydrate(rows, true);
}

export async function getOrderForAdmin(orderId: string): Promise<Order> {
  const [row] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!row) throw notFound("Order not found.");
  return (await hydrate([row], true))[0];
}

/* ---------------- Creation ---------------- */

interface PreparedLine {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  mrp: number | null;
  size: string;
  color: string;
  quantity: number;
  customization: CustomizationSummary | null;
  reservesStock: boolean;
}

/** Re-prices every line from the database — client-supplied prices are never trusted. */
async function prepareLines(items: OrderInput["items"]): Promise<{ lines: PreparedLine[]; eta: string | null }> {
  const ids = Array.from(new Set(items.map((i) => i.productId)));
  const rows = await db.select().from(products).where(inArray(products.id, ids));
  const byId = new Map(rows.map((r) => [r.id, r]));
  const lines: PreparedLine[] = [];
  const required = new Map<string, number>();
  let eta: string | null = null;

  for (const item of items) {
    const product = byId.get(item.productId);

    if (item.customization) {
      if (item.productId !== CUSTOM_BLOUSE_PRODUCT_ID) throw badRequest("This item cannot be customised.");
      if (!isValidBlouseSelection(item.customization.options)) {
        throw badRequest("Your blouse design is incomplete. Please review it in the builder.");
      }
      if (Object.keys(validateMeasurements(item.customization.measurements)).length > 0) {
        throw badRequest("Your blouse measurements are incomplete. Please review them in the builder.");
      }
      const customization = buildCustomization(item.customization);
      lines.push({
        productId: CUSTOM_BLOUSE_PRODUCT_ID,
        slug: product?.slug ?? CUSTOM_BLOUSE_SLUG,
        name: CUSTOM_BLOUSE_NAME,
        image: customization.referenceImage ?? product?.images[0] ?? CUSTOM_BLOUSE_IMAGE,
        price: customization.basePrice,
        mrp: null,
        size: "Custom Fit",
        color: `${customization.neck} · ${customization.back}`,
        quantity: item.quantity,
        customization,
        reservesStock: false,
      });
      eta = CUSTOM_BLOUSE_DELIVERY;
      continue;
    }

    if (!product || !product.isActive) {
      throw conflict("An item in your bag is no longer available. Please remove it and try again.");
    }
    if (product.sizes.length > 0 && !product.sizes.includes(item.size)) {
      throw badRequest(`Please choose a size for ${product.name}.`);
    }
    const reservesStock = product.deliveryType === "ready";
    if (reservesStock) {
      const total = (required.get(product.id) ?? 0) + item.quantity;
      required.set(product.id, total);
      if (product.stock < total) {
        throw conflict(
          product.stock === 0
            ? `${product.name} is now out of stock.`
            : `Only ${product.stock} of ${product.name} left in stock.`
        );
      }
    } else if (!eta) {
      eta = product.estimatedDelivery;
    }
    lines.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] ?? "",
      price: product.price,
      mrp: product.mrp,
      size: product.sizes.length > 0 ? item.size : "Free Size",
      color: product.color,
      quantity: item.quantity,
      customization: null,
      reservesStock,
    });
  }
  return { lines, eta };
}

async function reserveStock(tx: Tx, lines: PreparedLine[]) {
  for (const line of lines) {
    if (line.reservesStock) {
      const updated = await tx
        .update(products)
        .set({
          stock: sql`${products.stock} - ${line.quantity}`,
          soldCount: sql`${products.soldCount} + ${line.quantity}`,
        })
        .where(and(eq(products.id, line.productId), gte(products.stock, line.quantity)))
        .returning({ id: products.id });
      if (updated.length === 0) throw conflict(`${line.name} just sold out. Please update your bag.`);
    } else {
      await tx
        .update(products)
        .set({ soldCount: sql`${products.soldCount} + ${line.quantity}` })
        .where(eq(products.id, line.productId));
    }
  }
}

async function releaseStock(tx: Tx, orderId: string) {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const item of items) {
    if (item.customBlouseId) continue;
    await tx
      .update(products)
      .set({
        stock: sql`case when ${products.deliveryType} = 'ready' then ${products.stock} + ${item.quantity} else ${products.stock} end`,
        soldCount: sql`max(0, ${products.soldCount} - ${item.quantity})`,
      })
      .where(eq(products.id, item.productId));
  }
}

export async function createOrder(
  user: SessionUser,
  input: OrderInput
): Promise<{ order: Order; payment: PaymentSession | null }> {
  const online = input.paymentMethod !== "cod";
  if (online && !isOnlinePaymentConfigured()) {
    throw badRequest("Online payment is not available right now. Please choose Cash on Delivery.");
  }

  const { lines, eta } = await prepareLines(input.items);
  const pricedLines = lines.map((l) => ({ price: l.price, quantity: l.quantity }));
  const preliminary = calculateTotals({ lines: pricedLines });
  let coupon: CouponRule | null = null;
  if (input.couponCode) coupon = await resolveCoupon(input.couponCode, preliminary.subtotal);
  const totals = calculateTotals({ lines: pricedLines, coupon, shippingMethod: input.shippingMethod });
  const isCustom = lines.some((l) => l.customization);
  const timestamp = now();

  const orderId = await db.transaction(async (tx) => {
    const id = await nextOrderId(tx);
    await tx.insert(orders).values({
      id,
      userId: user.id,
      status: "Placed",
      isCustom,
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total,
      couponCode: totals.couponCode,
      shippingMethod: input.shippingMethod,
      shippingAddress: input.address,
      contact: input.contact,
      paymentMethod: input.paymentMethod,
      paymentStatus: "Pending",
      paymentProvider: online ? PAYMENT_PROVIDER : null,
      estimatedDelivery: eta ?? getShippingMethod(input.shippingMethod).eta,
      timeline: [{ status: "Placed", at: timestamp }],
      internalNotes: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    for (const line of lines) {
      let customBlouseId: string | null = null;
      if (line.customization) {
        customBlouseId = await nextCustomBlouseId(tx);
        await tx.insert(customBlouses).values({
          id: customBlouseId,
          orderId: id,
          userId: user.id,
          customization: line.customization,
          price: line.price,
          status: "Pending Review",
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
      await tx.insert(orderItems).values({
        id: newId("oi"),
        orderId: id,
        productId: line.productId,
        slug: line.slug,
        name: line.name,
        image: line.image,
        price: line.price,
        mrp: line.mrp,
        size: line.size,
        color: line.color,
        quantity: line.quantity,
        customBlouseId,
      });
    }

    await reserveStock(tx, lines);
    if (totals.couponCode) await recordCouponUse(tx, totals.couponCode);

    if (input.saveAddress) {
      const existing = await tx.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, user.id));
      await tx.insert(addresses).values({
        id: newId("adr"),
        userId: user.id,
        label: "Home",
        fullName: input.address.fullName,
        phone: input.address.phone,
        line1: input.address.line1,
        line2: input.address.line2 ?? "",
        city: input.address.city,
        state: input.address.state,
        pincode: input.address.pincode,
        isDefault: existing.length === 0,
        createdAt: timestamp,
      });
    }
    return id;
  });

  let payment: PaymentSession | null = null;
  if (online) {
    try {
      payment = await startGatewayPayment(orderId, totals.total);
    } catch (error) {
      // The gateway could not be reached: cancel the order and free its stock.
      await applyOrderUpdate(orderId, { status: "Cancelled", note: "Payment could not be initiated." }, "system");
      throw error;
    }
  }

  const order = (await hydrate(await db.select().from(orders).where(eq(orders.id, orderId))))[0];
  await notifyAdmin({
    type: isCustom ? "custom-order" : "order",
    title: `New ${isCustom ? "custom blouse " : ""}order ${orderId}`,
    body: `${user.name} · ${formatINR(order.total)} · ${paymentMethodLabel(order.paymentMethod)}`,
    link: `/admin/orders/${orderId}`,
  });
  if (!online) await sendOrderEmail(order, "placed");
  return { order, payment };
}

async function startGatewayPayment(orderId: string, total: number): Promise<PaymentSession> {
  const gatewayOrderId = await createGatewayOrder({ amount: total, receipt: orderId });
  await db
    .update(orders)
    .set({ providerOrderId: gatewayOrderId, paymentStatus: "Pending", updatedAt: now() })
    .where(eq(orders.id, orderId));
  return {
    provider: PAYMENT_PROVIDER,
    keyId: publicPaymentKey()!,
    gatewayOrderId,
    amount: total * 100,
  };
}

async function sendOrderEmail(order: Order, kind: "placed" | "paid" | "status") {
  const subject =
    kind === "status"
      ? `Your UMA order ${order.id} is now ${order.status}`
      : `Your UMA order ${order.id} is confirmed`;
  const lines = order.items.map((i) => `• ${i.name} × ${i.quantity} — ${formatINR(i.price * i.quantity)}`);
  await sendEmail({
    to: order.contact.email,
    subject,
    text: [
      `Order ${order.id}`,
      `Status: ${order.status} · Payment: ${order.paymentStatus} (${paymentMethodLabel(order.paymentMethod)})`,
      "",
      ...lines,
      "",
      `Total: ${formatINR(order.total)}`,
      `Estimated delivery: ${order.estimatedDelivery}`,
    ].join("\n"),
  });
}

/* ---------------- Payment ---------------- */

async function markPaid(row: OrderRow, gatewayPaymentId: string) {
  if (row.paymentStatus === "Paid") return;
  const timestamp = now();
  const advance = row.status === "Placed";
  await db
    .update(orders)
    .set({
      paymentStatus: "Paid",
      providerPaymentId: gatewayPaymentId,
      status: advance ? "Confirmed" : row.status,
      timeline: advance ? [...row.timeline, { status: "Confirmed", at: timestamp }] : row.timeline,
      updatedAt: timestamp,
    })
    .where(eq(orders.id, row.id));
  const [order] = await hydrate(await db.select().from(orders).where(eq(orders.id, row.id)));
  await sendOrderEmail(order, "paid");
}

/** Confirms an online payment after verifying the gateway signature server-side. */
export async function confirmPayment(
  orderId: string,
  user: SessionUser,
  payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
): Promise<Order> {
  const [row] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!row || row.userId !== user.id) throw notFound("Order not found.");
  if (row.paymentStatus !== "Paid") {
    const valid =
      row.providerOrderId === payload.razorpay_order_id &&
      verifyPaymentSignature({
        gatewayOrderId: payload.razorpay_order_id,
        gatewayPaymentId: payload.razorpay_payment_id,
        signature: payload.razorpay_signature,
      });
    if (!valid) {
      await db.update(orders).set({ paymentStatus: "Failed", updatedAt: now() }).where(eq(orders.id, orderId));
      throw badRequest("We could not verify this payment. If money was debited it will be refunded automatically.");
    }
    await markPaid(row, payload.razorpay_payment_id);
  }
  return getOrderForUser(orderId, user);
}

export async function markPaymentFailed(orderId: string, user: SessionUser) {
  const [row] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!row || row.userId !== user.id) throw notFound("Order not found.");
  if (row.paymentStatus === "Pending" && row.paymentMethod !== "cod") {
    await db.update(orders).set({ paymentStatus: "Failed", updatedAt: now() }).where(eq(orders.id, orderId));
  }
}

export async function retryPayment(orderId: string, user: SessionUser): Promise<PaymentSession> {
  const [row] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!row || row.userId !== user.id) throw notFound("Order not found.");
  if (row.paymentMethod === "cod") throw badRequest("This order is Cash on Delivery.");
  if (row.paymentStatus === "Paid") throw badRequest("This order is already paid.");
  if (TERMINAL_ORDER_STATUSES.includes(row.status)) throw badRequest("This order is no longer active.");
  return startGatewayPayment(orderId, row.total);
}

/** Applies a verified gateway webhook event (source of truth if the browser never returns). */
export async function handleGatewayEvent(event: {
  event?: string;
  payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
}) {
  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id) return;
  const [row] = await db.select().from(orders).where(eq(orders.providerOrderId, payment.order_id)).limit(1);
  if (!row) return;
  if (event.event === "payment.captured" || event.event === "order.paid") {
    await markPaid(row, payment.id ?? "");
  } else if (event.event === "payment.failed" && row.paymentStatus === "Pending") {
    await db.update(orders).set({ paymentStatus: "Failed", updatedAt: now() }).where(eq(orders.id, row.id));
  }
}

/* ---------------- Status changes ---------------- */

const ORDER_TO_BLOUSE: Record<string, string> = {
  Tailoring: "Tailoring",
  "Quality Check": "Quality Check",
  Ready: "Ready",
  Shipped: "Shipped",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
};

export const BLOUSE_TO_ORDER: Record<string, string> = {
  "Pending Review": "Design Review",
  "Design Approved": "Design Review",
  Tailoring: "Tailoring",
  "Quality Check": "Quality Check",
  Ready: "Ready",
  Shipped: "Shipped",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
};

/**
 * The single place order state changes happen: validates the transition,
 * records the timeline, releases stock on cancellation/return, settles COD
 * on delivery and awards or reverses loyalty points.
 */
export async function applyOrderUpdate(
  orderId: string,
  change: z.infer<typeof orderUpdateSchema>,
  actor: string
): Promise<Order> {
  const config = await getLoyaltySettings();
  let statusChanged = false;

  await db.transaction(async (tx) => {
    const [row] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!row) throw notFound("Order not found.");
    const timestamp = now();
    const set: Partial<OrderRow> = { updatedAt: timestamp };

    if (change.paymentStatus) set.paymentStatus = change.paymentStatus;

    if (change.status && change.status !== row.status) {
      if (!orderStatusesFor(row.isCustom).includes(change.status)) {
        throw badRequest(`"${change.status}" is not a valid status for this order.`);
      }
      statusChanged = true;
      set.status = change.status;
      set.timeline = [...row.timeline, { status: change.status, at: timestamp }];

      if (STOCK_RELEASING_STATUSES.includes(change.status) && !row.stockReleased) {
        await releaseStock(tx, orderId);
        set.stockReleased = true;
      }
      if (change.status === "Delivered") {
        if (row.paymentMethod === "cod" && !change.paymentStatus) set.paymentStatus = "Paid";
        if (row.pointsAwarded === 0) {
          const points = pointsForAmount(row.total, config);
          await adjustPoints(tx, row.userId, points);
          set.pointsAwarded = points;
        }
      }
      if (TERMINAL_ORDER_STATUSES.includes(change.status) && row.pointsAwarded > 0) {
        await adjustPoints(tx, row.userId, -row.pointsAwarded);
        set.pointsAwarded = 0;
      }
      if (change.status === "Refunded" && !change.paymentStatus && row.paymentStatus === "Paid") {
        set.paymentStatus = "Refunded";
      }
      const blouseStatus = ORDER_TO_BLOUSE[change.status];
      if (row.isCustom && blouseStatus) {
        await tx
          .update(customBlouses)
          .set({ status: blouseStatus, updatedAt: timestamp })
          .where(eq(customBlouses.orderId, orderId));
      }
    }

    if (change.note) {
      set.internalNotes = [...row.internalNotes, { note: change.note, at: timestamp, by: actor }];
    }
    await tx.update(orders).set(set).where(eq(orders.id, orderId));
  });

  const order = await getOrderForAdmin(orderId);
  if (statusChanged) await sendOrderEmail(order, "status");
  return order;
}

/** Customers may cancel only before the boutique has started working on the order. */
export async function cancelOrderAsCustomer(orderId: string, user: SessionUser): Promise<Order> {
  const [row] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!row || row.userId !== user.id) throw notFound("Order not found.");
  if (row.status !== "Placed") {
    throw forbidden("This order is already being prepared. Please contact us to make changes.");
  }
  await applyOrderUpdate(orderId, { status: "Cancelled", note: "Cancelled by customer." }, user.name);
  await notifyAdmin({
    type: "order",
    title: `Order ${orderId} cancelled by customer`,
    link: `/admin/orders/${orderId}`,
  });
  return getOrderForUser(orderId, user);
}

/* ---------------- Custom blouses ---------------- */

export async function listCustomBlouses() {
  const rows = await db
    .select({ blouse: customBlouses, customerName: users.name, customerEmail: users.email })
    .from(customBlouses)
    .innerJoin(users, eq(users.id, customBlouses.userId))
    .orderBy(desc(customBlouses.createdAt));
  return rows.map((r) => ({ ...r.blouse, customerName: r.customerName, customerEmail: r.customerEmail }));
}

export async function updateCustomBlouseStatus(id: string, status: string, actor: string) {
  const [row] = await db.select().from(customBlouses).where(eq(customBlouses.id, id)).limit(1);
  if (!row) throw notFound("Custom order not found.");
  const orderStatus = BLOUSE_TO_ORDER[status];
  if (orderStatus) await applyOrderUpdate(row.orderId, { status: orderStatus }, actor);
  // Set last: the order update above normalises blouse statuses for the whole order.
  await db.update(customBlouses).set({ status, updatedAt: now() }).where(eq(customBlouses.id, id));
}
