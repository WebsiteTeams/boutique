import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { env } from "@/server/config/env";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff Sign In · UMA Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user?.role === "admin") redirect("/admin");
  return <AdminLoginForm signedInAs={user?.email ?? null} devLogin={env.devAdminLogin} />;
}
