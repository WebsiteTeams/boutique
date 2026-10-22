"use client";

import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  Palette,
  Shirt,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import type { SessionUser } from "@/types";
import { useAuth } from "@/context/store";
import { useDialog } from "@/lib/use-dialog";
import { cn } from "@/lib/utils";

const GROUPS = [
  { label: null, links: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Sales",
    links: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/coupons", label: "Coupons", icon: Tag },
    ],
  },
  {
    label: "Atelier",
    links: [
      { href: "/admin/custom-orders", label: "Custom Orders", icon: Shirt },
      { href: "/admin/custom-blouses", label: "Blouse Designer", icon: Palette },
    ],
  },
  {
    label: "Customers",
    links: [
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/messages", label: "Messages", icon: Mail },
      { href: "/admin/rewards", label: "Rewards", icon: Sparkles },
    ],
  },
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

function Brand() {
  return (
    <Link href="/admin" className="flex items-baseline gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-soft">
      <span className="font-serif text-2xl leading-none tracking-wide text-ivory">UMA</span>
      <span className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-gold-soft">Admin</span>
    </Link>
  );
}

function NavLinks({ badges, onNavigate }: { badges: Record<string, number>; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="space-y-6">
      {GROUPS.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <p className="mb-2 px-3 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-ivory/45">{group.label}</p>
          )}
          <ul className="space-y-0.5">
            {group.links.map((link) => {
              const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
              const badge = badges[link.href];
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-gold-soft",
                      active ? "bg-ivory/10 text-ivory" : "text-ivory/70 hover:bg-ivory/5 hover:text-ivory"
                    )}
                  >
                    <link.icon
                      width={17}
                      height={17}
                      aria-hidden
                      className={active ? "text-gold-soft" : "text-ivory/50 group-hover:text-ivory/80"}
                    />
                    <span className="flex-1">{link.label}</span>
                    {badge ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[0.65rem] font-semibold text-white">
                        {badge}
                        <span className="sr-only"> need attention</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Account({ user }: { user: SessionUser }) {
  const { logout } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const signOut = async () => {
    setPending(true);
    try {
      await logout();
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  };
  return (
    <div className="space-y-1 border-t border-ivory/10 pt-4">
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm text-ivory/70 hover:bg-ivory/5 hover:text-ivory focus-visible:outline-2 focus-visible:outline-gold-soft"
      >
        <ExternalLink width={16} height={16} aria-hidden className="text-ivory/50" />
        View store
        <span className="sr-only">(opens in a new tab)</span>
      </a>
      <div className="mt-2 flex items-center gap-3 rounded-lg bg-ivory/5 p-3">
        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/90 text-xs font-semibold text-white">
          {initials(user.name) || "A"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ivory">{user.name}</span>
          <span className="block truncate text-xs text-ivory/55">{user.email}</span>
        </span>
        <button
          type="button"
          onClick={signOut}
          disabled={pending}
          aria-label="Sign out"
          title="Sign out"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ivory/60 hover:bg-ivory/10 hover:text-ivory focus-visible:outline-2 focus-visible:outline-gold-soft disabled:opacity-50"
        >
          <LogOut width={16} height={16} />
        </button>
      </div>
    </div>
  );
}

/** The admin workspace: a fixed sidebar on desktop and a slide-out drawer on smaller screens. */
export function AdminShell({
  user,
  badges,
  children,
}: {
  user: SessionUser;
  badges: Record<string, number>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDialog(open, drawerRef, close);
  const attention = Object.values(badges).reduce((n, v) => n + (v || 0), 0);

  return (
    <div className="min-h-screen bg-ivory lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-charcoal px-4 py-6 lg:flex">
        <div className="px-3">
          <Brand />
        </div>
        <div className="no-scrollbar mt-8 flex-1 overflow-y-auto">
          <NavLinks badges={badges} />
        </div>
        <Account user={user} />
      </aside>

      {/* Phone / tablet top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-charcoal px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Open menu${attention ? `, ${attention} items need attention` : ""}`}
          aria-expanded={open}
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-ivory hover:bg-ivory/10 focus-visible:outline-2 focus-visible:outline-gold-soft"
        >
          <Menu width={20} height={20} />
          {attention > 0 && <span aria-hidden className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold-soft" />}
        </button>
        <Brand />
        <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/90 text-xs font-semibold text-white">
          {initials(user.name) || "A"}
        </span>
      </header>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/60" onClick={close} aria-hidden />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
            tabIndex={-1}
            className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col bg-charcoal px-4 py-5 shadow-lifted"
          >
            <div className="flex items-center justify-between px-3">
              <Brand />
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-full text-ivory/70 hover:bg-ivory/10 hover:text-ivory focus-visible:outline-2 focus-visible:outline-gold-soft"
              >
                <X width={18} height={18} />
              </button>
            </div>
            <div className="no-scrollbar mt-6 flex-1 overflow-y-auto">
              <NavLinks badges={badges} onNavigate={close} />
            </div>
            <Account user={user} />
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10">
        {children}
      </div>
    </div>
  );
}
