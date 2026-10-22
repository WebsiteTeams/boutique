import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";
import { ContactForm } from "@/components/contact/ContactForm";
import { InfoPage } from "@/components/ui/InfoPage";
import { StylistButton } from "@/components/ui/StylistButton";

export const metadata = pageMetadata({
  title: "Contact",
  description:
    "Get in touch with UMA Designers for styling advice, order help, bespoke blouse enquiries or a boutique visit.",
  path: "/contact",
});

export default function ContactPage() {
  const details = [
    { icon: MapPin, label: "Visit the Boutique", value: siteConfig.address, sub: siteConfig.hours },
    ...(siteConfig.phone
      ? [{ icon: Phone, label: "Call Us", value: siteConfig.phone, sub: "Mon–Sat, 10 AM – 7 PM", href: siteConfig.phoneHref }]
      : []),
    {
      icon: Mail,
      label: "Email",
      value: siteConfig.email,
      sub: `${siteConfig.ordersEmail} for orders`,
      href: `mailto:${siteConfig.email}`,
    },
    { icon: Clock, label: "Boutique Hours", value: "10 AM – 8:30 PM", sub: "Open every day" },
  ];

  return (
    <InfoPage
      eyebrow="Get in Touch"
      title="We'd Love to Hear From You"
      intro="Styling advice, order help or bespoke enquiries — our atelier team replies within 24 hours."
    >
      <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
        <div className="space-y-5">
          {details.map((c) => (
            <div key={c.label} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream text-gold-deep">
                <c.icon width={18} height={18} />
              </span>
              <div className="min-w-0">
                <h2 className="text-[0.95rem] font-medium text-charcoal">{c.label}</h2>
                {"href" in c && c.href ? (
                  <a href={c.href} className="mt-0.5 inline-flex min-h-8 items-center break-all text-[0.95rem] text-charcoal/80 underline-offset-4 hover:underline">
                    {c.value}
                  </a>
                ) : (
                  <p className="mt-0.5 text-[0.95rem] text-charcoal/80">{c.value}</p>
                )}
                <p className="text-sm text-mist">{c.sub}</p>
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-3 pt-2">
            <StylistButton variant="solid" />
          </div>
        </div>

        <ContactForm />
      </div>
    </InfoPage>
  );
}
