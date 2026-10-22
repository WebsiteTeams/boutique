import type { z } from "zod";
import type { CustomizationSummary, Order, OrderItem, SessionUser } from "@/types";
import {
  buildCustomization,
  CUSTOM_BLOUSE_DELIVERY,
  CUSTOM_BLOUSE_IMAGE,
  CUSTOM_BLOUSE_NAME,
  CUSTOM_BLOUSE_PRODUCT_ID,
  CUSTOM_BLOUSE_SLUG,
  validateMeasurements,
} from "@/lib/blouse";
import { priceBlouse, type BlouseCatalog } from "@/lib/blouse-pricing";
import { calculateTotals, getShippingMethod, type CouponRule } from "@/lib/pricing";
import { getBlouseCatalog } from "./blouse-catalog";
import {
  orderStatusesFor,
  paymentMethodLabel,
  STOCK_RELEASING_STATUSES,
  TERMINAL_ORDER_STATUSES,
} from "@/lib/status";
import { formatINR } from "@/lib/utils";
import {
  Addresses,
  CustomBlouses,
  Orders,
  plain,
  plainAll,
  productFromDoc,
  Products,
  Users,
  type CustomBlouseRow,
  type OrderItemRow,
  type OrderRow,
} from "@/server/db/models";
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
  const [blouses, customers] = await Promise.all([
    CustomBlouses.find({ orderId: { $in: ids } }).lean(),
    withCustomer
      ? Users.find({ _id: { $in: Array.from(new Set(rows.map((r) => r.userId))) } }, { name: 1, email: 1 }).lean()
      : Promise.resolve([]),
  ]);
  const blouseById = new Map(plainAll<CustomBlouseRow>(blouses).map((b) => [b.id, b]));
  const customerById = new Map(customers.map((c) => [c._id, { id: c._id, name: c.name, email: c.email }]));

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    status: row.status,
    isCustom: row.isCustom,
    items: row.items.map((i): OrderItem => {
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

const findOrder = async (orderId: string) => plain<OrderRow>(await Orders.findById(orderId).lean());

export async function listOrdersForUser(userId: string): Promise<Order[]> {
  return hydrate(plainAll<OrderRow>(await Orders.find({ userId }).sort({ createdAt: -1 }).lean()));
}

/** Loads one order, enforcing that it belongs to the requesting customer. */
export async function getOrderForUser(orderId: string, user: SessionUser): Promise<Order> {
  const row = await findOrder(orderId);
  if (!row) throw notFound("Order not found.");
  if (row.userId !== user.id && user.role !== "admin") throw notFound("Order not found.");
  return (await hydrate([row]))[0];
}

export async function listAllOrders(filters: { status?: string; customOnly?: boolean; limit?: number } = {}) {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.customOnly) where.isCustom = true;
  const query = Orders.find(where).sort({ createdAt: -1 });
  if (filters.limit) query.limit(filters.limit);
  return hydrate(plainAll<OrderRow>(await query.lean()), true);
}

export async function getOrderForAdmin(orderId: string): Promise<Order> {
  const row = await findOrder(orderId);
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
  const rows = (await Products.find({ _id: { $in: ids } }).lean()).map((d: unknown) => productFromDoc(d));
  const byId = new Map(rows.map((r) => [r.id, r]));
  const lines: PreparedLine[] = [];
  const required = new Map<string, number>();
  let eta: string | null = null;
  // Custom blouses are priced from the live admin catalog, never from the request.
  const catalog: BlouseCatalog | null = items.some((i) => i.customization) ? await getBlouseCatalog() : null;

  for (const item of items) {
    const product = byId.get(item.productId);

    if (item.customization) {
      if (item.productId !== CUSTOM_BLOUSE_PRODUCT_ID) throw badRequest("This item cannot be customised.");
      const priced = priceBlouse(catalog!, {
        designId: item.customization.designId,
        options: item.customization.options,
      });
      if (!priced.ok) {
        throw conflict(`${priced.reason} Some choices in your custom blouse are no longer offered — please edit it in the builder.`);
      }
      const { expectedPrice } = item.customization;
      if (expectedPrice !== undefined && expectedPrice !== priced.breakdown.total) {
        // Never charge a price the customer did not confirm.
        throw conflict(
          `The price of your custom blouse changed from ${formatINR(expectedPrice)} to ${formatINR(priced.breakdown.total)}. Please review it in your bag before ordering.`
        );
      }
      if (Object.keys(validateMeasurements(item.customization.measurements)).length > 0) {
        throw badRequest("Your blouse measurements are incomplete. Please review them in the builder.");
      }
      const customization = buildCustomization(item.customization, priced.breakdown);
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

/**
 * Reserves stock line by line with conditional atomic decrements (never below zero).
 * If any line cannot be reserved, everything reserved so far is put back.
 */
async function reserveStock(lines: PreparedLine[]) {
  const done: PreparedLine[] = [];
  try {
    for (const line of lines) {
      if (line.reservesStock) {
        const res = await Products.updateOne(
          { _id: line.productId, stock: { $gte: line.quantity } },
          { $inc: { stock: -line.quantity, soldCount: line.quantity } }
        );
        if (res.modifiedCount === 0) throw conflict(`${line.name} just sold out. Please update your bag.`);
      } else {
        await Products.updateOne({ _id: line.productId }, { $inc: { soldCount: line.quantity } });
      }
      done.push(line);
    }
  } catch (error) {
    await unreserveStock(done);
    throw error;
  }
}

/** Puts reserved stock back (used to undo a failed order and on cancellation/return). */
async function unreserveStock(lines: { productId: string; quantity: number; reservesStock?: boolean }[]) {
  for (const line of lines) {
    await Products.updateOne({ _id: line.productId }, [
      {
        $set: {
          stock: line.reservesStock === false ? "$stock" : { $cond: [{ $eq: ["$deliveryType", "ready"] }, { $add: ["$stock", line.quantity] }, "$stock"] },
          soldCount: { $max: [0, { $subtract: ["$soldCount", line.quantity] }] },
        },
      },
    ], { updatePipeline: true });
  }
}

async function releaseStock(order: OrderRow) {
  await unreserveStock(order.items.filter((i) => !i.customBlouseId).map((i) => ({ productId: i.productId, quantity: i.quantity })));
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

  // 1. Stock first: it is the step most likely to fail, and it undoes itself if it does.
  await reserveStock(lines);

  // 2. The order and its items are one document, so they are written together or not at all.
  const orderId = await nextOrderId();
  const customIds: (string | null)[] = [];
  for (const line of lines) customIds.push(line.customization ? await nextCustomBlouseId() : null);
  const items: OrderItemRow[] = lines.map((line, i) => ({
    id: newId("oi"),
    orderId,
    productId: line.productId,
    slug: line.slug,
    name: line.name,
    image: line.image,
    price: line.price,
    mrp: line.mrp,
    size: line.size,
    color: line.color,
    quantity: line.quantity,
    customBlouseId: customIds[i],
  }));
  try {
    await Orders.create({
      _id: orderId,
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
      providerOrderId: null,
      providerPaymentId: null,
      estimatedDelivery: eta ?? getShippingMethod(input.shippingMethod).eta,
      timeline: [{ status: "Placed", at: timestamp }],
      internalNotes: [],
      stockReleased: false,
      pointsAwarded: 0,
      items,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    // 3. Custom blouse work orders, which the boutique tracks separately.
    const blouses = lines.flatMap((line, i) =>
      line.customization
        ? [
            {
              _id: customIds[i]!,
              orderId,
              userId: user.id,
              customization: line.customization,
              price: line.price,
              status: "Pending Review",
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ]
        : []
    );
    if (blouses.length > 0) await CustomBlouses.insertMany(blouses);
  } catch (error) {
    // Undo everything so a failed order leaves no trace and no missing stock.
    await Promise.allSettled([Orders.deleteOne({ _id: orderId }), CustomBlouses.deleteMany({ orderId })]);
    await unreserveStock(lines);
    throw error;
  }

  // 4. Book-keeping that never invalidates the order itself.
  if (totals.couponCode) await recordCouponUse(totals.couponCode);
  if (input.saveAddress) {
    const hasAddress = await Addresses.exists({ userId: user.id });
    await Addresses.create({
      _id: newId("adr"),
      userId: user.id,
      label: "Home",
      fullName: input.address.fullName,
      phone: input.address.phone,
      line1: input.address.line1,
      line2: input.address.line2 ?? "",
      city: input.address.city,
      state: input.address.state,
      pincode: input.address.pincode,
      isDefault: !hasAddress,
      createdAt: timestamp,
    });
  }

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

  const order = (await hydrate([(await findOrder(orderId))!]))[0];
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
  await Orders.updateOne({ _id: orderId }, { $set: { providerOrderId: gatewayOrderId, paymentStatus: "Pending", updatedAt: now() } });
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
  // Only one caller (browser return or webhook) can flip an unpaid order to paid.
  const res = await Orders.updateOne(
    { _id: row.id, paymentStatus: { $ne: "Paid" } },
    {
      $set: {
        paymentStatus: "Paid",
        providerPaymentId: gatewayPaymentId,
        ...(advance ? { status: "Confirmed" } : {}),
        updatedAt: timestamp,
      },
      ...(advance ? { $push: { timeline: { status: "Confirmed", at: timestamp } } } : {}),
    }
  );
  if (res.modifiedCount === 0) return;
  const [order] = await hydrate([(await findOrder(row.id))!]);
  await sendOrderEmail(order, "paid");
}

/** Confirms an online payment after verifying the gateway signature server-side. */
export async function confirmPayment(
  orderId: string,
  user: SessionUser,
  payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
): Promise<Order> {
  const row = await findOrder(orderId);
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
      await Orders.updateOne({ _id: orderId, paymentStatus: { $ne: "Paid" } }, { $set: { paymentStatus: "Failed", updatedAt: now() } });
      throw badRequest("We could not verify this payment. If money was debited it will be refunded automatically.");
    }
    await markPaid(row, payload.razorpay_payment_id);
  }
  return getOrderForUser(orderId, user);
}

export async function markPaymentFailed(orderId: string, user: SessionUser) {
  const row = await findOrder(orderId);
  if (!row || row.userId !== user.id) throw notFound("Order not found.");
  if (row.paymentStatus === "Pending" && row.paymentMethod !== "cod") {
    await Orders.updateOne({ _id: orderId, paymentStatus: "Pending" }, { $set: { paymentStatus: "Failed", updatedAt: now() } });
  }
}

export async function retryPayment(orderId: string, user: SessionUser): Promise<PaymentSession> {
  const row = await findOrder(orderId);
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
  const row = plain<OrderRow>(await Orders.findOne({ providerOrderId: payment.order_id }).lean());
  if (!row) return;
  if (event.event === "payment.captured" || event.event === "order.paid") {
    await markPaid(row, payment.id ?? "");
  } else if (event.event === "payment.failed" && row.paymentStatus === "Pending") {
    await Orders.updateOne({ _id: row.id, paymentStatus: "Pending" }, { $set: { paymentStatus: "Failed", updatedAt: now() } });
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

  // Optimistic concurrency: the update only applies if nobody changed the order since we read it.
  // Side effects (stock, points, blouse status) run after the update wins, so they happen exactly once.
  for (let attempt = 0; ; attempt += 1) {
    const row = await findOrder(orderId);
    if (!row) throw notFound("Order not found.");
    const timestamp = now();
    const set: Partial<OrderRow> = { updatedAt: timestamp };
    const after: (() => Promise<unknown>)[] = [];
    statusChanged = false;

    if (change.paymentStatus) set.paymentStatus = change.paymentStatus;

    if (change.status && change.status !== row.status) {
      if (!orderStatusesFor(row.isCustom).includes(change.status)) {
        throw badRequest(`"${change.status}" is not a valid status for this order.`);
      }
      statusChanged = true;
      set.status = change.status;
      set.timeline = [...row.timeline, { status: change.status, at: timestamp }];

      if (STOCK_RELEASING_STATUSES.includes(change.status) && !row.stockReleased) {
        set.stockReleased = true;
        after.push(() => releaseStock(row));
      }
      if (change.status === "Delivered") {
        if (row.paymentMethod === "cod" && !change.paymentStatus) set.paymentStatus = "Paid";
        if (row.pointsAwarded === 0) {
          const points = pointsForAmount(row.total, config);
          set.pointsAwarded = points;
          after.push(() => adjustPoints(row.userId, points));
        }
      }
      if (TERMINAL_ORDER_STATUSES.includes(change.status) && row.pointsAwarded > 0) {
        set.pointsAwarded = 0;
        after.push(() => adjustPoints(row.userId, -row.pointsAwarded));
      }
      if (change.status === "Refunded" && !change.paymentStatus && row.paymentStatus === "Paid") {
        set.paymentStatus = "Refunded";
      }
      const blouseStatus = ORDER_TO_BLOUSE[change.status];
      if (row.isCustom && blouseStatus) {
        after.push(() => CustomBlouses.updateMany({ orderId }, { $set: { status: blouseStatus, updatedAt: timestamp } }));
      }
    }

    if (change.note) {
      set.internalNotes = [...row.internalNotes, { note: change.note, at: timestamp, by: actor }];
    }

    const res = await Orders.updateOne({ _id: orderId, updatedAt: row.updatedAt }, { $set: set });
    if (res.modifiedCount === 1) {
      for (const step of after) await step();
      break;
    }
    if (attempt >= 4) throw conflict("This order was being updated at the same time. Please try again.");
  }

  const order = await getOrderForAdmin(orderId);
  if (statusChanged) await sendOrderEmail(order, "status");
  return order;
}

/** Customers may cancel only before the boutique has started working on the order. */
export async function cancelOrderAsCustomer(orderId: string, user: SessionUser): Promise<Order> {
  const row = await findOrder(orderId);
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
  const blouses = plainAll<CustomBlouseRow>(await CustomBlouses.find().sort({ createdAt: -1 }).lean());
  const customers = await Users.find({ _id: { $in: [...new Set(blouses.map((b) => b.userId))] } }, { name: 1, email: 1 }).lean();
  const byId = new Map(customers.map((c) => [c._id, c]));
  // Matches the former inner join: blouses whose customer no longer exists are not listed.
  return blouses.flatMap((b) => {
    const c = byId.get(b.userId);
    return c ? [{ ...b, customerName: c.name, customerEmail: c.email }] : [];
  });
}

export async function updateCustomBlouseStatus(id: string, status: string, actor: string) {
  const row = await CustomBlouses.findById(id).lean();
  if (!row) throw notFound("Custom order not found.");
  const orderStatus = BLOUSE_TO_ORDER[status];
  if (orderStatus) await applyOrderUpdate(row.orderId, { status: orderStatus }, actor);
  // Set last: the order update above normalises blouse statuses for the whole order.
  await CustomBlouses.updateOne({ _id: id }, { $set: { status, updatedAt: now() } });
}
