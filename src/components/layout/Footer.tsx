"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { GENERAL_STYLIST_MESSAGE, siteConfig, whatsappLink } from "@/lib/config";
import { Newsletter } from "@/components/ui/Newsletter";
import {
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
} from "@/components/ui/SocialIcons";

const LINK_GROUPS = [
  {
    heading: "Shop",
    links: [
      { label: "Sarees", href: "/sarees" },
      { label: "Chudithars", href: "/chudithars" },
      { label: "Custom Blouse", href: "/custom-blouse" },
      { label: "Collections", href: "/collections" },
      { label: "New Arrivals", href: "/new-arrivals" },
    ],
  },
  {
    heading: "About",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Book an Appointment", href: "/appointments" },
      { label: "Size Guide", href: "/size-guide" },
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "FAQ", href: "/faqs" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Order Tracking", href: "/orders" },
    ],
  },
];

// Only links that are actually configured are rendered — never a dead "#".
const SOCIALS = [
  { label: "Instagram", href: siteConfig.social.instagram, icon: InstagramIcon },
  { label: "Facebook", href: siteConfig.social.facebook, icon: FacebookIcon },
  { label: "WhatsApp", href: whatsappLink(GENERAL_STYLIST_MESSAGE) ?? "", icon: WhatsAppIcon },
].filter((s) => s.href);

export function Footer() {
  return (
    <footer className="bg-charcoal text-ivory">
      {/* Newsletter band */}
      <div className="border-b border-ivory/10">
        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <Newsletter dark />
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Logo dark />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-ivory/60">
              A design-led boutique for sarees, chudithars and made-to-measure
              blouses — woven for the modern Indian woman.
            </p>
            <div className="mt-7 space-y-3 text-sm text-ivory/60">
              <p className="flex items-center gap-3">
                <MapPin width={15} height={15} className="text-gold-soft" />
                {siteConfig.address}
              </p>
              {siteConfig.phone && (
                <a
                  href={siteConfig.phoneHref}
                  className="flex items-center gap-3 transition-colors hover:text-ivory"
                >
                  <Phone width={15} height={15} className="text-gold-soft" />
                  {siteConfig.phone}
                </a>
              )}
              <a
                href={`mailto:${siteConfig.email}`}
                className="flex items-center gap-3 transition-colors hover:text-ivory"
              >
                <Mail width={15} height={15} className="text-gold-soft" />
                {siteConfig.email}
              </a>
            </div>
          </div>

          {LINK_GROUPS.map((group) => (
            <div key={group.heading}>
              <h3 className="eyebrow mb-5 text-gold-soft">{group.heading}</h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ivory/60 transition-colors hover:text-ivory"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {SOCIALS.length > 0 && (
            <div>
              <h3 className="eyebrow mb-5 text-gold-soft">Social</h3>
              <ul className="space-y-3">
                {SOCIALS.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 text-sm text-ivory/60 transition-colors hover:text-ivory"
                    >
                      <s.icon size={16} className="text-gold-soft" />
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-5 py-6 sm:flex-row sm:px-8 lg:px-10">
          <p className="text-xs text-ivory/60">
            © {new Date().getFullYear()} UMA Designers. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {["UPI", "VISA", "Mastercard", "COD"].map((p) => (
              <span
                key={p}
                className="rounded border border-ivory/15 px-2 py-1 text-[0.6rem] uppercase tracking-wider text-ivory/70"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
