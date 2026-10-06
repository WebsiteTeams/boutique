import { Suspense } from "react";
import { pageMetadata } from "@/lib/seo";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = pageMetadata({
  title: "Sign In",
  description: "Sign in to your UMA Designers account to track orders and manage your wishlist.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
