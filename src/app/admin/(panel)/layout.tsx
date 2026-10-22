import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { getDashboardStats } from "@/server/services/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { LinkButton } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · UMA Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Authorisation is enforced on the server for every admin page (and again in every admin API).
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory px-5 py-16">
        <div className="max-w-md text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream text-gold-deep">
            <ShieldAlert width={26} height={26} />
          </span>
          <h1 className="type-heading-xl mt-6 text-charcoal">Admin access required</h1>
          <p className="mt-3 text-mist">
            You&apos;re signed in as {user.email}, which isn&apos;t a staff account.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <LinkButton href="/admin/login">Staff sign in</LinkButton>
            <LinkButton href="/" variant="outline">
              Back to the store
            </LinkButton>
          </div>
        </div>
      </div>
    );
  }

  const stats = await getDashboardStats();

  return (
    <AdminShell
      user={user}
      badges={{
        "/admin/orders": stats.pendingOrders,
        "/admin/custom-orders": stats.customOrdersOpen,
        "/admin/reviews": stats.pendingReviews,
        "/admin/messages": stats.newMessages,
      }}
    >
      {children}
    </AdminShell>
  );
}
