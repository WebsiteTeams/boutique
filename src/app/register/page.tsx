import { Suspense } from "react";
import { pageMetadata } from "@/lib/seo";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = pageMetadata({
  title: "Create Account",
  description: "Create your UMA Designers account to save measurements, track orders and earn UMA Rewards.",
  path: "/register",
  noIndex: true,
});

export default function RegisterPage() {
  return (
    <Suspense>
      <AuthForm mode="register" />
    </Suspense>
  );
}
