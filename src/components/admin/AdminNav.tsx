"use client";

import {
  CalendarDays,
  LayoutDashboard,
  Mail,
  Package,
  Shirt,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/custom-orders", label: "Custom Blouses", icon: Shirt },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/rewards", label: "Rewards", icon: Sparkles },
];

export function AdminNav({ badges = {} }: { badges?: Record<string, number> }) {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col" aria-label="Admin">
      {LINKS.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        const badge = badges[link.href];
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm transition-colors",
              active ? "bg-charcoal text-ivory" : "text-mist hover:bg-cream hover:text-charcoal"
            )}
          >
            <link.icon width={16} height={16} />
            {link.label}
            {badge ? (
              <span
                className={cn(
                  "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.65rem] font-medium",
                  active ? "bg-ivory text-charcoal" : "bg-gold text-white"
                )}
              >
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
