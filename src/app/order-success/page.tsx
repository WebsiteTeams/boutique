"use client";

import { motion } from "framer-motion";
import { AlertCircle, Check, Clock, Mail, PackageCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Order } from "@/types";
import { siteConfig } from "@/lib/config";
import { paymentMethodLabel } from "@/lib/status";
import { useApi } from "@/lib/use-api";
import { LinkButton } from "@/components/ui/Button";
import { OrderDetails } from "@/components/order/OrderDetails";

function OrderSuccessInner() {
  const orderId = useSearchParams().get("order");
  const { data, error, loading } = useApi<{ order: Order }>(
    orderId ? `/api/orders/${encodeURIComponent(orderId)}` : null
  );
  const order = data?.order;

  if (!orderId || error) {
    return (
      <div className="mx-auto max-w-xl px-5 pb-20 pt-32 text-center sm:px-8 lg:pt-40">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream text-gold-deep">
          <AlertCircle width={26} height={26} />
        </span>
        <h1 className="type-heading-xl mt-6 text-charcoal">We couldn&apos;t find that order</h1>
        <p className="mt-3 text-mist">
          {error?.status === 401
            ? "Please sign in to view your order."
            : "The link may be incomplete. You can find all your orders in your account."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {error?.status === 401 ? (
            <LinkButton href={`/login?next=${encodeURIComponent(`/order-success?order=${orderId ?? ""}`)}`}>
              Sign In
            </LinkButton>
          ) : (
            <LinkButton href="/orders">View My Orders</LinkButton>
          )}
        </div>
      </div>
    );
  }

  if (loading || !order) {
    return (
      <div className="mx-auto max-w-2xl px-5 pb-20 pt-32 sm:px-8 lg:pt-40" aria-busy="true">
        <div className="mx-auto h-20 w-20 animate-pulse rounded-full bg-cream" />
        <div className="mx-auto mt-8 h-64 animate-pulse rounded-2xl bg-cream/70" />
      </div>
    );
  }

  const awaitingPayment = order.paymentMethod !== "cod" && order.paymentStatus !== "Paid";

  return (
    <div className="mx-auto max-w-2xl px-5 pb-20 pt-32 sm:px-8 lg:pt-40">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold text-white shadow-lg shadow-gold-soft/40"
        >
          {awaitingPayment ? <Clock width={34} height={34} /> : <Check width={36} height={36} strokeWidth={2.5} />}
        </motion.div>

        <h1 className="type-display-lg mt-7 text-charcoal">
          {awaitingPayment ? "Order received" : "Thank you!"}
        </h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-mist">
          {awaitingPayment ? (
            <>
              Your order <span className="font-medium text-charcoal">{order.id}</span> is saved, but payment is
              still pending. You can complete it from your orders.
            </>
          ) : (
            <>
              Your order <span className="font-medium text-charcoal">{order.id}</span> has been placed
              {order.paymentMethod === "cod"
                ? ` with ${paymentMethodLabel(order.paymentMethod)}.`
                : " and your payment is confirmed."}
            </>
          )}
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-clay/60 bg-white/60 p-6 sm:p-7">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-mist">Order number</p>
            <p className="type-heading-md mt-0.5 text-charcoal">{order.id}</p>
          </div>
          <PackageCheck width={32} height={32} className="text-gold-deep" />
        </div>
        <OrderDetails order={order} />
      </div>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <LinkButton href={`/orders?order=${encodeURIComponent(order.id)}`}>
          {awaitingPayment ? "Complete Payment" : "Track Order"}
          <PackageCheck width={15} height={15} />
        </LinkButton>
        <LinkButton href="/sarees" variant="outline">
          Continue Shopping
        </LinkButton>
      </div>

      <p className="mt-10 text-center text-xs text-taupe">
        <span className="inline-flex items-center gap-1.5">
          <Mail width={13} height={13} />
          Need help? Write to{" "}
          <a href={`mailto:${siteConfig.ordersEmail}`} className="underline underline-offset-4 hover:text-charcoal">
            {siteConfig.ordersEmail}
          </a>
        </span>
        <br />
        <Link href="/shipping" className="underline underline-offset-4 hover:text-charcoal">
          Shipping &amp; delivery details
        </Link>
      </p>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense>
      <OrderSuccessInner />
    </Suspense>
  );
}
