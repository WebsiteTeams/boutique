"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  Loader2,
  Lock,
  Smartphone,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Address } from "@/types";
import { FREE_DELIVERY_THRESHOLD, SHIPPING_FEE } from "@/lib/data";
import { useCart, useToast } from "@/context/store";
import { cn, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextInput } from "@/components/ui/fields";

const STEPS = ["Contact", "Delivery", "Shipping", "Payment", "Confirmation"];

const SHIPPING_OPTIONS = [
  { id: "standard", label: "Standard", eta: "2–4 working days", price: SHIPPING_FEE, free: true },
  { id: "express", label: "Express", eta: "1–2 working days", price: 249 },
  { id: "pickup", label: "Boutique Pickup", eta: "Ready in 3 days · T Nagar, Chennai", price: 0 },
];

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", icon: Smartphone, desc: "GPay, PhonePe, Paytm" },
  { id: "card", label: "Card", icon: CreditCard, desc: "Visa, Mastercard, RuPay" },
  { id: "netbanking", label: "Net Banking", icon: Building2, desc: "All major banks" },
  { id: "cod", label: "Cash on Delivery", icon: Wallet, desc: "Pay when it arrives" },
];

const INITIAL_ADDRESS: Address = {
  fullName: "",
  phone: "",
  email: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [contact, setContact] = useState({ email: "", phone: "" });
  const [address, setAddress] = useState<Address>(INITIAL_ADDRESS);
  const [shipping, setShipping] = useState("standard");
  const [payment, setPayment] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);

  const shippingFee = useMemo(() => {
    const opt = SHIPPING_OPTIONS.find((o) => o.id === shipping);
    if (!opt) return SHIPPING_FEE;
    if (opt.free && subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
    return opt.price;
  }, [shipping, subtotal]);

  const total = subtotal + shippingFee;

  const validateStep = () => {
    const next: Record<string, string> = {};
    if (step === 0) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) next.email = "Enter a valid email";
      if (!/^[6-9]\d{9}$/.test(contact.phone)) next.phone = "Enter a valid 10-digit number";
    }
    if (step === 1) {
      if (!address.fullName.trim()) next.fullName = "Required";
      if (!/^[6-9]\d{9}$/.test(address.phone)) next.phone = "Enter a valid 10-digit number";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) next.email = "Enter a valid email";
      if (!address.line1.trim()) next.line1 = "Required";
      if (!address.city.trim()) next.city = "Required";
      if (!address.state.trim()) next.state = "Required";
      if (!/^\d{6}$/.test(address.pincode)) next.pincode = "6-digit pincode";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const next = () => {
    if (!validateStep()) {
      showToast("Please fix the highlighted fields", undefined, "error");
      return;
    }
    if (step === 3 && !payment) {
      showToast("Select a payment method", undefined, "error");
      return;
    }
    if (step === 3) {
      setStep(4);
      return;
    }
    setStep((s) => s + 1);
  };

  const confirm = () => {
    setPlacing(true);
    setTimeout(() => {
      clearCart();
      router.push(`/order-success?order=UMA-${Math.floor(100000 + Math.random() * 900000)}`);
    }, 1400);
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 pt-32 pb-20 text-center sm:px-8 lg:pt-40">
        <h1 className="type-heading-xl text-charcoal">Checkout</h1>
        <p className="mt-3 text-mist">Your bag is empty — add a few pieces to begin.</p>
        <Button className="mt-6" onClick={() => router.push("/sarees")}>
          Browse the Collection
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-32 sm:px-8 lg:px-10 lg:pt-40">
      <h1 className="type-heading-xl mb-2 text-charcoal">Checkout</h1>

      {/* Stepper */}
      <ol className="no-scrollbar mb-10 flex items-center gap-2 overflow-x-auto py-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 type-label-sm transition-colors",
                i === step
                  ? "bg-charcoal text-ivory"
                  : i < step
                    ? "bg-cream text-gold-deep"
                    : "text-taupe"
              )}
            >
              {i < step ? <Check width={13} height={13} /> : <span>{i + 1}</span>}
              {s}
            </button>
            {i < STEPS.length - 1 && <span className="h-px w-4 bg-clay" />}
          </li>
        ))}
      </ol>

      <div className="grid gap-10 lg:grid-cols-[1.55fr_1fr]">
        {/* Form */}
        <div>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.section
                key="contact"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
              >
                <h2 className="type-heading-md mb-6 text-charcoal">Contact Details</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Email" required error={errors.email} className="sm:col-span-2">
                    <TextInput
                      type="email"
                      placeholder="you@example.com"
                      value={contact.email}
                      error={!!errors.email}
                      onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                    />
                  </Field>
                  <Field label="Phone" required error={errors.phone} hint="For order updates via SMS">
                    <TextInput
                      type="tel"
                      placeholder="10-digit mobile number"
                      inputMode="numeric"
                      value={contact.phone}
                      error={!!errors.phone}
                      onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                    />
                  </Field>
                </div>
              </motion.section>
            )}

            {step === 1 && (
              <motion.section
                key="delivery"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
              >
                <h2 className="type-heading-md mb-6 text-charcoal">Delivery Address</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full Name" required error={errors.fullName}>
                    <TextInput
                      placeholder="As per govt. ID"
                      value={address.fullName}
                      error={!!errors.fullName}
                      onChange={(e) => setAddress((a) => ({ ...a, fullName: e.target.value }))}
                    />
                  </Field>
                  <Field label="Phone" required error={errors.phone}>
                    <TextInput
                      type="tel"
                      inputMode="numeric"
                      placeholder="10-digit mobile number"
                      value={address.phone}
                      error={!!errors.phone}
                      onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))}
                    />
                  </Field>
                  <Field label="Email" required error={errors.email} className="sm:col-span-2">
                    <TextInput
                      type="email"
                      value={address.email}
                      error={!!errors.email}
                      onChange={(e) => setAddress((a) => ({ ...a, email: e.target.value }))}
                    />
                  </Field>
                  <Field label="Address Line 1" required error={errors.line1} className="sm:col-span-2">
                    <TextInput
                      placeholder="House no., street, area"
                      value={address.line1}
                      error={!!errors.line1}
                      onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                    />
                  </Field>
                  <Field label="Address Line 2" className="sm:col-span-2">
                    <TextInput
                      placeholder="Landmark (optional)"
                      value={address.line2 ?? ""}
                      onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
                    />
                  </Field>
                  <Field label="City" required error={errors.city}>
                    <TextInput
                      value={address.city}
                      error={!!errors.city}
                      onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                    />
                  </Field>
                  <Field label="State" required error={errors.state}>
                    <Select
                      value={address.state}
                      error={!!errors.state}
                      onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                    >
                      <option value="">Select state</option>
                      {["Tamil Nadu", "Karnataka", "Telangana", "Andhra Pradesh", "Kerala", "Maharashtra", "Delhi", "Gujarat", "West Bengal", "Other"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Pincode" required error={errors.pincode}>
                    <TextInput
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="600000"
                      value={address.pincode}
                      error={!!errors.pincode}
                      onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, "") }))}
                    />
                  </Field>
                </div>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section
                key="shipping"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
              >
                <h2 className="type-heading-md mb-6 text-charcoal">Shipping Method</h2>
                <div className="space-y-3">
                  {SHIPPING_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setShipping(opt.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border p-5 text-left transition-all",
                        shipping === opt.id
                          ? "border-charcoal bg-cream/60"
                          : "border-clay/70 hover:border-charcoal/40"
                      )}
                    >
                      <span>
                        <span className="flex items-center gap-2">
                          <span className={cn("flex h-4 w-4 items-center justify-center rounded-full border", shipping === opt.id ? "border-charcoal" : "border-taupe")}>
                            {shipping === opt.id && <span className="h-2 w-2 rounded-full bg-charcoal" />}
                          </span>
                          <span className="font-medium text-charcoal">{opt.label}</span>
                        </span>
                        <span className="mt-1.5 block pl-6 text-sm text-mist">{opt.eta}</span>
                      </span>
                      <span className="text-sm font-medium tabular-nums text-charcoal">
                        {(opt.free && subtotal >= FREE_DELIVERY_THRESHOLD) || opt.price === 0
                          ? "Free"
                          : formatINR(opt.price)}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.section>
            )}

            {step === 3 && (
              <motion.section
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
              >
                <h2 className="type-heading-md mb-2 text-charcoal">Payment</h2>
                <p className="mb-6 flex items-center gap-1.5 text-sm text-mist">
                  <Lock width={13} height={13} />
                  256-bit encrypted · Your details are safe with us
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPayment(m.id)}
                      className={cn(
                        "flex items-start gap-4 rounded-xl border p-5 text-left transition-all",
                        payment === m.id
                          ? "border-charcoal bg-cream/60"
                          : "border-clay/70 hover:border-charcoal/40"
                      )}
                    >
                      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", payment === m.id ? "bg-charcoal text-ivory" : "bg-cream text-gold-deep")}>
                        <m.icon width={18} height={18} />
                      </span>
                      <span>
                        <span className="flex items-center gap-2 font-medium text-charcoal">
                          {m.label}
                          {payment === m.id && <Check width={14} height={14} className="text-gold-deep" />}
                        </span>
                        <span className="mt-0.5 block text-sm text-mist">{m.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>

                {payment === "upi" && (
                  <Field label="UPI ID" hint="Optional — you'll be redirected to your UPI app" className="mt-5">
                    <TextInput placeholder="yourname@upi" />
                  </Field>
                )}
              </motion.section>
            )}

            {step === 4 && (
              <motion.section
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-gold/40 bg-cream/60 p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 16 }}
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold text-white"
                >
                  <Check width={28} height={28} strokeWidth={2.5} />
                </motion.div>
                <h2 className="type-heading-lg text-charcoal">Almost done!</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mist">
                  Review the summary once more, then place your order. We&apos;ll confirm it
                  immediately on email and SMS.
                </p>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Nav */}
          <div className="mt-10 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="disabled:opacity-40">
              <ArrowLeft width={16} height={16} />
              Back
            </Button>
            {step < 4 ? (
              <Button onClick={next}>
                {step === 3 ? "Review Order" : "Continue"}
                <ArrowRight width={16} height={16} />
              </Button>
            ) : (
              <Button onClick={confirm} variant="gold" size="lg" disabled={placing}>
                {placing ? (
                  <>
                    <Loader2 width={16} height={16} className="animate-spin" />
                    Placing Order…
                  </>
                ) : (
                  <>
                    <Lock width={16} height={16} />
                    Place Order · {formatINR(total)}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Order summary */}
        <aside className="self-start lg:sticky lg:top-32">
          <button
            onClick={() => setSummaryOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl border border-clay/60 bg-white/60 px-5 py-4 lg:pointer-events-none lg:cursor-default"
            aria-expanded={summaryOpen}
          >
            <h2 className="type-heading-md text-charcoal">Order Summary</h2>
            <span className="flex items-center gap-3 lg:hidden">
              <span className="type-price text-charcoal">{formatINR(total)}</span>
              <ChevronDown className={cn("transition-transform", summaryOpen && "rotate-180")} width={18} height={18} />
            </span>
          </button>

          <AnimatePresence>
            {summaryOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-b-xl border border-t-0 border-clay/60 bg-white/60 p-5">
                  <ul className="max-h-64 space-y-4 overflow-y-auto">
                    {items.map((item) => (
                      <li key={item.key} className="flex items-center gap-3">
                        <span className="relative h-16 w-13 shrink-0 overflow-hidden rounded-lg bg-cream">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-charcoal px-1 text-[0.6rem] text-ivory">
                            {item.quantity}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-charcoal">{item.name}</span>
                          <span className="block text-xs capitalize text-mist">
                            {item.size}{item.color ? ` · ${item.color}` : ""}
                          </span>
                        </span>
                        <span className="text-sm tabular-nums text-charcoal">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 space-y-2.5 border-t border-clay/60 pt-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-mist">Subtotal</span>
                      <span className="tabular-nums text-charcoal">{formatINR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mist">Shipping</span>
                      <span className="tabular-nums text-charcoal">
                        {shippingFee === 0 ? <span className="text-gold-deep">Free</span> : formatINR(shippingFee)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-clay/60 pt-3 text-base">
                      <span className="font-medium text-charcoal">Total</span>
                      <span className="type-price-lg tabular-nums text-charcoal">{formatINR(total)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>
    </div>
  );
}
