import { pageMetadata } from "@/lib/seo";

// The page is a client component, so its metadata lives here.
export const metadata = pageMetadata({
  title: "Your Bag",
  description: "Review the pieces in your UMA Designers bag before checkout.",
  path: "/cart",
  noIndex: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
