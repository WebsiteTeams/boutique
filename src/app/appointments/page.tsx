import { Clock, MapPin, Sparkles } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { InfoPage } from "@/components/ui/InfoPage";
import { StylistButton } from "@/components/ui/StylistButton";

export const metadata = pageMetadata({
  title: "Book a Boutique Appointment",
  description:
    "Reserve a private appointment at the UMA Designers boutique for bridal styling, custom blouse fittings, saree selection or a designer consultation.",
  path: "/appointments",
});

export default function AppointmentsPage() {
  return (
    <InfoPage
      eyebrow="Private Appointments"
      title="Visit the Boutique"
      intro="An unhurried hour with our stylists — for bridal trousseaux, blouse fittings, saree selection or a designer consultation."
    >
      <div className="mb-10 grid gap-5 sm:grid-cols-3">
        {[
          { icon: MapPin, label: "Where", value: siteConfig.address },
          { icon: Clock, label: "Hours", value: siteConfig.hours },
          { icon: Sparkles, label: "What to expect", value: "A dedicated stylist, curated pieces and fabric swatches ready for you" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-clay/60 bg-white/60 p-5">
            <item.icon width={18} height={18} className="text-gold-deep" />
            <p className="mt-3 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-charcoal/70">{item.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-mist">{item.value}</p>
          </div>
        ))}
      </div>

      <AppointmentForm />

      <div className="mt-10 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-mist">Need help choosing an outfit? Chat with our stylist.</p>
        <StylistButton />
      </div>
    </InfoPage>
  );
}
