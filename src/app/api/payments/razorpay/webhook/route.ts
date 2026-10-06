import { NextResponse } from "next/server";
import { handleGatewayEvent } from "@/server/services/orders";
import { verifyWebhookSignature } from "@/server/services/payments";

/**
 * Razorpay webhook. Configure it in the Razorpay dashboard with the events
 * payment.captured, payment.failed and order.paid, and set RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: { message: "Invalid signature." } }, { status: 400 });
  }
  try {
    await handleGatewayEvent(JSON.parse(raw));
  } catch (error) {
    console.error("[payments] webhook handling failed", error);
    return NextResponse.json({ error: { message: "Webhook processing failed." } }, { status: 500 });
  }
  return NextResponse.json({ data: { received: true } });
}
