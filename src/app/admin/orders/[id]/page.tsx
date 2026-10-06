import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { orderStatusesFor, PAYMENT_STATUSES } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import { getOrderForAdmin } from "@/server/services/orders";
import { ApiError } from "@/server/utils/errors";
import { AdminCard } from "@/components/admin/ui";
import { InlineField, StatusSelect } from "@/components/admin/controls";
import { OrderDetails } from "@/components/order/OrderDetails";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderForAdmin(decodeURIComponent(id)).catch((error) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });
  const endpoint = `/api/admin/orders/${order.id}`;

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-charcoal">
        <ArrowLeft width={14} height={14} />
        All orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="type-heading-lg text-charcoal">{order.id}</h2>
          <p className="mt-1 text-sm text-mist">
            Placed {formatDate(order.createdAt)} · Updated {formatDate(order.updatedAt)}
          </p>
        </div>
        <StatusBadge status={order.status} className="px-4 py-1.5 text-sm" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <AdminCard title="Order Details">
          <OrderDetails order={order} />
        </AdminCard>

        <div className="space-y-6">
          <AdminCard title="Manage">
            <div className="space-y-4 text-sm">
              <label className="flex items-center justify-between gap-3">
                <span className="text-mist">Order status</span>
                <StatusSelect
                  endpoint={endpoint}
                  value={order.status}
                  options={orderStatusesFor(order.isCustom)}
                  label="Order status"
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-mist">Payment status</span>
                <StatusSelect
                  endpoint={endpoint}
                  field="paymentStatus"
                  value={order.paymentStatus}
                  options={PAYMENT_STATUSES}
                  label="Payment status"
                />
              </label>
              <p className="text-xs leading-relaxed text-mist">
                Cancelling or returning an order puts its stock back on sale. Marking a Cash on Delivery
                order as delivered records the payment and awards reward points.
              </p>
            </div>
          </AdminCard>

          <AdminCard title="Customer">
            <p className="text-sm font-medium text-charcoal">{order.customer?.name}</p>
            <p className="text-sm text-mist">{order.customer?.email}</p>
            <p className="mt-3 text-sm text-mist">
              Contact: {order.contact.email} · {order.contact.phone}
            </p>
          </AdminCard>

          <AdminCard title="Internal Notes">
            {order.internalNotes && order.internalNotes.length > 0 ? (
              <ul className="mb-4 space-y-3">
                {order.internalNotes.map((n) => (
                  <li key={n.at} className="rounded-lg bg-cream/60 px-3 py-2.5 text-sm">
                    <p className="text-charcoal">{n.note}</p>
                    <p className="mt-1 text-xs text-mist">
                      {n.by} · {formatDate(n.at)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 text-sm text-mist">No notes yet. Notes are visible to staff only.</p>
            )}
            <InlineField endpoint={endpoint} field="note" label="Internal note" placeholder="Add a note for the team" buttonLabel="Add" clearOnSave />
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
