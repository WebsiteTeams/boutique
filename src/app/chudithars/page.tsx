import type { Metadata } from "next";
import { Shop } from "@/components/shop/Shop";
import { P } from "@/lib/images";

export const metadata: Metadata = {
  title: "Chudithars",
  description:
    "Shop ready-made chudithars in linen, silk, cotton and more — sizes S to XXL, made for the modern woman.",
};

export default function ChuditharsPage() {
  return (
    <Shop
      title="Chudithars"
      description="Ready-made chudithars in crisp linen, flowing silk and breathable cotton — designed to move with your day, sized S to XXL."
      category="chudithars"
      showSizeGuide
      image={P.categories.chudithars}
    />
  );
}
