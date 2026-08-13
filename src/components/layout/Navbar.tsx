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
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Collections", href: "/collections" },
  { label: "About", href: "/about" },
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
        animate={{ height: solid ? 64 : 88 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-50",
          solid
            ? "border-b border-clay/50 bg-ivory/90 shadow-soft backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
          {/* Mobile: left icons */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              className={cn(
                "rounded-full p-2.5 transition-colors",
                onDark ? "text-ivory hover:bg-ivory/10" : "text-charcoal hover:bg-sand/50"
              )}
              aria-label="Search"
            >
              <Search width={20} height={20} />
            </button>
            <Link
              href="/wishlist"
              className={cn(
                "relative rounded-full p-2.5 transition-colors",
                onDark ? "text-ivory hover:bg-ivory/10" : "text-charcoal hover:bg-sand/50"
              )}
              aria-label="Wishlist"
            >
              <Heart width={20} height={20} />
              {wishlist.length > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[0.6rem] font-medium text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>
          </div>

          <Logo className="lg:mr-6" compact dark={onDark} />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 lg:flex xl:gap-9" aria-label="Primary">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative py-1 text-[0.72rem] font-medium uppercase tracking-[0.18em] transition-colors",
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

          {/* Right icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className={cn(
                "hidden rounded-full p-2.5 transition-colors lg:block",
                onDark ? "text-ivory hover:bg-ivory/10" : "text-charcoal hover:bg-sand/50"
              )}
              aria-label="Search"
            >
              <Search width={20} height={20} />
            </button>
            <Link
              href="/wishlist"
              className={cn(
                "relative hidden rounded-full p-2.5 transition-colors lg:block",
                onDark ? "text-ivory hover:bg-ivory/10" : "text-charcoal hover:bg-sand/50"
              )}
              aria-label="Wishlist"
            >
              <Heart width={20} height={20} />
              {wishlist.length > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[0.6rem] font-medium text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link
              href="/account"
              className={cn(
                "hidden rounded-full p-2.5 transition-colors lg:block",
                onDark ? "text-ivory hover:bg-ivory/10" : "text-charcoal hover:bg-sand/50"
              )}
              aria-label="Account"
            >
              <User width={20} height={20} />
            </Link>
            <button
              onClick={openCart}
              className={cn(
                "relative rounded-full p-2.5 transition-colors",
                onDark ? "text-ivory hover:bg-ivory/10" : "text-charcoal hover:bg-sand/50"
              )}
              aria-label="Open cart"
            >
              <ShoppingBag width={20} height={20} />
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-charcoal text-[0.6rem] font-medium text-ivory"
                >
                  {count}
                </motion.span>
              )}
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              className={cn(
                "rounded-full p-2.5 transition-colors lg:hidden",
                onDark ? "text-ivory hover:bg-ivory/10" : "text-charcoal hover:bg-sand/50"
              )}
              aria-label="Open menu"
            >
              <Menu width={22} height={22} />
            </button>
          </div>
        </div>
      </motion.header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
