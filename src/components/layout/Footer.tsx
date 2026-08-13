"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Newsletter } from "@/components/ui/Newsletter";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/ui/SocialIcons";

const LINK_GROUPS = [
  {
    heading: "Shop",
    links: [
      { label: "Sarees", href: "/sarees" },
      { label: "Chudithars", href: "/chudithars" },
      { label: "Custom Blouse", href: "/custom-blouse" },
      { label: "New Arrivals", href: "/new-arrivals" },
      { label: "Collections", href: "/collections" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
    ],
  },
  {
    heading: "Customer Care",
    links: [
      { label: "FAQs", href: "/faqs" },
      { label: "Size Guide", href: "/size-guide" },
      { label: "Order Tracking", href: "/orders" },
      { label: "Bespoke Blouse", href: "/custom-blouse" },
    ],
  },
];

const SOCIALS = [
  { label: "Instagram", href: "#", icon: InstagramIcon },
  { label: "Facebook", href: "#", icon: FacebookIcon },
  { label: "YouTube", href: "#", icon: YoutubeIcon },
];

export function Footer() {
  return (
    <footer className="mt-20 bg-charcoal text-ivory">
      {/* Newsletter band */}
      <div className="border-b border-ivory/10">
        <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-10 lg:py-16">
          <Newsletter dark />
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-10 lg:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-5">
          <div className="col-span-2">
            <Logo dark />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ivory/60">
              A design-led boutique for sarees, chudithars and made-to-measure
              blouses — woven for the modern Indian woman.
            </p>
            <div className="mt-6 space-y-2 text-sm text-ivory/60">
              <p className="flex items-center gap-3">
                <MapPin width={15} height={15} className="text-gold-soft" />
                #12, Boutique Lane, T Nagar, Chennai 600017
              </p>
              <a href="tel:+919876543210" className="flex items-center gap-3 transition-colors hover:text-ivory">
                <Phone width={15} height={15} className="text-gold-soft" />
                +91 98765 43210
              </a>
              <a href="mailto:hello@umadesigners.in" className="flex items-center gap-3 transition-colors hover:text-ivory">
                <Mail width={15} height={15} className="text-gold-soft" />
                hello@umadesigners.in
              </a>
            </div>
          </div>

          {LINK_GROUPS.map((group) => (
            <div key={group.heading}>
              <h4 className="eyebrow mb-4 text-gold-soft">{group.heading}</h4>
              <ul className="space-y-2.5">
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
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-5 py-6 sm:flex-row sm:px-8 lg:px-10">
          <p className="text-xs text-ivory/40">
            © {new Date().getFullYear()} UMA Designers. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="text-ivory/50 transition-colors hover:text-gold-soft"
              >
                <s.icon width={18} height={18} />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {["UPI", "VISA", "Mastercard", "COD"].map((p) => (
              <span
                key={p}
                className="rounded border border-ivory/15 px-2 py-1 text-[0.6rem] uppercase tracking-wider text-ivory/50"
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
