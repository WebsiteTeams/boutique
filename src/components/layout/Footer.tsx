"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { GENERAL_STYLIST_MESSAGE, siteConfig, whatsappLink } from "@/lib/config";
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
    

      {/* Link columns */}
      <nav aria-label="Footer" className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-10 lg:py-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Logo dark />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ivory/70">
              A design-led boutique for sarees, chudithars and made-to-measure
              blouses — woven for the modern Indian woman.
            </p>
            <div className="mt-6 space-y-1 text-sm text-ivory/70">
              <p className="flex min-h-10 items-center gap-3">
                <MapPin width={15} height={15} className="shrink-0 text-gold-soft" aria-hidden />
                {siteConfig.address}
              </p>
              {siteConfig.phone && (
                <a
                  href={siteConfig.phoneHref}
                  className="flex min-h-10 w-fit items-center gap-3 transition-colors hover:text-ivory"
                >
                  <Phone width={15} height={15} className="shrink-0 text-gold-soft" aria-hidden />
                  {siteConfig.phone}
                </a>
              )}
              <a
                href={`mailto:${siteConfig.email}`}
                className="flex min-h-10 w-fit items-center gap-3 break-all transition-colors hover:text-ivory"
              >
                <Mail width={15} height={15} className="shrink-0 text-gold-soft" aria-hidden />
                {siteConfig.email}
              </a>
            </div>
          </div>

          {LINK_GROUPS.map((group) => (
            <div key={group.heading}>
              <h2 className="eyebrow mb-3 text-gold-soft">{group.heading}</h2>
              <ul>
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-9 items-center text-sm text-ivory/70 transition-colors duration-200 hover:text-ivory"
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
              <h2 className="eyebrow mb-3 text-gold-soft">Social</h2>
              <ul>
                {SOCIALS.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 items-center gap-3 text-sm text-ivory/70 transition-colors duration-200 hover:text-ivory"
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
      </nav>

      {/* Bottom bar */}
      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-5 py-6 sm:flex-row sm:px-8 lg:px-10">
          <p className="text-xs text-ivory/60">
            © {new Date().getFullYear()} UMA Designers. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
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
