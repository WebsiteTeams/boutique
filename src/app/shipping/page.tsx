import { pageMetadata } from "@/lib/seo";
import { Package, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import { InfoPage } from "@/components/ui/InfoPage";
import { FREE_DELIVERY_THRESHOLD, SHIPPING_FEE } from "@/lib/pricing";
import { formatINR } from "@/lib/utils";

export const metadata = pageMetadata({
  title: "Shipping Information",
  description: "Delivery times, charges and dispatch details for UMA Designers orders across India.",
  path: "/shipping",
});

const FEATURES = [
  {
    icon: Truck,
    title: "Pan-India Delivery",
    text: "Standard shipping reaches metros in 2–4 working days and everywhere else in 4–7. Courier tracking is shared on email & SMS.",
  },
  {
    icon: Package,
    title: "Gift-Ready Packaging",
    text: "Every order arrives in our signature box with tissue wrap and a care card — ready to gift straight from the parcel.",
  },
  {
    icon: ShieldCheck,
    title: "Insured & Secure",
    text: "All shipments are insured against transit damage. If something arrives imperfect, we replace or refund it.",
  },
  {
    icon: RefreshCcw,
    title: "Hassle-Free Returns",
    text: "Change your mind? Request a return within 7 days. Pickup is arranged from your doorstep.",
  },
];

export default function ShippingPage() {
  return (
    <InfoPage
      eyebrow="Shipping & Delivery"
      title="How We Deliver"
      intro="Transparent shipping, careful packing and delivery tracking on every single order."
    >
      <div className="mb-12 grid gap-5 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-clay/60 bg-white/60 p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream text-gold-deep">
              <f.icon width={18} height={18} />
            </span>
            <h2 className="mt-4 text-base font-medium text-charcoal">{f.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-mist">{f.text}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-clay/60 bg-white/60 p-6 sm:p-7">
        <h2 className="type-heading-md mb-5 text-charcoal">Delivery Charges</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-left text-sm">
            <thead>
              <tr className="border-b border-clay/60 text-xs uppercase tracking-[0.14em] text-taupe">
                <th className="pb-3 font-medium">Method</th>
                <th className="pb-3 font-medium">ETA</th>
                <th className="pb-3 font-medium">Cost</th>
                <th className="pb-3 font-medium">Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clay/40 text-mist">
              <tr>
                <td className="py-3 font-medium text-charcoal">Standard</td>
                <td className="py-3">2–4 working days</td>
                <td className="py-3">
                  Free over {formatINR(FREE_DELIVERY_THRESHOLD)} · else {formatINR(SHIPPING_FEE)}
                </td>
                <td className="py-3">Yes</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-charcoal">Express</td>
                <td className="py-3">1–2 working days</td>
                <td className="py-3">₹249 flat</td>
                <td className="py-3">Yes</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-charcoal">Boutique Pickup</td>
                <td className="py-3">Ready in 3 days</td>
                <td className="py-3">Free</td>
                <td className="py-3">Ready SMS</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-charcoal">Bespoke Blouse</td>
                <td className="py-3">12 working days</td>
                <td className="py-3">Included in price</td>
                <td className="py-3">Stage updates</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-taupe">
          Pincodes are validated at checkout. We dispatch all ready items within 24 hours of
          order confirmation.
        </p>
      </section>
    </InfoPage>
  );
}
