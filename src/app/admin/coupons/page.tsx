import { formatDate, formatINR } from "@/lib/utils";
import { listCoupons } from "@/server/services/coupons";
import { ActionButton } from "@/components/admin/controls";
import { CouponForm } from "@/components/admin/CouponForm";
import { AdminCard, AdminTable, EmptyRow, PageTitle, Td } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  const coupons = await listCoupons();
  const nowIso = new Date().toISOString();

  return (
    <>
      <PageTitle title="Coupons" description="Coupon rules are applied identically in the cart, at checkout and on the order." />

      <AdminCard title="Create a Coupon" className="mb-6">
        <CouponForm />
      </AdminCard>

      <AdminCard title="All Coupons">
        {coupons.length === 0 ? (
          <EmptyRow>No coupons yet.</EmptyRow>
        ) : (
          <AdminTable head={["Code", "Discount", "Rules", "Used", "Expires", "Status", "Actions"]} minWidth={860}>
            {coupons.map((c) => {
              const expired = Boolean(c.expiresAt && c.expiresAt < nowIso);
              const exhausted = c.usageLimit != null && c.usedCount >= c.usageLimit;
              return (
                <tr key={c.code}>
                  <Td>
                    <span className="font-medium text-charcoal">{c.code}</span>
                    {c.description && <span className="block text-xs text-mist">{c.description}</span>}
                  </Td>
                  <Td className="tabular-nums text-charcoal">{c.type === "percent" ? `${c.value}%` : formatINR(c.value)}</Td>
                  <Td className="text-xs text-mist">
                    {c.minSubtotal > 0 ? `Min ${formatINR(c.minSubtotal)}` : "No minimum"}
                    {c.maxDiscount ? ` · Max ${formatINR(c.maxDiscount)}` : ""}
                  </Td>
                  <Td className="tabular-nums text-mist">
                    {c.usedCount}
                    {c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                  </Td>
                  <Td className="tabular-nums text-mist">{c.expiresAt ? formatDate(c.expiresAt) : "Never"}</Td>
                  <Td>
                    <StatusBadge status={expired ? "Cancelled" : exhausted ? "Closed" : c.isActive ? "Active" : "Inactive"} />
                    {expired && <span className="mt-1 block text-xs text-mist">Expired</span>}
                    {exhausted && !expired && <span className="mt-1 block text-xs text-mist">Limit reached</span>}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <ActionButton
                        endpoint={`/api/admin/coupons/${c.code}`}
                        body={{ isActive: !c.isActive }}
                        success={c.isActive ? "Coupon deactivated" : "Coupon activated"}
                      >
                        {c.isActive ? "Deactivate" : "Activate"}
                      </ActionButton>
                      <ActionButton
                        endpoint={`/api/admin/coupons/${c.code}`}
                        method="DELETE"
                        variant="danger"
                        confirm={`Delete coupon ${c.code}?`}
                        success="Coupon deleted"
                        ariaLabel={`Delete coupon ${c.code}`}
                      >
                        Delete
                      </ActionButton>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </AdminTable>
        )}
      </AdminCard>
    </>
  );
}
