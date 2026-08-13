import type { Metadata } from "next";
import { CustomBlouseBuilder } from "@/components/custom-blouse/CustomBlouseBuilder";

export const metadata: Metadata = {
  title: "Custom Blouse",
  description:
    "Design your perfect blouse — choose neckline, sleeves, back, embroidery and finish, then let our master tailors stitch it to your measurements.",
};

export default function CustomBlousePage() {
  return (
    <>
      <header className="border-b border-clay/50 bg-cream/50">
        <div className="mx-auto max-w-5xl px-5 pb-10 pt-32 text-center sm:px-8 lg:pt-20 lg:pb-14">
          <p className="eyebrow mb-3 text-gold-deep">Bespoke Atelier</p>
          <h1 className="serif-display text-4xl text-charcoal sm:text-5xl lg:text-6xl">
            Design Your Perfect Blouse
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[0.95rem] leading-relaxed text-mist">
            A four-step tailoring experience — from your first idea to a blouse stitched
            to your exact measurements by master hands.
          </p>
        </div>
      </header>

      <CustomBlouseBuilder />
    </>
  );
}
