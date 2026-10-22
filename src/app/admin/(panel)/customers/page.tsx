import { formatDate, formatINR, getInitials } from "@/lib/utils";
import { listCustomers } from "@/server/services/account";
import { AdminCard, AdminTable, EmptyRow, PageTitle, Td } from "@/components/admin/ui";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  const customers = await listCustomers();

  return (
    <>
      <PageTitle title="Customers" description={`${customers.length} registered customer${customers.length === 1 ? "" : "s"}.`} />
      <AdminCard>
        {customers.length === 0 ? (
          <EmptyRow>No customers have registered yet.</EmptyRow>
        ) : (
          <AdminTable head={["Customer", "Phone", "City", "Orders", "Lifetime Spend", "Points", "Joined"]} minWidth={820}>
            {customers.map((c) => (
              <tr key={c.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-charcoal text-xs font-medium text-ivory">
                      {getInitials(c.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-charcoal">{c.name}</span>
                      <span className="block truncate text-xs text-mist">{c.email}</span>
                    </span>
                  </div>
                </Td>
                <Td className="tabular-nums text-mist">{c.phone || "—"}</Td>
                <Td className="text-mist">{c.city || "—"}</Td>
                <Td className="tabular-nums text-charcoal">{c.orderCount}</Td>
                <Td className="tabular-nums text-charcoal">{formatINR(c.spent)}</Td>
                <Td className="tabular-nums text-mist">{c.loyaltyPoints}</Td>
                <Td className="tabular-nums text-mist">{formatDate(c.createdAt)}</Td>
              </tr>
            ))}
          </AdminTable>
        )}
      </AdminCard>
    </>
  );
}
