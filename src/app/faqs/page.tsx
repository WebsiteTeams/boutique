import { pageMetadata } from "@/lib/seo";
import { InfoPage } from "@/components/ui/InfoPage";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";

export const metadata = pageMetadata({
  title: "FAQs",
  description: "Answers about ordering, payment, sizing, custom blouses, delivery and returns at UMA Designers.",
  path: "/faqs",
});

const GROUPS = [
  {
    category: "Orders & Payment",
    items: [
      { q: "How do I place an order?", a: "Add pieces to your bag, proceed to checkout, enter your delivery address and choose a payment method — UPI, card, net banking or cash on delivery. You'll get a confirmation by email and SMS." },
      { q: "Which payment methods do you accept?", a: "UPI (GPay, PhonePe, Paytm), all major credit and debit cards, net banking and Cash on Delivery. All online payments are processed on a 256-bit encrypted gateway." },
      { q: "Is Cash on Delivery available?", a: "Yes, for orders up to ₹10,000. A nominal convenience fee may apply for larger COD amounts." },
      { q: "Can I modify or cancel my order?", a: "You can cancel within 12 hours of placing the order with a full refund. Once tailoring or packing begins, cancellation isn't possible — but you can still return unused items." },
    ],
  },
  {
    category: "Products & Sizing",
    items: [
      { q: "How do saree sizes work?", a: "Sarees are one-size and generally 6.2m long with a blouse piece included. Pre-stitched sarees mention their size on the product page." },
      { q: "How do I find my chudithar size?", a: "Use our size guide on the chudithar pages — it maps your bust, waist, hip and shoulder measurements to sizes S through XXL." },
      { q: "What's a custom blouse like?", a: "Choose neck, sleeve, back, embroidery, border and stitching, share your measurements (and optionally a reference photo), and our tailors stitch it to fit you in about 12 days." },
      { q: "Are the fabrics genuine?", a: "Yes. Every product page lists the exact fabric and weaving cluster (Kanchipuram, Chanderi, Pochampally, etc.), and each piece ships with a care card." },
    ],
  },
  {
    category: "Delivery & Returns",
    items: [
      { q: "How long does delivery take?", a: "Metro cities: 2–4 working days. Rest of India: 4–7 working days. Custom blouses take ~12 working days as they're made to order." },
      { q: "Is delivery free?", a: "Standard delivery is free on orders above ₹2,000. Below that, a flat ₹99 delivery fee applies." },
      { q: "How do returns work?", a: "Request a return within 7 days, we pick the item up free and refund you in 5–7 business days. Bespoke blouses are only returnable if there's a defect or size error on our side." },
      { q: "Do you deliver internationally?", a: "Not yet — we ship across India. We're exploring international shipping and will announce it here first." },
    ],
  },
  {
    category: "The Boutique",
    items: [
      { q: "Can I visit the boutique?", a: "Yes — we're at #12, Boutique Lane, T Nagar, Chennai 600017, open 10 AM to 8:30 PM every day. Walk in any time, or message us first and a stylist will be ready for you." },
      { q: "Do you offer trousseau styling?", a: "We do. Get in touch to arrange a trousseau consultation and our stylists will curate a full wedding wardrobe for you, including bespoke blouses for every saree." },
      { q: "Can I gift a UMA piece?", a: "Absolutely — every order arrives in signature gift-ready packaging. You can also add a handwritten note at checkout." },
    ],
  },
];

export default function FaqsPage() {
  return (
    <InfoPage
      eyebrow="Help Center"
      title="Frequently Asked Questions"
      intro="Everything about ordering, sizing, delivery and returns — if you can't find an answer, we're one message away."
    >
      {GROUPS.map((g) => (
        <section key={g.category} className="mb-10 last:mb-0">
          <h2 className="type-heading-md mb-3 text-charcoal">{g.category}</h2>
          <Accordion>
            {g.items.map((f) => (
              <AccordionItem key={f.q} title={f.q}>
                <p className="text-sm leading-relaxed text-mist">{f.a}</p>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}

      <p className="mt-10 rounded-2xl bg-cream/70 p-5 text-center text-sm text-mist">
        Still stuck? Reach us at{" "}
        <a href="mailto:hello@umadesigners.in" className="font-medium text-charcoal underline underline-offset-4">
          hello@umadesigners.in
        </a>{" "}
        or message us from the contact page.
      </p>
    </InfoPage>
  );
}
