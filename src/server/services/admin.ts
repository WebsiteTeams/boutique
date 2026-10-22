import type { CollectionItem } from "@/types";
import { LOW_STOCK_THRESHOLD } from "@/lib/status";
import {
  Collections,
  ContactMessages,
  CustomBlouses,
  Orders,
  Products,
  Reviews,
  Users,
} from "@/server/db/models";

const NON_REVENUE = ["Cancelled", "Refunded", "Returned"];
const CLOSED = ["Delivered", ...NON_REVENUE];

/** Revenue and order count for orders matching a filter. */
async function revenueOf(match: Record<string, unknown>) {
  const [row] = await Orders.aggregate<{ revenue: number; count: number }>([
    { $match: match },
    { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
  ]);
  return { revenue: row?.revenue ?? 0, count: row?.count ?? 0 };
}

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
  const billable = { status: { $nin: NON_REVENUE } };

  const [all, todayRow, pending, customOpen, low, out, customerCount, pendingReviews, newMessages, monthly] =
    await Promise.all([
      revenueOf(billable),
      revenueOf({ ...billable, createdAt: { $gte: today } }),
      Orders.countDocuments({ status: { $nin: CLOSED } }),
      CustomBlouses.countDocuments({ status: { $nin: ["Delivered", "Cancelled"] } }),
      Products.countDocuments({ isActive: true, deliveryType: "ready", stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }),
      Products.countDocuments({ isActive: true, deliveryType: "ready", stock: 0 }),
      Users.countDocuments({ role: "customer" }),
      Reviews.countDocuments({ status: "Pending" }),
      ContactMessages.countDocuments({ status: "New" }),
      Orders.aggregate<{ _id: string; revenue: number; count: number }>([
        { $match: billable },
        // createdAt is an ISO string, so its first 7 characters are the YYYY-MM month.
        { $group: { _id: { $substrBytes: ["$createdAt", 0, 7] }, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
    ]);

  const monthRows = monthly.map((m) => ({ month: m._id, revenue: m.revenue, count: m.count }));
  const byMonth = new Map(monthRows.map((m) => [m.month, m]));
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
    pendingOrders: pending,
    customOrdersOpen: customOpen,
    lowStock: low,
    outOfStock: out,
    customers: customerCount,
    pendingReviews,
    newMessages,
    revenueByMonth,
  };
}

/* ---------------- Collections ---------------- */

export async function listCollections(includeInactive = false): Promise<CollectionItem[]> {
  const rows = await Collections.find(includeInactive ? {} : { isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  return rows.map((r) => ({
    id: r._id,
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
