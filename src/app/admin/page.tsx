import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Clock,
  IndianRupee,
  Package,
  PackagePlus,
  Shirt,
  ShoppingBag,
  Tag,
  Users,
} from "lucide-react";
import { cn, formatDate, formatINR, formatINRShort } from "@/lib/utils";
import { getDashboardStats } from "@/server/services/admin";
import { listNotifications } from "@/server/services/notifications";
import { listAllOrders } from "@/server/services/orders";
import { AdminCard, EmptyRow } from "@/components/admin/ui";
import { LinkButton } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [stats, recentOrders, activity] = await Promise.all([
    getDashboardStats(),
    listAllOrders({ limit: 5 }),
    listNotifications(6),
  ]);

  const cards = [
    { label: "Today's Revenue", value: formatINR(stats.todayRevenue), note: `${stats.todayOrders} order${stats.todayOrders === 1 ? "" : "s"} today`, icon: IndianRupee, href: "/admin/orders" },
    { label: "Total Orders", value: String(stats.totalOrders), note: `${formatINR(stats.totalRevenue)} lifetime`, icon: ShoppingBag, href: "/admin/orders" },
    { label: "Pending Orders", value: String(stats.pendingOrders), note: "Awaiting fulfilment", icon: Clock, href: "/admin/orders" },
    { label: "Open Custom Orders", value: String(stats.customOrdersOpen), note: "In the atelier", icon: Shirt, href: "/admin/custom-orders" },
    { label: "Upcoming Appointments", value: String(stats.upcomingAppointments), note: `${stats.pendingAppointments} awaiting confirmation`, icon: CalendarDays, href: "/admin/appointments" },
    { label: "Low Stock", value: String(stats.lowStock), note: `${stats.outOfStock} out of stock`, icon: AlertTriangle, href: "/admin/products?stock=low", alert: stats.lowStock + stats.outOfStock > 0 },
    { label: "Customers", value: String(stats.customers), note: "Registered accounts", icon: Users, href: "/admin/customers" },
  ];

  const peak = Math.max(1, ...stats.revenueByMonth.map((m) => m.revenue));
  const hasRevenue = stats.revenueByMonth.some((m) => m.revenue > 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-clay/60 bg-white/60 p-5 transition-colors hover:border-charcoal/40"
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full",
                s.alert ? "bg-amber-100 text-amber-800" : "bg-cream text-gold-deep"
              )}
            >
              <s.icon width={16} height={16} />
            </span>
            <p className="mt-4 text-xl font-medium tabular-nums text-charcoal">{s.value}</p>
            <p className="mt-0.5 text-xs text-charcoal">{s.label}</p>
            <p className="mt-0.5 text-xs text-mist">{s.note}</p>
          </Link>
        ))}
      </div>

      <AdminCard>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-medium text-charcoal">
            <BarChart3 width={17} height={17} className="text-gold-deep" />
            Revenue · Last 7 months
          </h2>
          <span className="text-sm text-mist">{formatINRShort(stats.totalRevenue)} total</span>
        </div>
        {hasRevenue ? (
          <div className="flex h-48 items-end gap-3 sm:gap-5" role="img" aria-label="Monthly revenue for the last seven months">
            {stats.revenueByMonth.map((r, i) => (
              <div key={r.month} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs tabular-nums text-mist opacity-0 transition-opacity group-hover:opacity-100">
                  {formatINRShort(r.revenue)}
                </span>
                <div
                  className={cn(
                    "w-full rounded-t-lg transition-colors",
                    i === stats.revenueByMonth.length - 1 ? "bg-gold" : "bg-charcoal/15 group-hover:bg-charcoal/30"
                  )}
                  style={{ height: `${Math.max(2, (r.revenue / peak) * 100)}%` }}
                  title={`${r.label}: ${formatINR(r.revenue)} from ${r.orders} orders`}
                />
                <span className="text-[0.65rem] uppercase tracking-wide text-taupe">{r.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyRow>No revenue recorded yet. The chart fills in as orders are placed.</EmptyRow>
        )}
      </AdminCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard
          title="Recent Orders"
          action={
            <Link href="/admin/orders" className="text-xs font-medium text-gold-deep underline underline-offset-4">
              View all
            </Link>
          }
        >
          {recentOrders.length === 0 ? (
            <EmptyRow>No orders yet.</EmptyRow>
          ) : (
            <ul className="space-y-3">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 rounded-lg px-1 py-1 hover:bg-cream/60">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-charcoal">{o.id}</p>
                      <p className="truncate text-xs text-mist">
                        {o.customer?.name ?? "Customer"} · {o.items[0]?.name}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-sm tabular-nums text-charcoal">{formatINR(o.total)}</span>
                      <StatusBadge status={o.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard title="Quick Actions">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Add Product", icon: PackagePlus, to: "/admin/products/new" },
              { label: "Manage Catalog", icon: Package, to: "/admin/products" },
              { label: "View All Orders", icon: ShoppingBag, to: "/admin/orders" },
              { label: "Create Coupon", icon: Tag, to: "/admin/coupons" },
            ].map((a) => (
              <LinkButton key={a.label} href={a.to} variant="ghost" className="justify-start border border-clay/60 p-4">
                <a.icon width={16} height={16} className="text-gold-deep" />
                {a.label}
              </LinkButton>
            ))}
          </div>
        </AdminCard>
      </div>

      <AdminCard title="Recent Activity">
        {activity.length === 0 ? (
          <EmptyRow>New orders, appointments, reviews and enquiries will appear here.</EmptyRow>
        ) : (
          <ul className="divide-y divide-clay/40">
            {activity.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  {n.link ? (
                    <Link href={n.link} className="text-sm font-medium text-charcoal hover:text-gold-deep">
                      {n.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-charcoal">{n.title}</p>
                  )}
                  {n.body && <p className="truncate text-xs text-mist">{n.body}</p>}
                </div>
                <span className="shrink-0 text-xs text-mist">{formatDate(n.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
