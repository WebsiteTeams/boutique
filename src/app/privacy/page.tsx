import { pageMetadata } from "@/lib/seo";
import { InfoPage } from "@/components/ui/InfoPage";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How UMA Designers collects, uses and protects your personal information.",
  path: "/privacy",
});

const SECTIONS = [
  {
    title: "What We Collect",
    body: "We collect the information you share with us directly — your name, delivery address, phone number and email address at checkout, along with the measurements you provide for bespoke blouses. We also collect anonymous browsing data to understand how the boutique is used and to keep it fast and reliable.",
  },
  {
    title: "How We Use It",
    body: "Your details are used to process and deliver orders, confirm custom-blouse specifications, respond to enquiries and — only when you subscribe — to send collection news. We never sell, rent or trade your personal information to third parties.",
  },
  {
    title: "Payments & Security",
    body: "Payments are processed by trusted payment gateways with industry-standard encryption. UMA Designers never stores your card details. Our site is served over a secure connection at all times.",
  },
  {
    title: "Your Choices",
    body: "You may unsubscribe from marketing emails at any time, or write to hello@umadesigners.in to request a copy of, correction to, or deletion of the data we hold about you.",
  },
];

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Privacy Policy"
      title="Your Privacy, Respected"
      intro="A short, plain-language account of how UMA Designers handles your information."
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
