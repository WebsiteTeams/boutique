"use client";

import { InfoPage } from "@/components/ui/InfoPage";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { LinkButton } from "@/components/ui/Button";

const PROCESS = [
  {
    step: "1",
    title: "Request within 7 days",
    text: "Message us from your order confirmation or write to returns@umadesigners.in with your order ID.",
  },
  {
    step: "2",
    title: "Pickup at your door",
    text: "We arrange a free doorstep pickup at a time that suits you, and email the return label.",
  },
  {
    step: "3",
    title: "Inspect & refund",
    text: "Once inspected (within 48 hours of receipt), refunds are initiated to the original payment method in 5–7 business days.",
  },
];

const EXCEPTIONS = [
  "Customised and bespoke blouses are made to order and cannot be returned unless there is a defect or size error on our part.",
  "Items with visible signs of wear, perfume or stains cannot be accepted.",
  "Sarees must be returned in their original packaging with the care card and security tag intact.",
  "Gift cards and downloadable / virtual items are non-refundable.",
];

export default function ReturnsPage() {
  return (
    <InfoPage
      eyebrow="Returns & Exchanges"
      title="Returns Made Simple"
      intro="If something isn't perfect, we'll make it right. 7 days, free pickup, full refund."
    >
      <ol className="mb-12 space-y-4">
        {PROCESS.map((p) => (
          <li key={p.step} className="flex gap-5 rounded-2xl border border-clay/60 bg-white/60 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-charcoal text-sm font-medium text-ivory">
              {p.step}
            </span>
            <div>
              <h2 className="text-base font-medium text-charcoal">{p.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-mist">{p.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mb-12">
        <h2 className="serif-display mb-4 text-xl text-charcoal">What can&apos;t be returned</h2>
        <ul className="space-y-2.5">
          {EXCEPTIONS.map((e) => (
            <li key={e} className="flex items-start gap-2.5 text-sm leading-relaxed text-mist">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-deep" />
              {e}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="serif-display mb-4 text-xl text-charcoal">Common Questions</h2>
        <Accordion>
          {[
            { q: "How long do refunds take?", a: "Once the return is received and inspected, refunds are initiated within 48 hours and reflect in 5–7 business days depending on your bank or UPI provider." },
            { q: "Can I exchange a saree for a different one?", a: "Yes — you can request an exchange for any in-stock item. The replacement ships free once the original is picked up." },
            { q: "What if my custom blouse doesn't fit?", a: "We guarantee the fit of bespoke pieces. If it doesn't fit based on the measurements you shared, we'll alter or remake it at no charge." },
            { q: "My item arrived damaged. What now?", a: "We're so sorry — send us photos within 48 hours and we'll replace it or issue a full refund immediately." },
          ].map((f) => (
            <AccordionItem key={f.q} title={f.q}>
              <p className="text-sm leading-relaxed text-mist">{f.a}</p>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <div className="mt-10 rounded-2xl bg-charcoal p-7 text-center">
        <h2 className="serif-display text-xl text-ivory">Ready to start a return?</h2>
        <p className="mt-1.5 text-sm text-mist">Write to us with your order ID and we&apos;ll take it from there.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <LinkButton href="/contact" variant="gold" size="sm">
            Contact Support
          </LinkButton>
          <LinkButton href="/orders" variant="dark-ghost" size="sm">
            View My Orders
          </LinkButton>
        </div>
      </div>
    </InfoPage>
  );
}
