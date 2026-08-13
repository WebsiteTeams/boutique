"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Sarees", href: "/sarees" },
  { label: "Chudithars", href: "/chudithars" },
  { label: "Custom Blouse", href: "/custom-blouse" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Collections", href: "/collections" },
  { label: "About", href: "/about" },
  { label: "Track Orders", href: "/orders" },
];

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col overflow-y-auto bg-ivory"
            aria-label="Mobile menu"
          >
            <div className="flex items-center justify-between border-b border-clay/60 px-6 py-5">
              <Logo compact />
              <button
                onClick={onClose}
                className="rounded-full p-2 text-charcoal transition-colors hover:bg-sand/50"
                aria-label="Close menu"
              >
                <X width={22} height={22} />
              </button>
            </div>

            <nav className="flex flex-col px-6 py-6">
              {LINKS.map((link, i) => {
                const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 * i + 0.1, duration: 0.35 }}
                  >
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={cn(
                        "group flex items-center justify-between border-b border-clay/40 py-4 text-base font-medium transition-colors",
                        active ? "text-gold-deep" : "text-charcoal"
                      )}
                    >
                      {link.label}
                      <ArrowRight
                        width={16}
                        height={16}
                        className="text-charcoal/30 transition-transform group-hover:translate-x-1"
                      />
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <div className="mt-auto px-6 pb-10">
              <div className="rounded-xl bg-cream p-5">
                <p className="serif-display text-lg text-charcoal">
                  Need help with your order?
                </p>
                <p className="mt-1 text-xs leading-relaxed text-mist">
                  Our styling team is available 10 AM – 8 PM, all days.
                </p>
                <a
                  href="tel:+919876543210"
                  className="mt-3 inline-block text-sm font-medium text-gold-deep"
                >
                  +91 98765 43210
                </a>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
