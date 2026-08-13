"use client";

import { Heart, Home, ShoppingBag, Store, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart, useWishlist } from "@/context/store";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Shop", href: "/sarees", icon: Store },
  { label: "Wishlist", href: "/wishlist", icon: Heart, badge: true },
  { label: "Cart", href: "/cart", icon: ShoppingBag, badge: true },
  { label: "Account", href: "/account", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const { count } = useCart();
  const { wishlist } = useWishlist();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-clay/50 bg-ivory/95 backdrop-blur-md lg:hidden"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const badgeCount = item.href === "/cart" ? count : wishlist.length;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2.5",
                active ? "text-gold-deep" : "text-charcoal/60"
              )}
            >
              <span className="relative">
                <Icon width={20} height={20} strokeWidth={1.6} />
                {item.badge && badgeCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-gold px-1 text-[0.55rem] font-medium text-white">
                    {badgeCount}
                  </span>
                )}
              </span>
              <span className="text-[0.58rem] font-medium uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
