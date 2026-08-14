"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  IndianRupee,
  LayoutDashboard,
  Package,
  PackagePlus,
  Settings,
  Shirt,
  ShoppingBag,
  Users,
} from "lucide-react";
import { orders, products } from "@/lib/data";
import { cn, formatINR, formatINRShort } from "@/lib/utils";
import { LinkButton } from "@/components/ui/Button";

type Tab = "dashboard" | "orders" | "products" | "custom" | "customers";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "products", label: "Products", icon: Package },
  { id: "custom", label: "Custom Blouses", icon: Shirt },
  { id: "customers", label: "Customers", icon: Users },
];

const REVENUE = [
  { m: "Feb", v: 42 },
  { m: "Mar", v: 58 },
  { m: "Apr", v: 51 },
  { m: "May", v: 74 },
  { m: "Jun", v: 68 },
  { m: "Jul", v: 91 },
  { m: "Aug", v: 84 },
];

const CUSTOMERS = [
  { name: "Ananya Sharma", email: "ananya@example.com", orders: 4, spent: 61250, city: "New Delhi" },
  { name: "Priya Venkatesh", email: "priya@example.com", orders: 3, spent: 15480, city: "Bengaluru" },
  { name: "Meera Krishnan", email: "meera@example.com", orders: 2, spent: 22298, city: "Chennai" },
  { name: "Sneha Iyer", email: "sneha@example.com", orders: 2, spent: 11800, city: "Mumbai" },
];

const STATUS_STYLES: Record<string, string> = {
  "Out for Delivery": "bg-gold/15 text-gold-deep",
  Delivered: "bg-emerald-100 text-emerald-800",
  Stitching: "bg-violet-100 text-violet-800",
  Processing: "bg-sky-100 text-sky-800",
  Confirmed: "bg-cream text-charcoal",
};

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");

  const stats = useMemo(() => {
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const lowStock = products.filter((p) => !p.inStock).length;
    const customOrders = orders.filter((o) => o.isCustomBlouse).length;
    return { revenue, lowStock, customOrders };
  }, []);

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-28 sm:px-8 lg:px-10 lg:pt-32">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2 text-gold-deep">UMA Designers · Admin</p>
          <h1 className="type-heading-xl text-charcoal">Store Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-mist">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          All systems operational
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <nav className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm transition-colors",
                  tab === t.id
                    ? "bg-charcoal text-ivory"
                    : "text-mist hover:bg-cream hover:text-charcoal"
                )}
              >
                <t.icon width={16} height={16} />
                {t.label}
              </button>
            ))}
          </nav>
          <div className="mt-6 hidden rounded-xl border border-clay/60 bg-cream/50 p-4 lg:block">
            <Settings width={15} height={15} className="text-gold-deep" />
            <p className="mt-2 text-xs text-mist">Settings & catalog management live soon.</p>
          </div>
        </aside>

        <main className="min-w-0">
          {tab === "dashboard" && (
            <div className="space-y-8">
              {/* Stat cards */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Total Revenue", value: formatINR(stats.revenue), delta: "+18.2%", up: true, icon: IndianRupee },
                  { label: "Total Orders", value: String(orders.length), delta: "+4", up: true, icon: ShoppingBag },
                  { label: "Custom Blouse Orders", value: String(stats.customOrders), delta: "+1", up: true, icon: Shirt },
                  { label: "Low / Out of Stock", value: String(stats.lowStock), delta: "−2", up: false, icon: AlertTriangle },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-clay/60 bg-white/60 p-5">
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-gold-deep">
                        <s.icon width={16} height={16} />
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-0.5 text-xs font-medium",
                          s.up ? "text-emerald-600" : "text-red-600"
                        )}
                      >
                        {s.up ? <ArrowUpRight width={12} height={12} /> : <ArrowDownRight width={12} height={12} />}
                        {s.delta}
                      </span>
                    </div>
                    <p className="mt-4 text-xl font-medium tabular-nums text-charcoal">{s.value}</p>
                    <p className="mt-0.5 text-xs text-mist">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Revenue chart */}
              <div className="rounded-2xl border border-clay/60 bg-white/60 p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-medium text-charcoal">
                    <BarChart3 width={17} height={17} className="text-gold-deep" />
                    Revenue · Last 7 months
                  </h2>
                  <span className="text-sm text-mist">₹{formatINRShort(stats.revenue)} total</span>
                </div>
                <div className="flex h-48 items-end gap-3 sm:gap-5">
                  {REVENUE.map((r, i) => (
                    <div key={r.m} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                      <span className="text-xs tabular-nums text-mist opacity-0 transition-opacity group-hover:opacity-100">
                        ₹{r.v}k
                      </span>
                      <div
                        className={cn(
                          "w-full rounded-t-lg transition-colors",
                          i === REVENUE.length - 1 ? "bg-gold" : "bg-charcoal/15 group-hover:bg-charcoal/30"
                        )}
                        style={{ height: `${r.v}%` }}
                      />
                      <span className="text-[0.65rem] uppercase tracking-wide text-taupe">{r.m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent orders + quick actions */}
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-clay/60 bg-white/60 p-6">
                  <h2 className="mb-4 text-base font-medium text-charcoal">Recent Orders</h2>
                  <ul className="space-y-3">
                    {orders.slice(0, 4).map((o) => (
                      <li key={o.id} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-charcoal">{o.id}</p>
                          <p className="truncate text-xs text-mist">{o.items[0].name}</p>
                        </div>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-sm tabular-nums text-charcoal">{formatINR(o.total)}</span>
                          <span className={cn("rounded-full px-2.5 py-0.5 text-[0.65rem] font-medium", STATUS_STYLES[o.status] ?? "bg-cream text-mist")}>
                            {o.status}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-clay/60 bg-white/60 p-6">
                  <h2 className="mb-4 text-base font-medium text-charcoal">Quick Actions</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Add Product", icon: PackagePlus, to: "/admin/products" },
                      { label: "New Custom Order", icon: Shirt, to: "/custom-blouse" },
                      { label: "View All Orders", icon: ShoppingBag, to: "/orders" },
                      { label: "Manage Catalog", icon: Package, to: "/admin/products" },
                    ].map((a) => (
                      <LinkButton key={a.label} href={a.to} variant="ghost" className="justify-start border border-clay/60 p-4">
                        <a.icon width={16} height={16} className="text-gold-deep" />
                        {a.label}
                      </LinkButton>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "orders" && (
            <div className="rounded-2xl border border-clay/60 bg-white/60 p-6">
              <h2 className="mb-5 text-base font-medium text-charcoal">All Orders</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-clay/60 text-xs uppercase tracking-[0.14em] text-taupe">
                      <th className="pb-3 pr-4 font-medium">Order</th>
                      <th className="pb-3 pr-4 font-medium">Placed</th>
                      <th className="pb-3 pr-4 font-medium">Item</th>
                      <th className="pb-3 pr-4 font-medium">Total</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-clay/40">
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="py-3.5 pr-4 font-medium text-charcoal">{o.id}</td>
                        <td className="py-3.5 pr-4 tabular-nums text-mist">{o.placedOn}</td>
                        <td className="py-3.5 pr-4 text-mist">{o.items[0].name}</td>
                        <td className="py-3.5 pr-4 tabular-nums text-charcoal">{formatINR(o.total)}</td>
                        <td className="py-3.5">
                          <span className={cn("rounded-full px-2.5 py-0.5 text-[0.65rem] font-medium", STATUS_STYLES[o.status] ?? "bg-cream text-mist")}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "products" && (
            <div className="rounded-2xl border border-clay/60 bg-white/60 p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-medium text-charcoal">Catalog · {products.length} products</h2>
                <LinkButton href="/custom-blouse" variant="gold" size="sm">
                  <PackagePlus width={14} height={14} />
                  Add Product
                </LinkButton>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-clay/60 text-xs uppercase tracking-[0.14em] text-taupe">
                      <th className="pb-3 pr-4 font-medium">Product</th>
                      <th className="pb-3 pr-4 font-medium">Category</th>
                      <th className="pb-3 pr-4 font-medium">Price</th>
                      <th className="pb-3 pr-4 font-medium">Rating</th>
                      <th className="pb-3 font-medium">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-clay/40">
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <span className="h-10 w-8 shrink-0 overflow-hidden rounded bg-cream">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                            </span>
                            <span className="max-w-[220px] truncate font-medium text-charcoal">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4 text-mist">{p.category}</td>
                        <td className="py-3.5 pr-4 tabular-nums text-charcoal">{formatINR(p.price)}</td>
                        <td className="py-3.5 pr-4 tabular-nums text-mist">★ {p.rating}</td>
                        <td className="py-3.5">
                          {p.inStock ? (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[0.65rem] font-medium text-emerald-800">In Stock</span>
                          ) : (
                            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[0.65rem] font-medium text-red-700">Made to Order</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "custom" && (
            <div className="space-y-6">
              {orders.filter((o) => o.isCustomBlouse).map((o) => (
                <div key={o.id} className="rounded-2xl border border-clay/60 bg-white/60 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-medium text-charcoal">{o.id}</h3>
                      <p className="mt-0.5 text-xs text-mist">
                        Placed {o.placedOn} · {o.paymentMethod} · {formatINR(o.total)}
                      </p>
                    </div>
                    <span className={cn("rounded-full px-3 py-1 text-xs font-medium", STATUS_STYLES[o.status] ?? "bg-cream text-mist")}>
                      {o.status}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {o.items.map((i) => (
                      <div key={i.key} className="flex gap-4 rounded-xl bg-cream/60 p-4">
                        <span className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                        </span>
                        <div className="text-sm">
                          <p className="font-medium text-charcoal">{i.name}</p>
                          {i.customization && (
                            <p className="mt-1 text-xs leading-relaxed text-mist">
                              {i.customization.neck} · {i.customization.sleeve} · {i.customization.back} · {i.customization.embroidery} · {i.customization.border} · {i.customization.stitching}
                            </p>
                          )}
                          {i.customization?.instructions && (
                            <p className="mt-1 text-xs italic text-taupe">“{i.customization.instructions}”</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {orders.filter((o) => o.isCustomBlouse).length === 0 && (
                <p className="rounded-2xl border border-clay/60 bg-white/60 p-8 text-center text-sm text-mist">
                  No bespoke orders yet.
                </p>
              )}
            </div>
          )}

          {tab === "customers" && (
            <div className="rounded-2xl border border-clay/60 bg-white/60 p-6">
              <h2 className="mb-5 text-base font-medium text-charcoal">Top Customers</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-clay/60 text-xs uppercase tracking-[0.14em] text-taupe">
                      <th className="pb-3 pr-4 font-medium">Customer</th>
                      <th className="pb-3 pr-4 font-medium">City</th>
                      <th className="pb-3 pr-4 font-medium">Orders</th>
                      <th className="pb-3 font-medium">Lifetime Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-clay/40">
                    {CUSTOMERS.map((c) => (
                      <tr key={c.email}>
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-charcoal text-xs font-medium text-ivory">
                              {c.name.split(" ").map((n) => n[0]).join("")}
                            </span>
                            <span>
                              <span className="block font-medium text-charcoal">{c.name}</span>
                              <span className="block text-xs text-mist">{c.email}</span>
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4 text-mist">{c.city}</td>
                        <td className="py-3.5 pr-4 tabular-nums text-charcoal">{c.orders}</td>
                        <td className="py-3.5 tabular-nums text-charcoal">{formatINR(c.spent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
