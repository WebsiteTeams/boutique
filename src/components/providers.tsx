"use client";

import { CartProvider, ToastProvider, WishlistProvider } from "@/context/store";
import { ToastViewport } from "@/components/ui/ToastViewport";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <WishlistProvider>
        <CartProvider>
          {children}
          <ToastViewport />
        </CartProvider>
      </WishlistProvider>
    </ToastProvider>
  );
}
