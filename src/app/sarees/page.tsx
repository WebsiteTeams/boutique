import type { Metadata } from "next";
import { Shop } from "@/components/shop/Shop";

export const metadata: Metadata = {
  title: "Sarees",
  description:
    "Shop handwoven silk, handloom, cotton and designer sarees — curated by UMA Designers for every occasion.",
};

export default function SareesPage() {
  return (
    <Shop
      title="Sarees"
      description="Handwoven silks, feather-light handlooms and designer drapes — a considered edit for weddings, festive evenings and every day in between."
      category="sarees"
    />
  );
}
