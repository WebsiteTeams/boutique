"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  Loader2,
  Lock,
  Plus,
  Smartphone,
  Tag,
  Wallet,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Address, Order, SavedAddress } from "@/types";
import { api, errorFields, errorMessage } from "@/lib/api";
import { customizationRows } from "@/lib/blouse";
import { calculateShipping, FREE_DELIVERY_THRESHOLD, SHIPPING_METHODS } from "@/lib/pricing";
import { payForOrder, type PaymentSession } from "@/lib/razorpay";
import type { PaymentMethod } from "@/lib/status";
import { useAuth, useCart, useToast } from "@/context/store";
import { cn, formatINR } from "@/lib/utils";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, Select, TextInput } from "@/components/ui/fields";

const STEPS = ["Contact", "Delivery", "Shipping", "Payment", "Confirm"];

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; icon: typeof Smartphone; desc: string }[] = [
  { id: "upi", label: "UPI", icon: Smartphone, desc: "GPay, PhonePe, Paytm" },
  { id: "card", label: "Card", icon: CreditCard, desc: "Visa, Mastercard, RuPay" },
  { id: "netbanking", label: "Net Banking", icon: Building2, desc: "All major banks" },
  { id: "wallet", label: "Wallet", icon: WalletCards, desc: "Paytm, Amazon Pay and more" },
  { id: "cod", label: "Cash on Delivery", icon: Wallet, desc: "Pay when it arrives" },
];

const STATES = [
  "Tamil Nadu", "Karnataka", "Telangana", "Andhra Pradesh", "Kerala", "Maharashtra", "Delhi", "Gujarat",
  "West Bengal", "Rajasthan", "Uttar Pradesh", "Madhya Pradesh", "Punjab", "Haryana", "Bihar", "Odisha",
  "Assam", "Goa", "Puducherry", "Other",
];

const EMPTY_ADDRESS = { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[6-9]\d{9}$/;

interface FailedPayment {
  orderId: string;
  message: string;
}

export default function CheckoutPage() {
  const { items, hydrated, subtotal, clearCart, coupon, applyCoupon, removeCoupon, totalsFor } = useCart();
  const { user, ready } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [contact, setContact] = useState({ email: "", phone: "" });
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [addressId, setAddressId] = useState<string | "new">("new");
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [saveAddress, setSaveAddress] = useState(true);
  const [shipping, setShipping] = useState<string>("standard");
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [onlinePayments, setOnlinePayments] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);
  const [failed, setFailed] = useState<FailedPayment | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);

  // Prefill contact details from the signed-in account (once per user).
  if (user && prefilledFor !== user.id) {
    setPrefilledFor(user.id);
    setContact({ email: user.email, phone: user.phone });
    setAddress((a) => ({ ...a, fullName: a.fullName || user.name, phone: a.phone || user.phone }));
  }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api<{ addresses: SavedAddress[] }>("/api/account/addresses")
      .then((res) => {
        if (cancelled) return;
        setSavedAddresses(res.addresses);
        const preferred = res.addresses.find((a) => a.isDefault) ?? res.addresses[0];
        if (preferred) setAddressId(preferred.id);
      })
      .catch(() => {});
    api<{ onlinePayments: boolean }>("/api/checkout/config")
      .then((res) => {
        if (!cancelled) setOnlinePayments(res.onlinePayments);
      })
      .catch(() => {
        if (!cancelled) setOnlinePayments(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // One shared calculation: identical to the cart page and to what the server charges.
  const totals = totalsFor(shipping);

  const selectedAddress = (): Omit<Address, "email"> | null => {
    if (addressId === "new") return address;
    const saved = savedAddresses.find((a) => a.id === addressId);
    return saved
      ? {
          fullName: saved.fullName,
          phone: saved.phone,
          line1: saved.line1,
          line2: saved.line2 ?? "",
          city: saved.city,
          state: saved.state,
          pincode: saved.pincode,
        }
      : null;
  };

  const validateStep = () => {
    const next: Record<string, string> = {};
    if (step === 0) {
      if (!EMAIL.test(contact.email)) next.email = "Enter a valid email";
      if (!PHONE.test(contact.phone)) next.contactPhone = "Enter a valid 10-digit number";
    }
    if (step === 1 && addressId === "new") {
      if (address.fullName.trim().length < 2) next.fullName = "Required";
      if (!PHONE.test(address.phone)) next.phone = "Enter a valid 10-digit number";
      if (address.line1.trim().length < 3) next.line1 = "Required";
      if (address.city.trim().length < 2) next.city = "Required";
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
    setStep((s) => Math.min(4, s + 1));
  };

  const submitCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponBusy(true);
    try {
      const rule = await applyCoupon(couponCode);
      showToast("Coupon applied", rule.description || rule.code);
      setCouponCode("");
    } catch (error) {
      showToast("Coupon not applied", errorMessage(error), "error");
    } finally {
      setCouponBusy(false);
    }
  };

  /** The cart is cleared only once the order exists and (for online payment) is verified as paid. */
  const completeOrder = (orderId: string) => {
    clearCart();
    router.push(`/order-success?order=${encodeURIComponent(orderId)}`);
  };

  const runPayment = async (orderId: string, session: PaymentSession) => {
    const shippingAddress = selectedAddress();
    try {
      const outcome = await payForOrder({
        orderId,
        session,
        method: payment ?? "upi",
        customer: {
          name: shippingAddress?.fullName ?? user?.name ?? "",
          email: contact.email,
          phone: contact.phone,
        },
      });
      if (outcome === "paid") {
        completeOrder(orderId);
        return;
      }
      setFailed({
        orderId,
        message:
          outcome === "dismissed"
            ? "The payment window was closed before the payment completed."
            : "The payment did not go through. No money has been taken, or it will be refunded automatically.",
      });
    } catch (error) {
      setFailed({ orderId, message: error instanceof Error ? error.message : "The payment could not be started." });
    }
  };

  const placeOrder = async () => {
    const shippingAddress = selectedAddress();
    if (!shippingAddress || !payment) return;
    setPlacing(true);
    setFailed(null);
    try {
      const res = await api<{ order: Order; payment: PaymentSession | null }>("/api/orders", {
        body: {
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            quantity: i.quantity,
            customization: i.customization
              ? {
                  options: i.customization.options,
                  measurements: i.customization.measurements,
                  measurementProfile: i.customization.measurementProfile,
                  instructions: i.customization.instructions,
                  referenceImage: i.customization.referenceImage,
                }
              : null,
          })),
          couponCode: totals.couponCode,
          shippingMethod: shipping,
          contact,
          address: { ...shippingAddress, email: contact.email },
          saveAddress: addressId === "new" && saveAddress,
          paymentMethod: payment,
        },
      });
      if (res.payment) await runPayment(res.order.id, res.payment);
      else completeOrder(res.order.id);
    } catch (error) {
      const fields = errorFields(error);
      if (Object.keys(fields).length > 0) setErrors(fields);
      showToast("We couldn't place your order", errorMessage(error), "error");
    } finally {
      setPlacing(false);
    }
  };

  const retryPayment = async () => {
    if (!failed) return;
    setPlacing(true);
    try {
      const res = await api<{ payment: PaymentSession }>(`/api/orders/${failed.orderId}/payment/retry`, {
        method: "POST",
      });
      const orderId = failed.orderId;
      setFailed(null);
      await runPayment(orderId, res.payment);
    } catch (error) {
      showToast("Couldn't restart the payment", errorMessage(error), "error");
    } finally {
      setPlacing(false);
    }
  };

  /* ---------- Gate states ---------- */

  if (!hydrated || !ready) {
    return (
      <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-32 sm:px-8 lg:px-10 lg:pt-40" aria-busy="true">
        <h1 className="type-heading-xl mb-8 text-charcoal">Checkout</h1>
        <div className="h-72 animate-pulse rounded-2xl bg-cream/70" />
      </div>
    );
  }

  if (items.length === 0 && !failed) {
    return (
      <div className="mx-auto max-w-xl px-5 pt-32 pb-20 text-center sm:px-8 lg:pt-40">
        <h1 className="type-heading-xl text-charcoal">Checkout</h1>
        <p className="mt-3 text-mist">Your bag is empty — add a few pieces to begin.</p>
        <LinkButton className="mt-6" href="/sarees">
          Browse the Collection
        </LinkButton>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-5 pt-32 pb-20 text-center sm:px-8 lg:pt-40">
        <h1 className="type-heading-xl text-charcoal">Checkout</h1>
        <p className="mt-3 text-mist">
          Sign in or create an account to place your order — your bag is saved and will be waiting.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <LinkButton href="/login?next=/checkout">Sign In</LinkButton>
          <LinkButton href="/register?next=/checkout" variant="outline">
            Create Account
          </LinkButton>
        </div>
      </div>
    );
  }

  const chosenAddress = selectedAddress();

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-32 sm:px-8 lg:px-10 lg:pt-40">
      <h1 className="type-heading-xl mb-2 text-charcoal">Checkout</h1>

      {/* Stepper */}
      <ol className="no-scrollbar mb-10 flex items-center gap-2 overflow-x-auto py-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              aria-current={i === step ? "step" : undefined}
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
                <h2 className="type-heading-md mb-2 text-charcoal">Contact Details</h2>
                <p className="mb-6 text-sm text-mist">Signed in as {user.name}. We&apos;ll send order updates here.</p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Email" required error={errors.email || errors["contact.email"]} className="sm:col-span-2">
                    <TextInput
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={contact.email}
                      error={!!errors.email}
                      onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                    />
                  </Field>
                  <Field
                    label="Phone"
                    required
                    error={errors.contactPhone || errors["contact.phone"]}
                    hint="For delivery updates"
                  >
                    <TextInput
                      type="tel"
                      autoComplete="tel-national"
                      placeholder="10-digit mobile number"
                      inputMode="numeric"
                      maxLength={10}
                      value={contact.phone}
                      error={!!errors.contactPhone}
                      onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value.replace(/\D/g, "") }))}
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

                {savedAddresses.length > 0 && (
                  <div className="mb-6 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Saved addresses">
                    {savedAddresses.map((a) => (
                      <button
                        key={a.id}
                        role="radio"
                        aria-checked={addressId === a.id}
                        onClick={() => setAddressId(a.id)}
                        className={cn(
                          "rounded-xl border p-4 text-left transition-all",
                          addressId === a.id ? "border-charcoal bg-cream/60" : "border-clay/70 hover:border-charcoal/40"
                        )}
                      >
                        <span className="flex items-center justify-between">
                          <span className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-charcoal">
                            {a.label}
                          </span>
                          {addressId === a.id && <Check width={14} height={14} className="text-gold-deep" />}
                        </span>
                        <span className="mt-2 block text-sm font-medium text-charcoal">{a.fullName}</span>
                        <span className="mt-0.5 block text-sm leading-relaxed text-mist">
                          {a.line1}
                          {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
                        </span>
                        <span className="mt-0.5 block text-sm text-mist">{a.phone}</span>
                      </button>
                    ))}
                    <button
                      role="radio"
                      aria-checked={addressId === "new"}
                      onClick={() => setAddressId("new")}
                      className={cn(
                        "flex min-h-24 items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-sm font-medium text-charcoal transition-all",
                        addressId === "new" ? "border-charcoal bg-cream/60" : "border-clay hover:border-charcoal/40"
                      )}
                    >
                      <Plus width={15} height={15} />
                      Add a new address
                    </button>
                  </div>
                )}

                {addressId === "new" && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Full Name" required error={errors.fullName || errors["address.fullName"]}>
                      <TextInput
                        autoComplete="name"
                        value={address.fullName}
                        error={!!errors.fullName}
                        onChange={(e) => setAddress((a) => ({ ...a, fullName: e.target.value }))}
                      />
                    </Field>
                    <Field label="Phone" required error={errors.phone || errors["address.phone"]}>
                      <TextInput
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={address.phone}
                        error={!!errors.phone}
                        onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value.replace(/\D/g, "") }))}
                      />
                    </Field>
                    <Field label="Address Line 1" required error={errors.line1 || errors["address.line1"]} className="sm:col-span-2">
                      <TextInput
                        autoComplete="address-line1"
                        placeholder="House no., street, area"
                        value={address.line1}
                        error={!!errors.line1}
                        onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                      />
                    </Field>
                    <Field label="Address Line 2" className="sm:col-span-2">
                      <TextInput
                        autoComplete="address-line2"
                        placeholder="Landmark (optional)"
                        value={address.line2}
                        onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
                      />
                    </Field>
                    <Field label="City" required error={errors.city || errors["address.city"]}>
                      <TextInput
                        autoComplete="address-level2"
                        value={address.city}
                        error={!!errors.city}
                        onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                      />
                    </Field>
                    <Field label="State" required error={errors.state || errors["address.state"]}>
                      <Select
                        autoComplete="address-level1"
                        value={address.state}
                        error={!!errors.state}
                        onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                      >
                        <option value="">Select state</option>
                        {STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Pincode" required error={errors.pincode || errors["address.pincode"]}>
                      <TextInput
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={6}
                        placeholder="600000"
                        value={address.pincode}
                        error={!!errors.pincode}
                        onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, "") }))}
                      />
                    </Field>
                    <label className="flex items-center gap-2.5 text-sm text-mist sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="h-4 w-4 accent-[#1c1a17]"
                      />
                      Save this address to my account
                    </label>
                  </div>
                )}
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
                <div className="space-y-3" role="radiogroup" aria-label="Shipping method">
                  {SHIPPING_METHODS.map((opt) => {
                    const fee = calculateShipping(opt.id, subtotal);
                    return (
                      <button
                        key={opt.id}
                        role="radio"
                        aria-checked={shipping === opt.id}
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
                          {fee === 0 ? "Free" : formatINR(fee)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-mist">
                  Standard delivery is free on orders above {formatINR(FREE_DELIVERY_THRESHOLD)}. Made-to-order
                  and bespoke pieces dispatch once they are ready.
                </p>
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
                  Online payments are processed securely by Razorpay. We never see or store your card details.
                </p>
                <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
                  {PAYMENT_OPTIONS.map((m) => {
                    const unavailable = m.id !== "cod" && onlinePayments === false;
                    return (
                      <button
                        key={m.id}
                        role="radio"
                        aria-checked={payment === m.id}
                        disabled={unavailable}
                        onClick={() => setPayment(m.id)}
                        className={cn(
                          "flex items-start gap-4 rounded-xl border p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-55",
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
                          <span className="mt-0.5 block text-sm text-mist">
                            {unavailable ? "Currently unavailable" : m.desc}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {onlinePayments === false && (
                  <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-sm text-mist">
                    Online payment is not available at the moment — please choose Cash on Delivery.
                  </p>
                )}
              </motion.section>
            )}

            {step === 4 && (
              <motion.section
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="type-heading-md mb-6 text-charcoal">Review &amp; Confirm</h2>

                {failed && (
                  <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                    <p className="flex items-center gap-2 font-medium text-red-800">
                      <AlertCircle width={17} height={17} />
                      Payment not completed
                    </p>
                    <p className="mt-1.5 text-sm text-red-800/90">{failed.message}</p>
                    <p className="mt-1 text-sm text-red-800/90">
                      Your order <span className="font-medium">{failed.orderId}</span> is saved and your bag is
                      untouched. You can retry the payment now or later from{" "}
                      <Link href={`/orders?order=${failed.orderId}`} className="underline underline-offset-4">
                        your orders
                      </Link>
                      .
                    </p>
                    <Button onClick={retryPayment} disabled={placing} size="sm" className="mt-4">
                      {placing ? "Opening payment…" : "Retry Payment"}
                    </Button>
                  </div>
                )}

                <dl className="grid gap-4 rounded-2xl border border-clay/60 bg-white/60 p-6 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-taupe">Contact</dt>
                    <dd className="mt-1 text-charcoal">{contact.email}</dd>
                    <dd className="text-mist">{contact.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-taupe">Deliver to</dt>
                    <dd className="mt-1 text-charcoal">{chosenAddress?.fullName}</dd>
                    <dd className="leading-relaxed text-mist">
                      {chosenAddress?.line1}
                      {chosenAddress?.line2 ? `, ${chosenAddress.line2}` : ""}, {chosenAddress?.city},{" "}
                      {chosenAddress?.state} {chosenAddress?.pincode}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-taupe">Shipping</dt>
                    <dd className="mt-1 text-charcoal">
                      {SHIPPING_METHODS.find((m) => m.id === shipping)?.label}
                    </dd>
                    <dd className="text-mist">{SHIPPING_METHODS.find((m) => m.id === shipping)?.eta}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-taupe">Payment</dt>
                    <dd className="mt-1 text-charcoal">
                      {PAYMENT_OPTIONS.find((m) => m.id === payment)?.label}
                    </dd>
                    <dd className="text-mist">
                      {payment === "cod" ? "Pay when your order arrives" : "You will complete payment securely on the next screen"}
                    </dd>
                  </div>
                </dl>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Nav */}
          <div className="mt-10 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || placing} className="disabled:opacity-40">
              <ArrowLeft width={16} height={16} />
              Back
            </Button>
            {step < 4 ? (
              <Button onClick={next}>
                {step === 3 ? "Review Order" : "Continue"}
                <ArrowRight width={16} height={16} />
              </Button>
            ) : (
              !failed && (
                <Button onClick={placeOrder} variant="gold" size="lg" disabled={placing}>
                  {placing ? (
                    <>
                      <Loader2 width={16} height={16} className="animate-spin" />
                      Placing Order…
                    </>
                  ) : (
                    <>
                      <Lock width={16} height={16} />
                      {payment === "cod" ? "Place Order" : "Pay"} · {formatINR(totals.total)}
                    </>
                  )}
                </Button>
              )
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
              <span className="type-price text-charcoal">{formatINR(totals.total)}</span>
              <ChevronDown className={cn("transition-transform", summaryOpen && "rotate-180")} width={18} height={18} />
            </span>
          </button>

          <AnimatePresence initial={false}>
            {summaryOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-b-xl border border-t-0 border-clay/60 bg-white/60 p-5">
                  <ul className="max-h-72 space-y-4 overflow-y-auto">
                    {items.map((item) => (
                      <li key={item.key} className="flex items-start gap-3">
                        <span className="relative h-16 w-13 shrink-0 overflow-hidden rounded-lg bg-cream">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.image} alt="" className="h-full w-full object-cover" />
                          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-charcoal px-1 text-[0.6rem] text-ivory">
                            {item.quantity}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-charcoal">{item.name}</span>
                          <span className="block text-xs capitalize text-mist">
                            {item.size}{item.color ? ` · ${item.color}` : ""}
                          </span>
                          {item.customization && (
                            <span className="mt-0.5 block text-xs text-mist">
                              {customizationRows(item.customization)
                                .slice(2, 4)
                                .map((r) => `${r.label}: ${r.value}`)
                                .join(" · ")}
                            </span>
                          )}
                        </span>
                        <span className="text-sm tabular-nums text-charcoal">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {coupon ? (
                    <p className="mt-5 flex items-center justify-between rounded-lg bg-cream px-3 py-2 text-sm text-gold-deep">
                      <span className="flex items-center gap-1.5">
                        <Tag width={13} height={13} />
                        {coupon.code} applied
                      </span>
                      <button onClick={removeCoupon} className="text-xs text-taupe underline underline-offset-4 hover:text-charcoal">
                        Remove
                      </button>
                    </p>
                  ) : (
                    <form onSubmit={submitCoupon} className="mt-5 flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Coupon code"
                        aria-label="Coupon code"
                        className="h-10 min-w-0 flex-1 rounded-full border border-clay bg-white px-4 text-sm text-charcoal placeholder:text-taupe focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold-soft/40"
                      />
                      <button
                        type="submit"
                        disabled={couponBusy || !couponCode.trim()}
                        className="h-10 rounded-full border border-charcoal/30 px-4 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-charcoal disabled:opacity-50"
                      >
                        Apply
                      </button>
                    </form>
                  )}

                  <div className="mt-5 space-y-2.5 border-t border-clay/60 pt-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-mist">Subtotal</span>
                      <span className="tabular-nums text-charcoal">{formatINR(totals.subtotal)}</span>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between text-gold-deep">
                        <span>Coupon {totals.couponCode}</span>
                        <span className="tabular-nums">−{formatINR(totals.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-mist">Shipping</span>
                      <span className="tabular-nums text-charcoal">
                        {totals.shipping === 0 ? <span className="text-gold-deep">Free</span> : formatINR(totals.shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-clay/60 pt-3 text-base">
                      <span className="font-medium text-charcoal">Total</span>
                      <span className="type-price-lg tabular-nums text-charcoal">{formatINR(totals.total)}</span>
                    </div>
                    <p className="text-xs text-mist">Inclusive of all taxes.</p>
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
