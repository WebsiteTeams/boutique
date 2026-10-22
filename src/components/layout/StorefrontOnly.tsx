"use client";

import { usePathname } from "next/navigation";

/** Renders storefront chrome (navbar, footer, bag drawer) everywhere except the admin workspace. */
export function StorefrontOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  return <>{children}</>;
}
