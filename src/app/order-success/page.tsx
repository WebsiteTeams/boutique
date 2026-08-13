"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Mail, MessageSquareText, PackageCheck, Phone } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button, LinkButton } from "@/components/ui/Button";

function OrderSuccessInner() {
  const params = useSearchParams();
  const order = params.get("order") ?? "UMA-000000";
  const [trackOpen, setTrackOpen] = useState(false);
  const email = "orders@umadesigners.in";

  const copy = () => {
    navigator.clipboard?.writeText(email);
  };

  return (
    <div className="mx-auto max-w-2xl px-5 pb-20 pt-32 text-center sm:px-8 lg:pt-40">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold text-white shadow-lg shadow-gold-soft/40"
      >
        <Check width={36} height={36} strokeWidth={2.5} />
      </motion.div>

      <h1 className="serif-display mt-7 text-4xl text-charcoal sm:text-5xl">Thank you!</h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-mist">
        Your order <span className="font-medium text-charcoal">{order}</span> has been placed
        successfully. A confirmation email and SMS are on their way.
      </p>

      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-clay/60 bg-white/60 p-6 text-left">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-mist">Order number</p>
            <p className="serif-display mt-0.5 text-xl text-charcoal">{order}</p>
          </div>
          <PackageCheck width={32} height={32} className="text-gold-deep" />
        </div>

        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-clay/60 pt-5 text-center">
          <div>
            <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-taupe">Estimated</dt>
            <dd className="mt-1 text-sm font-medium text-charcoal">2–4 days</dd>
          </div>
          <div>
            <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-taupe">Payment</dt>
            <dd className="mt-1 text-sm font-medium text-charcoal">Paid</dd>
          </div>
          <div>
            <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-taupe">Status</dt>
            <dd className="mt-1 text-sm font-medium text-gold-deep">Confirmed</dd>
          </div>
        </dl>

        {/* Track toggle */}
        <div className="mt-5 rounded-xl bg-cream/70">
          <button
            onClick={() => setTrackOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-charcoal"
            aria-expanded={trackOpen}
          >
            Track this order
            <ChevronDown className={trackOpen ? "rotate-180" : ""} width={16} height={16} />
          </button>
          <AnimatePresence>
            {trackOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <ol className="space-y-4 px-4 pb-5 pt-1 text-left">
                  {[
                    { label: "Order Placed", done: true },
                    { label: "Tailoring in Progress", done: false },
                    { label: "Quality Check", done: false },
                    { label: "Out for Delivery", done: false },
                    { label: "Delivered", done: false },
                  ].map((s, i) => (
                    <li key={s.label} className="flex items-start gap-3">
                      <span
                        className={
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border " +
                          (s.done ? "border-gold bg-gold text-white" : "border-taupe/50")
                        }
                      >
                        {s.done && <Check width={10} height={10} strokeWidth={3} />}
                      </span>
                      <span className={"text-sm " + (s.done ? "font-medium text-charcoal" : "text-taupe")}>
                        {s.label}
                        {i === 0 && <span className="ml-2 text-xs text-gold-deep">Just now</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-mist">
        <span className="flex items-center gap-1.5">
          <Mail width={14} height={14} />
          Confirmation sent to your email
        </span>
        <span className="flex items-center gap-1.5">
          <Phone width={14} height={14} />
          +91 98400 00000 support
        </span>
      </div>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <LinkButton href="/orders">
          Track Order
          <PackageCheck width={15} height={15} />
        </LinkButton>
        <LinkButton href="/sarees" variant="outline">
          Continue Shopping
        </LinkButton>
        <Button variant="ghost" onClick={copy}>
          <MessageSquareText width={15} height={15} />
          {email}
        </Button>
      </div>

      <p className="mt-10 text-xs text-taupe">
        Need help? Write to us at {email} — we reply within 24 hours.
        <br />
        <Link href="/shipping" className="underline underline-offset-4 hover:text-charcoal">
          Shipping &amp; delivery details
        </Link>
      </p>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense>
      <OrderSuccessInner />
    </Suspense>
  );
}
