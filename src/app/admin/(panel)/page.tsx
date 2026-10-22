import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Mail,
  Minus,
  PackagePlus,
  Shirt,
  Star,
  Tag,
} from "lucide-react";
import { cn, formatDate, formatINR, formatINRShort } from "@/lib/utils";
import { getDashboardStats } from "@/server/services/admin";
import { listNotifications } from "@/server/services/notifications";
import { listAllOrders } from "@/server/services/orders";
import { listProducts } from "@/server/services/products";
import { getCurrentUser } from "@/server/auth/session";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata = { title: "Dashboard" };

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

function Panel({
  title,
  href,
  linkLabel = "View all",
  children,
  className,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-clay/60 bg-white p-5 shadow-soft sm:p-6", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-charcoal">{title}</h2>
        {href && (
          <Link
            href={href}
            className="inline-flex min-h-9 items-center gap-1 rounded-full px-2 text-xs font-medium text-gold-deep hover:text-charcoal focus-visible:outline-2 focus-visible:outline-gold"
          >
            {linkLabel}
            <ArrowRight width={13} height={13} aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Delta({ now, before, period }: { now: number; before: number; period: string }) {
  if (before === 0) {
    return <p className="mt-2 text-xs text-mist">{now > 0 ? `First sales since ${period}` : `Nothing yet · ${period} ₹0`}</p>;
  }
  const change = Math.round(((now - before) / before) * 100);
  const Icon = change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus;
  return (
    <p className="mt-2 flex items-center gap-1 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-semibold",
          change > 0 ? "text-green-800" : change < 0 ? "text-red-700" : "text-mist"
        )}
      >
        <Icon width={13} height={13} aria-hidden />
        {change > 0 ? "+" : ""}
        {change}%
      </span>
      <span className="text-mist">vs {period}</span>
    </p>
  );
}

export default async function AdminDashboardPage() {
  const [user, stats, recentOrders, activity, products] = await Promise.all([
    getCurrentUser(),
    getDashboardStats(),
    listAllOrders({ limit: 6 }),
    listNotifications(6),
    listProducts(),
  ]);

  const months = stats.revenueByMonth;
  const thisMonth = months[months.length - 1];
  const lastMonth = months[months.length - 2];
  const avgOrder = stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0;
  const hasRevenue = months.some((m) => m.revenue > 0);

  const lowStock = products
    .filter((p) => p.stockState === "Low Stock" || p.stockState === "Out of Stock")
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
    .slice(0, 5);

  const attention = [
    { count: stats.pendingOrders, label: "orders to fulfil", href: "/admin/orders", icon: Clock },
    { count: stats.customOrdersOpen, label: "custom blouses in the atelier", href: "/admin/custom-orders", icon: Shirt },
    { count: stats.lowStock + stats.outOfStock, label: "products low or out of stock", href: "/admin/products?stock=low", icon: AlertTriangle, warn: true },
    { count: stats.pendingReviews, label: "reviews to moderate", href: "/admin/reviews", icon: Star },
    { count: stats.newMessages, label: "new messages", href: "/admin/messages", icon: Mail },
  ].filter((a) => a.count > 0);

  const dateLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-2">
        <div>
          <p className="text-sm text-mist">{dateLabel}</p>
          <h1 className="type-heading-xl mt-1 text-charcoal">
            {greeting()}, {user?.name.split(" ")[0] ?? "there"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/coupons"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-clay bg-white px-4 text-sm text-charcoal hover:border-charcoal focus-visible:outline-2 focus-visible:outline-gold"
          >
            <Tag width={15} height={15} aria-hidden />
            New coupon
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-charcoal px-4 text-sm font-medium text-ivory hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <PackagePlus width={15} height={15} aria-hidden />
            Add product
          </Link>
        </div>
      </div>

      {/* Headline figures */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="col-span-2 rounded-2xl bg-charcoal p-5 text-ivory shadow-soft xl:col-span-1">
          <p className="text-sm text-ivory/70">Revenue · {thisMonth.label}</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight">{formatINR(thisMonth.revenue)}</p>
          {lastMonth.revenue > 0 ? (
            <p className="mt-2 text-xs text-ivory/70">
              {thisMonth.revenue >= lastMonth.revenue ? "Up" : "Down"}{" "}
              {Math.abs(Math.round(((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100))}% vs {lastMonth.label} (
              {formatINRShort(lastMonth.revenue)})
            </p>
          ) : (
            <p className="mt-2 text-xs text-ivory/70">Excludes cancelled, refunded and returned orders</p>
          )}
        </div>
        {[
          { label: `Orders · ${thisMonth.label}`, value: String(thisMonth.orders), delta: <Delta now={thisMonth.orders} before={lastMonth.orders} period={lastMonth.label} /> },
          { label: "Today", value: formatINR(stats.todayRevenue), delta: <p className="mt-2 text-xs text-mist">{stats.todayOrders} {stats.todayOrders === 1 ? "order" : "orders"} so far</p> },
          { label: "Average order", value: formatINR(avgOrder), delta: <p className="mt-2 text-xs text-mist">{stats.customers} registered {stats.customers === 1 ? "customer" : "customers"}</p> },
        ].map((tile) => (
          <div key={tile.label} className="min-w-0 rounded-2xl border border-clay/60 bg-white p-4 shadow-soft last:col-span-2 sm:p-5 xl:last:col-span-1">
            <p className="text-sm text-mist">{tile.label}</p>
            <p className="mt-2 truncate text-xl font-semibold tracking-tight text-charcoal sm:text-2xl">{tile.value}</p>
            {tile.delta}
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Revenue chart */}
        <Panel title="Revenue · last 7 months" href="/admin/orders" linkLabel="Orders">
          {hasRevenue ? (
            <RevenueChart data={months} />
          ) : (
            <p className="rounded-xl bg-cream/50 p-8 text-center text-sm text-mist">
              No revenue yet. The chart fills in as orders are placed.
            </p>
          )}
        </Panel>

        {/* Needs attention */}
        <Panel title="Needs attention">
          {attention.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-cream/50 p-8 text-center">
              <CheckCircle2 width={22} height={22} className="text-green-800" aria-hidden />
              <p className="text-sm font-medium text-charcoal">All caught up</p>
              <p className="text-xs text-mist">Nothing is waiting on you right now.</p>
            </div>
          ) : (
            <ul className="divide-y divide-clay/50">
              {attention.map((a) => (
                <li key={a.href}>
                  <Link
                    href={a.href}
                    className="group flex min-h-14 items-center gap-3 rounded-lg px-1 hover:bg-cream/50 focus-visible:outline-2 focus-visible:outline-gold"
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        a.warn ? "bg-amber-100 text-amber-900" : "bg-cream text-gold-deep"
                      )}
                    >
                      <a.icon width={16} height={16} aria-hidden />
                    </span>
                    <span className="flex-1 text-sm text-charcoal">
                      <span className="font-semibold tabular-nums">{a.count}</span> {a.label}
                    </span>
                    <ArrowRight width={15} height={15} aria-hidden className="text-taupe transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div>
        {/* Recent orders */}
        <Panel title="Recent orders" href="/admin/orders">
          {recentOrders.length === 0 ? (
            <p className="rounded-xl bg-cream/50 p-8 text-center text-sm text-mist">No orders yet.</p>
          ) : (
            <ul className="-mx-1 divide-y divide-clay/50">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex min-h-14 flex-wrap items-center gap-x-4 gap-y-1 rounded-lg px-1 py-2 hover:bg-cream/50 focus-visible:outline-2 focus-visible:outline-gold"
                  >
                    <span className="min-w-0 flex-1 basis-48">
                      <span className="block text-sm font-medium text-charcoal">
                        {o.id}
                        {o.isCustom && <span className="ml-2 rounded-full bg-cream px-2 py-0.5 text-[0.65rem] font-medium text-gold-deep">Custom</span>}
                      </span>
                      <span className="block truncate text-xs text-mist">
                        {o.customer?.name ?? "Customer"} · {formatDate(o.createdAt)} · {o.items.length} {o.items.length === 1 ? "item" : "items"}
                      </span>
                    </span>
                    <span className="flex basis-full items-center justify-between gap-3 sm:basis-auto sm:justify-end">
                      <StatusBadge status={o.status} />
                      <span className="w-20 text-right text-sm font-medium tabular-nums text-charcoal">{formatINR(o.total)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Stock */}
        <Panel title="Stock to watch" href="/admin/products?stock=low" linkLabel="Inventory">
          {lowStock.length === 0 ? (
            <p className="rounded-xl bg-cream/50 p-8 text-center text-sm text-mist">Every ready-to-ship piece is well stocked.</p>
          ) : (
            <ul className="divide-y divide-clay/50">
              {lowStock.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="flex min-h-14 items-center gap-3 rounded-lg px-1 py-2 hover:bg-cream/50 focus-visible:outline-2 focus-visible:outline-gold"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.images[0]} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-lg bg-cream object-cover" />
                    <span className="min-w-0 flex-1 truncate text-sm text-charcoal">{p.name}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium",
                        p.stock === 0 ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"
                      )}
                    >
                      {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Activity */}
        <Panel title="Recent activity">
          {activity.length === 0 ? (
            <p className="rounded-xl bg-cream/50 p-8 text-center text-sm text-mist">
              New orders, reviews and enquiries will appear here.
            </p>
          ) : (
            <ol className="relative space-y-4 border-l border-clay/70 pl-5">
              {activity.map((n) => (
                <li key={n.id} className="relative">
                  <span aria-hidden className={cn("absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white", n.isRead ? "bg-clay" : "bg-gold")} />
                  {n.link ? (
                    <Link href={n.link} className="text-sm font-medium text-charcoal hover:text-gold-deep">
                      {n.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-charcoal">{n.title}</p>
                  )}
                  <p className="truncate text-xs text-mist">
                    {formatDate(n.createdAt)}
                    {n.body ? ` · ${n.body}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}
