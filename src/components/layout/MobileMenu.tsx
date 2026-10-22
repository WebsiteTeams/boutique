"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Heart, Search, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { useCart, useWishlist } from "@/context/store";
import { siteConfig } from "@/lib/config";
import { useDialog } from "@/lib/use-dialog";

const LINKS = [
  { label: "Sarees", href: "/sarees" },
  { label: "Chudithars", href: "/chudithars" },
  { label: "Custom Blouse", href: "/custom-blouse" },
  { label: "Collections", href: "/collections" },
  { label: "Lookbook", href: "/lookbook" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "About", href: "/about" },
];

const ease = [0.22, 1, 0.36, 1] as const;

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { count } = useCart();
  const { wishlist } = useWishlist();

  const panelRef = useRef<HTMLDivElement>(null);
  useDialog(open, panelRef, onClose);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease }}
        >
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.5, ease }}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            className="absolute inset-0 flex flex-col overflow-y-auto bg-ivory"
            aria-label="Mobile menu"
          >
            <div className="flex items-center justify-between border-b border-clay/60 px-6 py-5">
              <Logo compact />
              <button
                onClick={onClose}
                className="rounded-full p-2 text-charcoal transition-colors hover:bg-sand/60"
                aria-label="Close menu"
              >
                <X width={22} height={22} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-6 py-8">
              {LINKS.map((link, i) => {
                const active =
                  link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * i + 0.15, duration: 0.45, ease }}
                  >
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={cn(
                        "group flex items-center justify-between border-b border-clay/40 py-4",
                        active ? "text-gold-deep" : "text-charcoal"
                      )}
                    >
                      <span className="type-heading-lg">{link.label}</span>
                      <ArrowUpRight
                        width={18}
                        height={18}
                        className="text-charcoal/30 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.45, ease }}
              className="border-t border-clay/60 px-6 pb-10 pt-6"
            >
              <div className="grid grid-cols-4 gap-3">
                <MenuShortcut href="/sarees" label="Shop" icon={<ShoppingBag width={19} height={19} />} badge={count} />
                <MenuShortcut href="/wishlist" label="Wishlist" icon={<Heart width={19} height={19} />} badge={wishlist.length} />
                <MenuShortcut href="/account" label="Account" icon={<User width={19} height={19} />} />
                <MenuShortcut href="/contact" label="Help" icon={<Search width={19} height={19} />} />
              </div>
              <p className="mt-6 text-center text-xs text-mist">
                Styling team available 10 AM – 8 PM, all days{siteConfig.phone ? ` · ${siteConfig.phone}` : ""}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MenuShortcut({
  href,
  label,
  icon,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center gap-1.5 rounded-xl border border-clay/60 py-3.5 text-charcoal transition-colors hover:border-gold"
    >
      <span className="relative">
        {icon}
        {badge != null && badge > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.55rem] font-medium text-white">
            {badge}
          </span>
        )}
      </span>
      <span className="type-label-sm">{label}</span>
    </Link>
  );
}
