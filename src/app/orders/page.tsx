"use client";

import { useState } from "react";
import { MapPin, PackageCheck, ScanSearch } from "lucide-react";
import { orders } from "@/lib/data";
import { formatINR } from "@/lib/utils";
import { OrderTimeline } from "@/components/ui/OrderTimeline";
import { TextInput } from "@/components/ui/fields";
import { EmptyState } from "@/components/ui/EmptyState";

export default function OrdersPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(orders[0].id);

  const term = query.trim().toUpperCase();
  const visible = term
    ? orders.filter(
        (o) => o.id.includes(term) || o.items.some((i) => i.name.toUpperCase().includes(term))
      )
    : orders;

  const active = orders.find((o) => o.id === selected) ?? visible[0];

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-32 sm:px-8 lg:px-10 lg:pt-40">
      <h1 className="serif-display mb-2 text-4xl text-charcoal">Order Tracking</h1>
      <p className="mb-8 max-w-lg text-mist">
        Follow your saree, chudithar or bespoke blouse from our atelier to your doorstep.
      </p>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        {/* Order list / search */}
        <div>
          <label className="mb-3 flex items-center gap-2 text-sm font-medium text-charcoal">
            <ScanSearch width={16} height={16} className="text-gold-deep" />
            Search by order ID or product
          </label>
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. UMA-240618 or Banarasi"
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
                const icon = o.isCustomBlouse ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
                    ✶
                  </span>
                ) : (
                  <PackageCheck width={18} height={18} className="text-gold-deep" />
                );
                return (
                  <li key={o.id}>
                    <button
                      onClick={() => setSelected(o.id)}
                      className={
                        "w-full rounded-xl border p-4 text-left transition-all " +
                        (isActive
                          ? "border-charcoal bg-cream/70"
                          : "border-clay/60 bg-white/60 hover:border-charcoal/40")
                      }
                    >
                      <span className="flex items-center justify-between">
                        <span className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream">
                            {icon}
                          </span>
                          <span>
                            <span className="block text-sm font-medium text-charcoal">{o.id}</span>
                            <span className="block text-xs text-mist">{o.items[0].name}</span>
                          </span>
                        </span>
                        <span className="text-xs font-medium uppercase tracking-wide text-gold-deep">
                          {o.status}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Active order detail */}
        {active && (
          <section className="rounded-2xl border border-clay/60 bg-white/60 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-mist">Order</p>
                <h2 className="serif-display text-2xl text-charcoal">{active.id}</h2>
              </div>
              <div className="rounded-full bg-cream px-4 py-2 text-sm font-medium text-gold-deep">
                {active.status}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {active.items.map((item) => (
                <div key={item.key} className="flex items-center gap-4">
                  <span className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-charcoal">{item.name}</p>
                    <p className="text-xs capitalize text-mist">
                      {item.size}
                      {item.color ? ` · ${item.color}` : ""}
                      {active.isCustomBlouse && item.customization
                        ? ` · ${item.customization.neck} neck · ${item.customization.sleeve} · ${item.customization.back}`
                        : ""}
                    </p>
                  </div>
                  <span className="text-sm tabular-nums text-charcoal">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 rounded-xl bg-cream/60 p-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-taupe">Placed on</dt>
                <dd className="mt-1 font-medium text-charcoal">{active.placedOn}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-taupe">Total</dt>
                <dd className="mt-1 font-medium text-charcoal">{formatINR(active.total)}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-taupe">Payment</dt>
                <dd className="mt-1 font-medium text-charcoal">{active.paymentMethod}</dd>
              </div>
            </dl>

            <p className="mt-4 flex items-center gap-1.5 text-sm text-mist">
              <MapPin width={14} height={14} className="text-gold-deep" />
              {active.eta}
            </p>

            <div className="mt-6 border-t border-clay/60 pt-6">
              <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-taupe">
                {active.isCustomBlouse ? "Atelier Timeline" : "Shipment Timeline"}
              </h3>
              <OrderTimeline
                steps={active.timeline}
                className="max-w-md"
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
