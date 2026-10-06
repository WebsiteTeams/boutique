import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/server/config/env";
import { serviceUnavailable } from "@/server/utils/errors";

/**
 * Razorpay integration (UPI, cards, net banking, wallets).
 * Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET; without them online
 * payment is reported as unavailable and only Cash on Delivery is offered.
 */

export const PAYMENT_PROVIDER = "razorpay";

export const isOnlinePaymentConfigured = () => Boolean(env.razorpayKeyId && env.razorpayKeySecret);

export const publicPaymentKey = () => env.razorpayKeyId ?? null;

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Creates a gateway order for the given amount (in rupees) and returns its id. */
export async function createGatewayOrder(input: { amount: number; receipt: string }): Promise<string> {
  if (!isOnlinePaymentConfigured()) {
    throw serviceUnavailable("Online payment is not available right now. Please choose Cash on Delivery.");
  }
  const auth = Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: input.amount * 100, // paise
      currency: "INR",
      receipt: input.receipt,
      notes: { orderId: input.receipt },
    }),
  });
  if (!res.ok) {
    console.error("[payments] create order failed", res.status, await res.text());
    throw serviceUnavailable("We could not start the payment. Please try again.");
  }
  const json = (await res.json()) as { id: string };
  return json.id;
}

/** Verifies the checkout callback signature: HMAC-SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(input: {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  signature: string;
}): boolean {
  if (!env.razorpayKeySecret) return false;
  const expected = createHmac("sha256", env.razorpayKeySecret)
    .update(`${input.gatewayOrderId}|${input.gatewayPaymentId}`)
    .digest("hex");
  return safeEqual(expected, input.signature);
}

/** Verifies a webhook delivery against RAZORPAY_WEBHOOK_SECRET using the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!env.razorpayWebhookSecret || !signature) return false;
  const expected = createHmac("sha256", env.razorpayWebhookSecret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}
