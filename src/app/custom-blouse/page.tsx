import { Suspense } from "react";
import { CustomBlouseBuilder } from "@/components/custom-blouse/CustomBlouseBuilder";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Custom Blouse",
  description:
    "Design your perfect blouse — choose neckline, sleeves, back, embroidery and finish, then let our master tailors stitch it to your measurements.",
  path: "/custom-blouse",
  image: "/images/custom-blouse-feature.png",
});

export default function CustomBlousePage() {
  return (
    <>
      <header className="border-b border-clay/50 bg-cream/50">
        <div className="mx-auto max-w-5xl px-5 pb-10 pt-32 text-center sm:px-8 lg:pt-20 lg:pb-14">
          <p className="eyebrow mb-3 text-gold-deep">Bespoke Atelier</p>
          <h1 className="type-display-lg text-charcoal">
            Design Your Perfect Blouse
          </h1>
          <p className="mx-auto mt-4 max-w-xl type-body text-mist">
            A four-step tailoring experience — from your first idea to a blouse stitched
            to your exact measurements by master hands.
          </p>
        </div>
      </header>

      <Suspense>
        <CustomBlouseBuilder />
      </Suspense>
    </>
  );
}
