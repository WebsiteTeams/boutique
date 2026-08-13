import type { Metadata } from "next";
import { Shop } from "@/components/shop/Shop";

export const metadata: Metadata = {
  title: "New Arrivals",
  description:
    "Fresh from the UMA collection — the latest sarees, chudithars and designs for the modern woman.",
};

export default function NewArrivalsPage() {
  return (
    <Shop
      title="New Arrivals"
      description="Fresh from the atelier — the newest additions to the collection, ready to become your next favourite."
      onlyNew
    />
  );
}
