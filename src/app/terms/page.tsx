import { pageMetadata } from "@/lib/seo";
import { InfoPage } from "@/components/ui/InfoPage";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description: "The terms that apply when you shop with UMA Designers.",
  path: "/terms",
});

const SECTIONS = [
  {
    title: "Products & Pricing",
    body: "Product photography is indicative — slight variations in colour and weave are natural to handcrafted garments. Prices shown are inclusive of all taxes. Offers and discounts apply only to items marked at checkout.",
  },
  {
    title: "Orders & Customisation",
    body: "Custom blouses are made to your measurements and specifications. Please review all details before placing the order, as bespoke pieces cannot be returned or exchanged unless they arrive damaged or defective.",
  },
  {
    title: "Delivery & Returns",
    body: "Standard delivery times are shared at checkout and on your order confirmation. Ready-made garments may be returned within 7 days of delivery, subject to our return policy. Bespoke and personalised items are non-returnable.",
  },
  {
    title: "Intellectual Property",
    body: "All designs, imagery and content on this site belong to UMA Designers and may not be reproduced or used without written permission.",
  },
];

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Terms of Service"
      title="Terms of Service"
      intro="The simple ground rules for shopping with UMA Designers."
    >
      <div className="space-y-10">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="type-heading-md mb-2 text-charcoal">{s.title}</h2>
            <p className="text-sm leading-relaxed text-mist">{s.body}</p>
          </section>
        ))}
      </div>
    </InfoPage>
  );
}
