import { pageMetadata } from "@/lib/seo";

// The page is a client component, so its metadata lives here.
export const metadata = pageMetadata({
  title: "Checkout",
  description: "Complete your UMA Designers order securely.",
  path: "/checkout",
  noIndex: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
