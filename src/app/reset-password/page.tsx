import { Suspense } from "react";
import { pageMetadata } from "@/lib/seo";
import { ResetPasswordForm } from "@/components/auth/PasswordResetForms";

export const metadata = pageMetadata({
  title: "Reset Password",
  description: "Choose a new password for your UMA Designers account.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
