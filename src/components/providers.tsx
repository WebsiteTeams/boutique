"use client";

import { AuthProvider, CartProvider, ToastProvider, WishlistProvider } from "@/context/store";
import { ToastViewport } from "@/components/ui/ToastViewport";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            {children}
            <ToastViewport />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
