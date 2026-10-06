"use client";

import {
  BadgeCheck,
  CalendarDays,
  Heart,
  LogOut,
  MapPin,
  PackageCheck,
  Ruler,
  Scissors,
  Sparkles,
  Star,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type {
  Appointment,
  LoyaltySummary,
  MeasurementProfile,
  Order,
  ProductReview,
  SavedAddress,
  SavedDesign,
} from "@/types";
import { api, errorMessage } from "@/lib/api";
import { blouseOptionName } from "@/lib/blouse";
import { customizationGroups } from "@/lib/data";
import { useApi } from "@/lib/use-api";
import { useAuth, useToast, useWishlist } from "@/context/store";
import { cn, formatDate, formatINR, getInitials } from "@/lib/utils";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Rating } from "@/components/ui/Rating";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AddressBook } from "@/components/account/AddressBook";
import { MeasurementBook } from "@/components/account/MeasurementBook";
import { ProfilePanel } from "@/components/account/ProfilePanel";

interface Overview {
  orders: Order[];
  addresses: SavedAddress[];
  measurements: MeasurementProfile[];
  designs: SavedDesign[];
  appointments: Appointment[];
  reviews: ProductReview[];
  loyalty: LoyaltySummary | null;
}

const TABS = [
  { id: "overview", label: "Overview", icon: User },
  { id: "orders", label: "Orders", icon: PackageCheck },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "measurements", label: "Measurements", icon: Ruler },
  { id: "designs", label: "Saved Designs", icon: Scissors },
  { id: "appointments", label: "Appointments", icon: CalendarDays },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "profile", label: "Profile", icon: BadgeCheck },
] as const;
type Tab = (typeof TABS)[number]["id"];

const NON_REVENUE = ["Cancelled", "Refunded", "Returned"];

function AccountInner() {
  const { user, ready, logout } = useAuth();
  const { wishlist } = useWishlist();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const param = useSearchParams().get("tab");
  const tab: Tab = TABS.some((t) => t.id === param) ? (param as Tab) : "overview";
  const { data, error, loading, reload, setData } = useApi<Overview>(user ? "/api/account/overview" : null);

  const setTab = (next: Tab) =>
    router.replace(next === "overview" ? pathname : `${pathname}?tab=${next}`, { scroll: false });

  const signOut = async () => {
    try {
      await logout();
      showToast("Signed out", undefined, "info");
      router.push("/");
      router.refresh();
    } catch (e) {
      showToast("Couldn't sign out", errorMessage(e), "error");
    }
  };

  if (!ready || (user && loading)) {
    return (
      <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-32 sm:px-8 lg:px-10 lg:pt-40" aria-busy="true">
        <div className="h-16 w-64 animate-pulse rounded-full bg-cream" />
        <div className="mt-10 h-80 animate-pulse rounded-2xl bg-cream/70" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-5 pb-20 pt-32 sm:px-8 lg:pt-40">
        <div className="rounded-2xl border border-clay/60 bg-white/60">
          <EmptyState
            icon={<User width={24} height={24} />}
            title="Sign in to your account"
            description="Track orders, save measurements and keep your wishlist across devices."
            actionLabel="Sign In"
            href="/login?next=/account"
          />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-5 pb-20 pt-32 sm:px-8 lg:pt-40" role="alert">
        <div className="rounded-2xl border border-clay/60 bg-white/60">
          <EmptyState
            icon={<User width={24} height={24} />}
            title="We couldn't load your account"
            description={error?.message}
            actionLabel="Try again"
            onAction={reload}
          />
        </div>
      </div>
    );
  }

  const { orders, addresses, measurements, designs, appointments, reviews, loyalty } = data;
  const spend = orders.filter((o) => !NON_REVENUE.includes(o.status)).reduce((s, o) => s + o.total, 0);

  const deleteDesign = async (design: SavedDesign) => {
    if (!window.confirm(`Delete the saved design "${design.name}"?`)) return;
    try {
      const res = await api<{ designs: SavedDesign[] }>(`/api/account/designs/${design.id}`, { method: "DELETE" });
      setData({ ...data, designs: res.designs });
    } catch (e) {
      showToast("Couldn't delete design", errorMessage(e), "error");
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-32 sm:px-8 lg:px-10 lg:pt-40">
      {/* Header */}
      <div className="mb-10 flex flex-wrap items-center gap-5">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-charcoal text-xl font-medium text-ivory">
          {getInitials(user.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="type-heading-lg text-charcoal">{user.name}</h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-mist">
            <BadgeCheck width={14} height={14} className="text-gold-deep" />
            {user.email} · Member since {new Date(user.createdAt).getFullYear()}
          </p>
        </div>
        <div className="flex gap-2">
          {user.role === "admin" && (
            <LinkButton href="/admin" variant="outline" size="sm">
              Admin Panel
            </LinkButton>
          )}
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut width={14} height={14} />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="no-scrollbar mb-8 flex gap-1 overflow-x-auto border-b border-clay/50" role="tablist" aria-label="Account sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors",
              tab === t.id
                ? "border-charcoal font-medium text-charcoal"
                : "border-transparent text-mist hover:text-charcoal"
            )}
          >
            <t.icon width={15} height={15} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <button onClick={() => setTab("orders")} className="rounded-2xl border border-clay/60 bg-white/60 p-6 text-left transition-colors hover:border-charcoal/40">
            <PackageCheck width={22} height={22} className="text-gold-deep" />
            <p className="type-heading-lg mt-3 text-charcoal">{orders.length}</p>
            <p className="text-sm text-mist">Total orders</p>
          </button>
          <Link href="/wishlist" className="rounded-2xl border border-clay/60 bg-white/60 p-6 transition-colors hover:border-charcoal/40">
            <Heart width={22} height={22} className="text-gold-deep" />
            <p className="type-heading-lg mt-3 text-charcoal">{wishlist.length}</p>
            <p className="text-sm text-mist">Saved to wishlist</p>
          </Link>
          <div className="rounded-2xl border border-clay/60 bg-white/60 p-6">
            <Wallet width={22} height={22} className="text-gold-deep" />
            <p className="type-heading-lg mt-3 text-charcoal">{formatINR(spend)}</p>
            <p className="text-sm text-mist">Lifetime spend</p>
          </div>
          <button onClick={() => setTab("appointments")} className="rounded-2xl border border-clay/60 bg-white/60 p-6 text-left transition-colors hover:border-charcoal/40">
            <CalendarDays width={22} height={22} className="text-gold-deep" />
            <p className="type-heading-lg mt-3 text-charcoal">
              {appointments.filter((a) => ["Pending", "Confirmed", "Rescheduled"].includes(a.status)).length}
            </p>
            <p className="text-sm text-mist">Upcoming appointments</p>
          </button>

          {loyalty && (
            <div className="rounded-2xl border border-gold/40 bg-cream/60 p-6 sm:col-span-2 lg:col-span-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="eyebrow flex items-center gap-2 text-gold-deep">
                    <Sparkles width={14} height={14} />
                    UMA Rewards
                  </p>
                  <p className="type-heading-lg mt-2 text-charcoal">
                    {loyalty.points.toLocaleString("en-IN")} points · {loyalty.tier}
                  </p>
                  <p className="mt-1 text-sm text-mist">
                    {loyalty.nextTier
                      ? `${loyalty.nextTier.pointsNeeded.toLocaleString("en-IN")} more points to reach ${loyalty.nextTier.name}.`
                      : "You are in our highest tier."}{" "}
                    Earn {loyalty.pointsPerHundred} point{loyalty.pointsPerHundred === 1 ? "" : "s"} for every ₹100 on
                    delivered orders.
                  </p>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {loyalty.tiers.map((tier) => (
                    <li
                      key={tier.name}
                      title={tier.perk}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-xs",
                        tier.name === loyalty.tier
                          ? "border-charcoal bg-charcoal text-ivory"
                          : "border-clay text-mist"
                      )}
                    >
                      {tier.name} · {tier.minPoints.toLocaleString("en-IN")}+
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 text-xs text-mist">
                {loyalty.tiers.find((t) => t.name === loyalty.tier)?.perk}
              </p>
            </div>
          )}

          <div className="sm:col-span-2 lg:col-span-4">
            <h2 className="type-heading-md mb-4 text-charcoal">Recent Orders</h2>
            {orders.length === 0 ? (
              <p className="rounded-2xl border border-clay/60 bg-white/60 p-8 text-center text-sm text-mist">
                You haven&apos;t placed an order yet.{" "}
                <Link href="/sarees" className="font-medium text-gold-deep underline underline-offset-4">
                  Explore the collection
                </Link>
              </p>
            ) : (
              <ul className="grid gap-4 lg:grid-cols-3">
                {orders.slice(0, 3).map((o) => (
                  <li key={o.id} className="rounded-2xl border border-clay/60 bg-white/60 p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-charcoal">{o.id}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="mt-2 truncate text-sm text-mist">{o.items[0]?.name}</p>
                    <p className="mt-1 text-sm tabular-nums text-charcoal">{formatINR(o.total)}</p>
                    <LinkButton href={`/orders?order=${o.id}`} variant="outline" size="sm" className="mt-4">
                      Track
                    </LinkButton>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "orders" &&
        (orders.length === 0 ? (
          <div className="rounded-2xl border border-clay/60 bg-white/60">
            <EmptyState
              icon={<PackageCheck width={24} height={24} />}
              title="No orders yet"
              description="Your orders will appear here with live tracking."
              actionLabel="Start Shopping"
              href="/sarees"
            />
          </div>
        ) : (
          <ul className="space-y-4">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-clay/60 bg-white/60 p-5 sm:p-6">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-gold-deep">
                    {o.isCustom ? <Scissors width={17} height={17} /> : <PackageCheck width={18} height={18} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-charcoal">{o.id}</span>
                    <span className="block truncate text-xs text-mist">
                      {formatDate(o.createdAt)} · {o.items.map((i) => i.name).join(", ")}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-sm tabular-nums text-charcoal">{formatINR(o.total)}</span>
                  <StatusBadge status={o.status} />
                  <LinkButton href={`/orders?order=${o.id}`} variant="outline" size="sm">
                    View
                  </LinkButton>
                </span>
              </li>
            ))}
          </ul>
        ))}

      {tab === "addresses" && (
        <AddressBook addresses={addresses} onChange={(next) => setData({ ...data, addresses: next })} />
      )}

      {tab === "measurements" && (
        <MeasurementBook measurements={measurements} onChange={(next) => setData({ ...data, measurements: next })} />
      )}

      {tab === "designs" &&
        (designs.length === 0 ? (
          <div className="rounded-2xl border border-clay/60 bg-white/60">
            <EmptyState
              icon={<Scissors width={24} height={24} />}
              title="No saved designs"
              description="Save a blouse design from the builder to come back to it later."
              actionLabel="Open the Blouse Builder"
              href="/custom-blouse"
            />
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {designs.map((d) => (
              <li key={d.id} className="rounded-2xl border border-clay/60 bg-white/60 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-charcoal">{d.name}</h3>
                    <p className="text-xs text-mist">Saved {formatDate(d.createdAt)}</p>
                  </div>
                  <span className="type-price tabular-nums text-charcoal">{formatINR(d.price)}</span>
                </div>
                <dl className="mt-4 space-y-1.5 text-sm">
                  {customizationGroups.map((g) => (
                    <div key={g.id} className="flex justify-between gap-2">
                      <dt className="text-mist">{g.label}</dt>
                      <dd className="text-charcoal">{blouseOptionName(g.id, d.options[g.id])}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5 flex items-center gap-4">
                  <LinkButton href={`/custom-blouse?design=${d.id}`} size="sm">
                    Use Design
                  </LinkButton>
                  <button onClick={() => deleteDesign(d)} className="flex items-center gap-1.5 text-xs text-taupe underline underline-offset-4 hover:text-red-700">
                    <Trash2 width={12} height={12} />
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}

      {tab === "appointments" && (
        <div>
          {appointments.length === 0 ? (
            <div className="rounded-2xl border border-clay/60 bg-white/60">
              <EmptyState
                icon={<CalendarDays width={24} height={24} />}
                title="No appointments"
                description="Book a private boutique visit for bridal, blouse or saree consultations."
                actionLabel="Book an Appointment"
                href="/appointments"
              />
            </div>
          ) : (
            <>
              <ul className="grid gap-4 sm:grid-cols-2">
                {appointments.map((a) => (
                  <li key={a.id} className="rounded-2xl border border-clay/60 bg-white/60 p-6">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-charcoal">{a.id}</span>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="mt-3 type-heading-md text-charcoal">{a.purpose}</p>
                    <p className="mt-1 text-sm text-mist">
                      {formatDate(a.date)} at {a.time}
                    </p>
                    {a.notes && <p className="mt-2 text-sm italic text-mist">“{a.notes}”</p>}
                  </li>
                ))}
              </ul>
              <LinkButton href="/appointments" variant="outline" size="sm" className="mt-6">
                Book Another Appointment
              </LinkButton>
            </>
          )}
        </div>
      )}

      {tab === "reviews" &&
        (reviews.length === 0 ? (
          <div className="rounded-2xl border border-clay/60 bg-white/60">
            <EmptyState
              icon={<Star width={24} height={24} />}
              title="No reviews yet"
              description="Once an order is delivered you can review the pieces you bought."
              actionLabel="View My Orders"
              href="/orders"
            />
          </div>
        ) : (
          <ul className="space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-clay/60 bg-white/60 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/product/${r.productSlug}`} className="font-medium text-charcoal hover:text-gold-deep">
                    {r.productName}
                  </Link>
                  <StatusBadge status={r.status} />
                </div>
                <Rating value={r.rating} className="mt-2" />
                {r.title && <p className="mt-2 text-sm font-medium text-charcoal">{r.title}</p>}
                <p className="mt-1 text-sm leading-relaxed text-mist">{r.comment}</p>
                <p className="mt-2 text-xs text-mist">{formatDate(r.createdAt)}</p>
              </li>
            ))}
          </ul>
        ))}

      {tab === "profile" && <ProfilePanel user={user} />}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountInner />
    </Suspense>
  );
}
