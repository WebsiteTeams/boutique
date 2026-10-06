import { getLoyaltySettings } from "@/server/services/loyalty";
import { LoyaltyForm } from "@/components/admin/LoyaltyForm";
import { AdminCard, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Rewards" };

export default async function AdminRewardsPage() {
  const settings = await getLoyaltySettings();
  return (
    <>
      <PageTitle
        title="UMA Rewards"
        description="Loyalty rules live here — customer accounts and order processing read them from this configuration."
      />
      <AdminCard>
        <LoyaltyForm settings={settings} />
      </AdminCard>
    </>
  );
}
