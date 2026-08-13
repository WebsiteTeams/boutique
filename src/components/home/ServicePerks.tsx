import { RotateCcw, ShieldCheck, Sprout, Truck } from "lucide-react";

const PERKS = [
  { icon: Truck, title: "Free Delivery", text: "On orders above ₹2,000" },
  { icon: RotateCcw, title: "7-Day Returns", text: "Easy, hassle-free returns" },
  { icon: Sprout, title: "Handloom First", text: "Made by artisans across India" },
  { icon: ShieldCheck, title: "Secure Payments", text: "UPI, cards, net banking & COD" },
];

export function ServicePerks() {
  return (
    <section className="border-y border-clay/50 bg-ivory">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-4 gap-y-8 px-5 py-10 sm:px-8 lg:grid-cols-4 lg:px-10 lg:py-12">
        {PERKS.map((perk) => (
          <div key={perk.title} className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-clay bg-cream/60 text-gold-deep">
              <perk.icon width={19} height={19} strokeWidth={1.5} />
            </span>
            <div>
              <p className="text-sm font-medium text-charcoal">{perk.title}</p>
              <p className="text-xs text-mist">{perk.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
