import Link from "next/link";
import { ALL_ORDER_STATUSES, paymentMethodLabel } from "@/lib/status";
import { formatDate, formatINR } from "@/lib/utils";
import { listAllOrders } from "@/server/services/orders";
import { AdminCard, AdminTable, EmptyRow, FilterTabs, PageTitle, Td } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = status && ALL_ORDER_STATUSES.includes(status) ? status : undefined;
  const orders = await listAllOrders({ status: filter });

  return (
    <>
      <PageTitle title="Orders" description="Every order placed on the storefront." />
      <FilterTabs basePath="/admin/orders" current={filter} options={ALL_ORDER_STATUSES} />
      <AdminCard>
        {orders.length === 0 ? (
          <EmptyRow>No orders{filter ? ` with status “${filter}”` : ""} yet.</EmptyRow>
        ) : (
          <AdminTable head={["Order", "Placed", "Customer", "Items", "Total", "Payment", "Status"]} minWidth={860}>
            {orders.map((o) => (
              <tr key={o.id}>
                <Td>
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-charcoal underline-offset-4 hover:underline">
                    {o.id}
                  </Link>
                  {o.isCustom && <span className="ml-2 text-[0.65rem] uppercase tracking-wide text-gold-deep">Bespoke</span>}
                </Td>
                <Td className="tabular-nums text-mist">{formatDate(o.createdAt)}</Td>
                <Td>
                  <span className="block text-charcoal">{o.customer?.name}</span>
                  <span className="block text-xs text-mist">{o.customer?.email}</span>
                </Td>
                <Td className="max-w-[220px] truncate text-mist">
                  {o.items[0]?.name}
                  {o.items.length > 1 ? ` +${o.items.length - 1}` : ""}
                </Td>
                <Td className="tabular-nums text-charcoal">{formatINR(o.total)}</Td>
                <Td>
                  <span className="block text-xs text-mist">{paymentMethodLabel(o.paymentMethod)}</span>
                  <StatusBadge status={o.paymentStatus} />
                </Td>
                <Td>
                  <StatusBadge status={o.status} />
                </Td>
              </tr>
            ))}
          </AdminTable>
        )}
      </AdminCard>
    </>
  );
}
