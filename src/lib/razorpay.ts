import { api } from "@/lib/api";
import { siteConfig } from "@/lib/config";

/** Payment session returned by the order API for online payments. */
export interface PaymentSession {
  provider: string;
  keyId: string;
  gatewayOrderId: string;
  /** Amount in paise. */
  amount: number;
}

interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", handler: () => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let loader: Promise<void> | null = null;

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  loader ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loader = null;
      reject(new Error("Payment window could not be loaded."));
    };
    document.body.appendChild(script);
  });
  return loader;
}

export type PaymentOutcome = "paid" | "dismissed" | "failed";

/**
 * Opens the gateway checkout for an order. The order is only treated as paid
 * after the server has verified the gateway signature.
 */
export async function payForOrder(input: {
  orderId: string;
  session: PaymentSession;
  method: string;
  customer: { name: string; email: string; phone: string };
}): Promise<PaymentOutcome> {
  await loadCheckout();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("Payment window could not be loaded.");

  return new Promise<PaymentOutcome>((resolve) => {
    let settled = false;
    const finish = (outcome: PaymentOutcome) => {
      if (settled) return;
      settled = true;
      if (outcome !== "paid") {
        api(`/api/orders/${input.orderId}/payment/failed`, { method: "POST" }).catch(() => {});
      }
      resolve(outcome);
    };

    const checkout = new Razorpay({
      key: input.session.keyId,
      order_id: input.session.gatewayOrderId,
      amount: input.session.amount,
      currency: "INR",
      name: siteConfig.name,
      description: `Order ${input.orderId}`,
      prefill: {
        name: input.customer.name,
        email: input.customer.email,
        contact: input.customer.phone,
        method: input.method === "wallet" ? "wallet" : input.method,
      },
      theme: { color: "#1c1a17" },
      modal: { ondismiss: () => finish("dismissed") },
      handler: (response: RazorpaySuccess) => {
        api(`/api/orders/${input.orderId}/payment/verify`, { body: response })
          .then(() => {
            settled = true;
            resolve("paid");
          })
          .catch(() => finish("failed"));
      },
    });
    checkout.on("payment.failed", () => finish("failed"));
    checkout.open();
  });
}
