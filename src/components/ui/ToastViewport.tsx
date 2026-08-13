"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useToast } from "@/context/store";

export function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[90] flex flex-col items-center gap-2 px-4 sm:top-6">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-clay bg-white/95 px-4 py-3 shadow-lifted backdrop-blur"
            role="status"
          >
            {t.variant === "error" ? (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            ) : t.variant === "info" ? (
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-taupe" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-charcoal">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-mist">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded p-0.5 text-taupe transition-colors hover:text-charcoal"
              aria-label="Dismiss notification"
            >
              <span className="sr-only">Dismiss</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
