"use client";

import { motion } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useCart, useWishlist } from "@/context/store";
import { Logo } from "@/components/ui/Logo";
import { SearchOverlay } from "@/components/ui/SearchOverlay";
import { MobileMenu } from "@/components/layout/MobileMenu";

const NAV_LINKS = [
  { label: "Sarees", href: "/sarees" },
  { label: "Chudithars", href: "/chudithars" },
  { label: "Custom Blouse", href: "/custom-blouse" },
  { label: "Collections", href: "/collections" },
  { label: "Lookbook", href: "/lookbook" },
];

export function Navbar() {
  const pathname = usePathname();
  const { count, openCart } = useCart();
  const { wishlist } = useWishlist();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);

  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || !isHome;
  const onDark = !solid;

  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  return (
    <>
      <motion.header
        animate={{ height: solid ? 64 : 84 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-50",
          solid
            ? "border-b border-clay/60 bg-ivory/85 shadow-soft backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="relative mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          {/* Left: brand */}
          <div className="flex min-w-0 shrink-0 items-center">
            <Logo dark={onDark} />
          </div>

          {/* Center: desktop nav (truly centered, independent of side content) */}
          <nav
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-6 whitespace-nowrap lg:flex xl:gap-8"
            aria-label="Primary"
          >
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative whitespace-nowrap py-1 type-nav transition-colors",
                    active
                      ? onDark
                        ? "text-gold-soft"
                        : "text-gold-deep"
                      : onDark
                        ? "text-ivory hover:text-gold-soft"
                        : "text-charcoal hover:text-gold-deep"
                  )}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-0.5 left-0 h-px w-full bg-gold"
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: actions */}
          <div className="flex shrink-0 items-center justify-end gap-0.5 sm:gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className={cn(
                "shrink-0 rounded-full p-2.5 transition-colors",
                onDark ? "text-ivory hover:bg-ivory/10" : "text-charcoal hover:bg-sand/50"
              )}
              aria-label="Search"
            >
              <Search width={19} height={19} />
            </button>
            <Link
              href="/wishlist"
              className={cn(
                "relative hidden shrink-0 rounded-full p-2.5 transition-colors sm:flex",
                onDark ? "text-ivory hover:bg-ivory/10" : "text-charcoal hover:bg-sand/50"
              )}
              aria-label="Wishlist"
            >
              <Heart width={19} height={19} />
              {wishlist.length > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[0.58rem] font-medium text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link
              href="/account"
              className={cn(
                "hidden shrink-0 rounded-full p-2.5 transition-colors sm:flex",
                onDark ? "text-ivory hover:bg-ivory/10" : "text-charcoal hover:bg-sand/50"
              )}
              aria-label="Account"
            >
              <User width={19} height={19} />
            </Link>
            <button
              onClick={openCart}
              className={cn(
                "relative shrink-0 rounded-full p-2.5 transition-colors",
                onDark ? "text-ivory hover:bg-ivory/10" : "text-charcoal hover:bg-sand/50"
              )}
              aria-label="Open cart"
            >
              <ShoppingBag width={19} height={19} />
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-charcoal text-[0.58rem] font-medium text-ivory"
                >
                  {count}
                </motion.span>
              )}
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              className={cn(
                "shrink-0 rounded-full p-2.5 transition-colors lg:hidden",
                onDark ? "text-ivory hover:bg-ivory/10" : "text-charcoal hover:bg-sand/50"
              )}
              aria-label="Open menu"
            >
              <Menu width={21} height={21} />
            </button>
          </div>
        </div>
      </motion.header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
