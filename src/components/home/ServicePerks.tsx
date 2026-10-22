import type { LucideIcon } from "lucide-react";
import { RotateCcw, ShieldCheck, Sprout, Truck } from "lucide-react";

type Perk = { icon: LucideIcon; title: string; text: string };

const PERKS: Perk[] = [
  { icon: Truck, title: "Free Delivery", text: "On orders above ₹2,000" },
  { icon: RotateCcw, title: "7-Day Returns", text: "Easy, hassle-free returns" },
  { icon: Sprout, title: "Handloom First", text: "Made by artisans across India" },
  { icon: ShieldCheck, title: "Secure Payments", text: "UPI, cards, net banking & COD" },
];

export function ServicePerks() {
  return (
    <section className="border-y border-clay/50 bg-ivory" aria-label="Why shop with UMA">
      <ul className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-4 gap-y-6 px-5 py-8 sm:gap-x-6 sm:px-8 md:py-10 lg:grid-cols-4 lg:px-10 lg:py-12">
        {PERKS.map((perk) => (
          <li key={perk.title} className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-clay bg-cream/60 text-gold-deep sm:h-11 sm:w-11">
              <perk.icon width={18} height={18} strokeWidth={1.5} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-charcoal">{perk.title}</p>
              <p className="text-xs leading-snug text-mist">{perk.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
