"use client";

import { PackageCheck, ScanSearch, Scissors } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { Order } from "@/types";
import { api, errorMessage } from "@/lib/api";
import { payForOrder, type PaymentSession } from "@/lib/razorpay";
import { TERMINAL_ORDER_STATUSES } from "@/lib/status";
import { useApi } from "@/lib/use-api";
import { formatDate, formatINR } from "@/lib/utils";
import { useAuth, useToast } from "@/context/store";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextInput } from "@/components/ui/fields";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { OrderDetails } from "@/components/order/OrderDetails";

function OrdersInner() {
  const { user, ready } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = useSearchParams().get("order");
  const { data, error, loading, reload } = useApi<{ orders: Order[] }>(user ? "/api/orders" : null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const orders = data?.orders ?? [];
  const term = query.trim().toUpperCase();
  const visible = term
    ? orders.filter(
        (o) => o.id.includes(term) || o.items.some((i) => i.name.toUpperCase().includes(term))
      )
    : orders;
  const active = visible.find((o) => o.id === selectedId) ?? visible[0];

  const select = (id: string) => router.replace(`${pathname}?order=${encodeURIComponent(id)}`, { scroll: false });

  const cancel = async (order: Order) => {
    if (!window.confirm(`Cancel order ${order.id}?`)) return;
    setBusy(true);
    try {
      await api(`/api/orders/${order.id}/cancel`, { method: "POST" });
      showToast("Order cancelled", order.id, "info");
      reload();
    } catch (e) {
      showToast("Couldn't cancel", errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const pay = async (order: Order) => {
    setBusy(true);
    try {
      const res = await api<{ payment: PaymentSession }>(`/api/orders/${order.id}/payment/retry`, {
        method: "POST",
      });
      const outcome = await payForOrder({
        orderId: order.id,
        session: res.payment,
        method: order.paymentMethod,
        customer: { name: order.shippingAddress.fullName, email: order.contact.email, phone: order.contact.phone },
      });
      if (outcome === "paid") showToast("Payment received", order.id);
      else showToast("Payment not completed", "You can try again any time.", "error");
      reload();
    } catch (e) {
      showToast("Couldn't start the payment", errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  let body: React.ReactNode;
  if (!ready || (user && loading)) {
    body = (
      <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]" aria-busy="true">
        <div className="h-48 animate-pulse rounded-2xl bg-cream/70" />
        <div className="h-96 animate-pulse rounded-2xl bg-cream/70" />
      </div>
    );
  } else if (!user) {
    body = (
      <div className="rounded-2xl border border-clay/60 bg-white/60">
        <EmptyState
          icon={<PackageCheck width={24} height={24} />}
          title="Sign in to see your orders"
          description="Track deliveries and bespoke blouse progress from your account."
          actionLabel="Sign In"
          href="/login?next=/orders"
        />
      </div>
    );
  } else if (error) {
    body = (
      <div className="rounded-2xl border border-clay/60 bg-white/60" role="alert">
        <EmptyState
          icon={<ScanSearch width={24} height={24} />}
          title="We couldn't load your orders"
          description={error.message}
          actionLabel="Try again"
          onAction={reload}
        />
      </div>
    );
  } else if (orders.length === 0) {
    body = (
      <div className="rounded-2xl border border-clay/60 bg-white/60">
        <EmptyState
          icon={<PackageCheck width={24} height={24} />}
          title="No orders yet"
          description="When you place an order it will appear here with live tracking."
          actionLabel="Start Shopping"
          href="/sarees"
        />
      </div>
    );
  } else {
    const canPay =
      active &&
      active.paymentMethod !== "cod" &&
      active.paymentStatus !== "Paid" &&
      !TERMINAL_ORDER_STATUSES.includes(active.status);
    body = (
      <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <label className="mb-3 flex items-center gap-2 text-sm font-medium text-charcoal" htmlFor="order-search">
            <ScanSearch width={16} height={16} className="text-gold-deep" />
            Search by order ID or product
          </label>
          <TextInput
            id="order-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. UMA-2026-000001 or Banarasi"
            className="mb-4"
          />

          {visible.length === 0 ? (
            <div className="rounded-2xl border border-clay/60 bg-white/60">
              <EmptyState
                icon={<ScanSearch width={24} height={24} />}
                title="No orders found"
                description="Try a different order number or product name."
              />
            </div>
          ) : (
            <ul className="space-y-3">
              {visible.map((o) => {
                const isActive = o.id === active?.id;
                return (
                  <li key={o.id}>
                    <button
                      onClick={() => select(o.id)}
                      aria-current={isActive}
                      className={
                        "w-full rounded-xl border p-4 text-left transition-all " +
                        (isActive
                          ? "border-charcoal bg-cream/70"
                          : "border-clay/60 bg-white/60 hover:border-charcoal/40")
                      }
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-gold-deep">
                            {o.isCustom ? <Scissors width={17} height={17} /> : <PackageCheck width={18} height={18} />}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-charcoal">{o.id}</span>
                            <span className="block truncate text-xs text-mist">
                              {o.items[0]?.name}
                              {o.items.length > 1 ? ` +${o.items.length - 1} more` : ""}
                            </span>
                            <span className="block text-xs text-mist">
                              {formatDate(o.createdAt)} · {formatINR(o.total)}
                            </span>
                          </span>
                        </span>
                        <StatusBadge status={o.status} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {active && (
          <section className="rounded-2xl border border-clay/60 bg-white/60 p-6 sm:p-8" aria-label={`Order ${active.id}`}>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-mist">Order</p>
                <h2 className="type-heading-md text-charcoal">{active.id}</h2>
              </div>
              <StatusBadge status={active.status} className="px-4 py-2 text-sm" />
            </div>

            {canPay && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <span>Payment for this order is still pending.</span>
                <Button size="sm" onClick={() => pay(active)} disabled={busy}>
                  {busy ? "Opening…" : `Pay ${formatINR(active.total)}`}
                </Button>
              </div>
            )}

            <OrderDetails order={active} />

            <div className="mt-6 flex flex-wrap gap-3 border-t border-clay/60 pt-6">
              {active.status === "Placed" && (
                <Button variant="outline" size="sm" onClick={() => cancel(active)} disabled={busy}>
                  Cancel Order
                </Button>
              )}
              {active.status === "Delivered" &&
                active.items
                  .filter((i) => i.slug && !i.customization)
                  .slice(0, 2)
                  .map((i) => (
                    <LinkButton key={i.id} href={`/product/${i.slug}#reviews`} variant="outline" size="sm">
                      Review {i.name.split(" ").slice(0, 2).join(" ")}
                    </LinkButton>
                  ))}
              <LinkButton href="/contact" variant="ghost" size="sm">
                Need help?
              </LinkButton>
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-32 sm:px-8 lg:px-10 lg:pt-40">
      <h1 className="type-heading-xl mb-2 text-charcoal">Order Tracking</h1>
      <p className="mb-8 max-w-lg text-mist">
        Follow your saree, chudithar or bespoke blouse from our atelier to your doorstep.
      </p>
      {body}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersInner />
    </Suspense>
  );
}
