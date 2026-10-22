"use client";

import { MotionConfig } from "framer-motion";
import { AuthProvider, CartProvider, ToastProvider, WishlistProvider } from "@/context/store";
import { ToastViewport } from "@/components/ui/ToastViewport";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // Visitors who ask their OS for reduced motion get fades without movement or scaling.
    <MotionConfig reducedMotion="user">
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
    </MotionConfig>
  );
}
