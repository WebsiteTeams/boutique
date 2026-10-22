import { pageMetadata } from "@/lib/seo";
import { ForgotPasswordForm } from "@/components/auth/PasswordResetForms";

export const metadata = pageMetadata({
  title: "Forgot Password",
  description: "Request a link to reset your UMA Designers account password.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
