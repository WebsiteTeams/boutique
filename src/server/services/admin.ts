import { and, asc, eq, gte, inArray, notInArray, sql } from "drizzle-orm";
import type { CollectionItem } from "@/types";
import { LOW_STOCK_THRESHOLD } from "@/lib/status";
import { db } from "@/server/db/client";
import {
  appointments,
  collections,
  contactMessages,
  customBlouses,
  orders,
  products,
  reviews,
  users,
} from "@/server/db/schema";

const NON_REVENUE = ["Cancelled", "Refunded", "Returned"];
const CLOSED = ["Delivered", ...NON_REVENUE];

const count = sql<number>`count(*)`;
const revenue = sql<number>`coalesce(sum(${orders.total}), 0)`;

/** Start of the given day (local server time) as an ISO string. */
function startOfDay(offsetDays = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

export interface DashboardStats {
  todayRevenue: number;
  totalRevenue: number;
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  customOrdersOpen: number;
  upcomingAppointments: number;
  pendingAppointments: number;
  lowStock: number;
  outOfStock: number;
  customers: number;
  pendingReviews: number;
  newMessages: number;
  revenueByMonth: { month: string; label: string; revenue: number; orders: number }[];
}

/** Every figure on the admin dashboard is computed from live database rows. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const today = startOfDay();
  const billable = notInArray(orders.status, NON_REVENUE);
  const todayDate = new Date().toISOString().slice(0, 10);

  const [
    [all],
    [todayRow],
    [pending],
    [customOpen],
    [upcoming],
    [pendingAppts],
    [low],
    [out],
    [customerCount],
    [pendingReviews],
    [newMessages],
    monthly,
  ] = await Promise.all([
    db.select({ revenue, count }).from(orders).where(billable),
    db.select({ revenue, count }).from(orders).where(and(billable, gte(orders.createdAt, today))),
    db.select({ count }).from(orders).where(notInArray(orders.status, CLOSED)),
    db.select({ count }).from(customBlouses).where(notInArray(customBlouses.status, ["Delivered", "Cancelled"])),
    db
      .select({ count })
      .from(appointments)
      .where(and(gte(appointments.date, todayDate), inArray(appointments.status, ["Pending", "Confirmed", "Rescheduled"]))),
    db.select({ count }).from(appointments).where(eq(appointments.status, "Pending")),
    db
      .select({ count })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          eq(products.deliveryType, "ready"),
          sql`${products.stock} > 0 and ${products.stock} <= ${LOW_STOCK_THRESHOLD}`
        )
      ),
    db
      .select({ count })
      .from(products)
      .where(and(eq(products.isActive, true), eq(products.deliveryType, "ready"), eq(products.stock, 0))),
    db.select({ count }).from(users).where(eq(users.role, "customer")),
    db.select({ count }).from(reviews).where(eq(reviews.status, "Pending")),
    db.select({ count }).from(contactMessages).where(eq(contactMessages.status, "New")),
    db
      .select({ month: sql<string>`substr(${orders.createdAt}, 1, 7)`, revenue, count })
      .from(orders)
      .where(billable)
      .groupBy(sql`substr(${orders.createdAt}, 1, 7)`),
  ]);

  const byMonth = new Map(monthly.map((m) => [m.month, m]));
  const revenueByMonth = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (6 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const row = byMonth.get(key);
    return {
      month: key,
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      revenue: row?.revenue ?? 0,
      orders: row?.count ?? 0,
    };
  });

  return {
    todayRevenue: todayRow.revenue,
    totalRevenue: all.revenue,
    totalOrders: all.count,
    todayOrders: todayRow.count,
    pendingOrders: pending.count,
    customOrdersOpen: customOpen.count,
    upcomingAppointments: upcoming.count,
    pendingAppointments: pendingAppts.count,
    lowStock: low.count,
    outOfStock: out.count,
    customers: customerCount.count,
    pendingReviews: pendingReviews.count,
    newMessages: newMessages.count,
    revenueByMonth,
  };
}

/* ---------------- Collections ---------------- */

export async function listCollections(includeInactive = false): Promise<CollectionItem[]> {
  const rows = await db
    .select()
    .from(collections)
    .where(includeInactive ? undefined : eq(collections.isActive, true))
    .orderBy(asc(collections.sortOrder), asc(collections.name));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    image: r.image,
    accent: r.accent ?? undefined,
  }));
}

export async function getCollection(id: string): Promise<CollectionItem | null> {
  return (await listCollections()).find((c) => c.id === id) ?? null;
}
