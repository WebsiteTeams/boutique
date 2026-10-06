import { CalendarDays, Clock, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";
import { ContactForm } from "@/components/contact/ContactForm";
import { InfoPage } from "@/components/ui/InfoPage";
import { LinkButton } from "@/components/ui/Button";
import { StylistButton } from "@/components/ui/StylistButton";

export const metadata = pageMetadata({
  title: "Contact",
  description:
    "Get in touch with UMA Designers for styling advice, order help, bespoke blouse enquiries or to book a boutique appointment.",
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
    { icon: Clock, label: "Bespoke Consultations", value: "By appointment", sub: "Book a private slot online" },
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
              <div>
                <p className="text-sm font-medium text-charcoal">{c.label}</p>
                {"href" in c && c.href ? (
                  <a href={c.href} className="mt-0.5 block text-sm text-mist underline-offset-4 hover:underline">
                    {c.value}
                  </a>
                ) : (
                  <p className="mt-0.5 text-sm text-mist">{c.value}</p>
                )}
                <p className="text-xs text-taupe">{c.sub}</p>
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-3 pt-2">
            <StylistButton variant="solid" />
            <LinkButton href="/appointments" variant="outline">
              <CalendarDays width={16} height={16} />
              Book an Appointment
            </LinkButton>
          </div>
        </div>

        <ContactForm />
      </div>
    </InfoPage>
  );
}
