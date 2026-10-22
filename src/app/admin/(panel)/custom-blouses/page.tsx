import { getBlouseCatalog } from "@/server/services/blouse-catalog";
import { BlouseStudio } from "@/components/admin/BlouseStudio";
import { PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Blouse Designer" };

export default async function AdminCustomBlousesPage() {
  const catalog = await getBlouseCatalog();
  return (
    <>
      <PageTitle
        title="Blouse Designer"
        description="Designs, options and prices for the custom blouse builder. Saved changes apply to new orders straight away; past orders keep the price they were placed at."
      />
      <BlouseStudio initial={catalog} />
    </>
  );
}
