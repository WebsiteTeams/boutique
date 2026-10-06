import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { getDashboardStats } from "@/server/services/admin";
import { AdminNav } from "@/components/admin/AdminNav";
import { LinkButton } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · UMA Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Authorisation is enforced on the server for every admin page (and again in every admin API).
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") {
    return (
      <div className="mx-auto max-w-xl px-5 pb-24 pt-32 text-center sm:px-8 lg:pt-40">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream text-gold-deep">
          <ShieldAlert width={26} height={26} />
        </span>
        <h1 className="type-heading-xl mt-6 text-charcoal">Admin access required</h1>
        <p className="mt-3 text-mist">This area is restricted to UMA Designers staff.</p>
        <LinkButton href="/account" variant="outline" className="mt-7">
          Go to My Account
        </LinkButton>
      </div>
    );
  }

  const stats = await getDashboardStats();

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-28 sm:px-8 lg:px-10 lg:pt-32">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2 text-gold-deep">UMA Designers · Admin</p>
          <h1 className="type-heading-xl text-charcoal">Store Dashboard</h1>
        </div>
        <p className="text-sm text-mist">Signed in as {user.name}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <AdminNav
            badges={{
              "/admin/orders": stats.pendingOrders,
              "/admin/custom-orders": stats.customOrdersOpen,
              "/admin/appointments": stats.pendingAppointments,
              "/admin/reviews": stats.pendingReviews,
              "/admin/messages": stats.newMessages,
            }}
          />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
