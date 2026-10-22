"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Order } from "@/types";
import { customizationRows } from "@/lib/blouse";
import { getShippingMethod } from "@/lib/pricing";
import { buildTimeline, paymentMethodLabel } from "@/lib/status";
import { formatDate, formatINR } from "@/lib/utils";
import { OrderTimeline } from "@/components/ui/OrderTimeline";
import { StatusBadge } from "@/components/ui/StatusBadge";

/** Full order breakdown, shared by the customer order pages and the admin order view. */
export function OrderDetails({ order, showTimeline = true }: { order: Order; showTimeline?: boolean }) {
  const a = order.shippingAddress;
  return (
    <div>
      <ul className="space-y-4">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start gap-4">
            <span className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-cream">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt="" className="h-full w-full object-cover" />
              ) : null}
            </span>
            <div className="min-w-0 flex-1">
              {item.slug && !item.customization ? (
                <Link href={`/product/${item.slug}`} className="block truncate text-sm font-medium text-charcoal hover:text-gold-deep">
                  {item.name}
                </Link>
              ) : (
                <p className="truncate text-sm font-medium text-charcoal">{item.name}</p>
              )}
              <p className="text-xs capitalize text-mist">
                {item.size}
                {item.color ? ` · ${item.color}` : ""} · Qty {item.quantity}
              </p>
              {item.customization && (
                <dl className="mt-2 grid gap-x-4 gap-y-1 rounded-lg bg-cream/70 px-3 py-2.5 text-xs sm:grid-cols-2">
                  {item.customBlouseId && (
                    <div className="sm:col-span-2">
                      <dt className="inline text-mist">Custom order: </dt>
                      <dd className="inline font-medium text-charcoal">
                        {item.customBlouseId}
                        {item.customStatus ? ` · ${item.customStatus}` : ""}
                      </dd>
                    </div>
                  )}
                  {customizationRows(item.customization).map((row) => (
                    <div key={row.label} className={row.label === "Measurements" ? "sm:col-span-2" : ""}>
                      <dt className="inline text-mist">{row.label}: </dt>
                      <dd className="inline text-charcoal">{row.value}</dd>
                    </div>
                  ))}
                  {item.customization.instructions && (
                    <div className="sm:col-span-2">
                      <dt className="inline text-mist">Instructions: </dt>
                      <dd className="inline italic text-charcoal">{item.customization.instructions}</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
            <span className="text-sm tabular-nums text-charcoal">{formatINR(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-6 space-y-2 border-t border-clay/60 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-mist">Subtotal</dt>
          <dd className="tabular-nums text-charcoal">{formatINR(order.subtotal)}</dd>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-gold-deep">
            <dt>Coupon {order.couponCode}</dt>
            <dd className="tabular-nums">−{formatINR(order.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-mist">Shipping · {getShippingMethod(order.shippingMethod).label}</dt>
          <dd className="tabular-nums text-charcoal">{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</dd>
        </div>
        <div className="flex justify-between border-t border-clay/60 pt-3 text-base">
          <dt className="font-medium text-charcoal">Total</dt>
          <dd className="type-price tabular-nums text-charcoal">{formatINR(order.total)}</dd>
        </div>
      </dl>

      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-cream/60 p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-taupe">Placed on</dt>
          <dd className="mt-1 font-medium text-charcoal">{formatDate(order.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-taupe">Payment</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-2 font-medium text-charcoal">
            {paymentMethodLabel(order.paymentMethod)}
            <StatusBadge status={order.paymentStatus} />
          </dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-taupe">Estimated delivery</dt>
          <dd className="mt-1 font-medium text-charcoal">{order.estimatedDelivery}</dd>
        </div>
      </dl>

      <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-mist">
        <MapPin width={15} height={15} className="mt-0.5 shrink-0 text-gold-deep" />
        <span>
          <span className="text-charcoal">{a.fullName}</span> · {a.phone}
          <br />
          {a.line1}
          {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
        </span>
      </p>

      {showTimeline && (
        <div className="mt-6 border-t border-clay/60 pt-6">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-taupe">
            {order.isCustom ? "Atelier Timeline" : "Shipment Timeline"}
          </h3>
          <OrderTimeline
            steps={buildTimeline(order.isCustom, order.status, order.timeline, formatDate)}
            className="max-w-md"
          />
        </div>
      )}
    </div>
  );
}
