"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Heart,
  MapPin,
  PackageCheck,
  User,
  Wallet,
} from "lucide-react";
import { orders } from "@/lib/data";
import { useWishlist } from "@/context/store";
import { cn, formatINR } from "@/lib/utils";
import { OrderTimeline } from "@/components/ui/OrderTimeline";
import { LinkButton } from "@/components/ui/Button";

type Tab = "overview" | "orders" | "addresses";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "overview", label: "Overview", icon: User },
  { id: "orders", label: "My Orders", icon: PackageCheck },
  { id: "addresses", label: "Addresses", icon: MapPin },
];

const PROFILE = {
  name: "Meera Krishnan",
  email: "meera.k@example.com",
  phone: "+91 98400 00000",
  memberSince: "2024",
};

const ADDRESSES = [
  {
    id: "a1",
    label: "Home",
    name: "Meera Krishnan",
    line: "12, Nungambakkam High Road, Chennai, Tamil Nadu 600034",
    phone: "+91 98400 00000",
    isDefault: true,
  },
  {
    id: "a2",
    label: "Work",
    name: "Meera Krishnan",
    line: "Level 4, Brigade Metropolis, Bengaluru, Karnataka 560048",
    phone: "+91 98400 00000",
    isDefault: false,
  },
];

export default function AccountPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const { wishlist } = useWishlist();
  const [selectedOrder, setSelectedOrder] = useState(orders[0].id);

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-32 sm:px-8 lg:px-10 lg:pt-40">
      {/* Header */}
      <div className="mb-10 flex flex-wrap items-center gap-5">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-charcoal text-xl font-medium text-ivory">
          MK
        </span>
        <div>
          <h1 className="serif-display text-3xl text-charcoal">{PROFILE.name}</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-mist">
            <BadgeCheck width={14} height={14} className="text-gold-deep" />
            {PROFILE.email} · Member since {PROFILE.memberSince}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto border-b border-clay/50">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors",
              tab === t.id
                ? "border-charcoal font-medium text-charcoal"
                : "border-transparent text-mist hover:text-charcoal"
            )}
          >
            <t.icon width={15} height={15} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <LinkButton
            href="/orders"
            variant="ghost"
            className="rounded-2xl border border-clay/60 bg-white/60 p-6 text-left"
          >
            <PackageCheck width={22} height={22} className="text-gold-deep" />
            <p className="serif-display mt-3 text-3xl text-charcoal">{orders.length}</p>
            <p className="text-sm text-mist">Total orders</p>
          </LinkButton>
          <LinkButton
            href="/wishlist"
            variant="ghost"
            className="rounded-2xl border border-clay/60 bg-white/60 p-6 text-left"
          >
            <Heart width={22} height={22} className="text-gold-deep" />
            <p className="serif-display mt-3 text-3xl text-charcoal">{wishlist.length}</p>
            <p className="text-sm text-mist">Saved to wishlist</p>
          </LinkButton>
          <div className="rounded-2xl border border-clay/60 bg-white/60 p-6">
            <Wallet width={22} height={22} className="text-gold-deep" />
            <p className="serif-display mt-3 text-3xl text-charcoal">
              {formatINR(orders.reduce((s, o) => s + o.total, 0))}
            </p>
            <p className="text-sm text-mist">Lifetime spend</p>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <h2 className="serif-display mb-4 text-2xl text-charcoal">Recent Orders</h2>
            <ul className="grid gap-4 lg:grid-cols-3">
              {orders.slice(0, 3).map((o) => (
                <li key={o.id} className="rounded-2xl border border-clay/60 bg-white/60 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-charcoal">{o.id}</span>
                    <span className="rounded-full bg-cream px-3 py-1 text-xs font-medium text-gold-deep">
                      {o.status}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-sm text-mist">{o.items[0].name}</p>
                  <p className="mt-1 text-sm tabular-nums text-charcoal">{formatINR(o.total)}</p>
                  <LinkButton href="/orders" variant="outline" size="sm" className="mt-4">
                    Track
                  </LinkButton>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-6">
          {orders.map((o) => (
            <section
              key={o.id}
              className={cn(
                "rounded-2xl border p-6 sm:p-7",
                selectedOrder === o.id ? "border-charcoal bg-cream/50" : "border-clay/60 bg-white/60"
              )}
            >
              <button
                onClick={() => setSelectedOrder(o.id)}
                className="flex w-full flex-wrap items-center justify-between gap-3"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-gold-deep">
                    <PackageCheck width={18} height={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-charcoal">{o.id}</span>
                    <span className="block text-xs text-mist">
                      Placed {o.placedOn} · {o.paymentMethod}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-sm tabular-nums text-charcoal">{formatINR(o.total)}</span>
                  <span className="rounded-full bg-cream px-3 py-1 text-xs font-medium text-gold-deep">
                    {o.status}
                  </span>
                </span>
              </button>

              {selectedOrder === o.id && (
                <div className="mt-6 grid gap-8 border-t border-clay/60 pt-6 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.14em] text-taupe">
                      Items
                    </h3>
                    <ul className="space-y-3">
                      {o.items.map((item) => (
                        <li key={item.key} className="flex items-center gap-3">
                          <span className="h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-cream">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-charcoal">
                              {item.name}
                            </span>
                            <span className="block text-xs capitalize text-mist">{item.size}</span>
                          </span>
                          <span className="text-sm tabular-nums text-charcoal">
                            {formatINR(item.price * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.14em] text-taupe">
                      {o.isCustomBlouse ? "Atelier Timeline" : "Shipment Timeline"}
                    </h3>
                    <OrderTimeline steps={o.timeline} />
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {tab === "addresses" && (
        <div className="grid gap-6 sm:grid-cols-2">
          {ADDRESSES.map((a) => (
            <div key={a.id} className="rounded-2xl border border-clay/60 bg-white/60 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-charcoal">
                  {a.label}
                </h3>
                {a.isDefault && (
                  <span className="rounded-full bg-gold/15 px-3 py-1 text-[0.62rem] font-medium uppercase tracking-wide text-gold-deep">
                    Default
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm font-medium text-charcoal">{a.name}</p>
              <p className="mt-1 text-sm leading-relaxed text-mist">{a.line}</p>
              <p className="mt-1 text-sm text-mist">{a.phone}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
