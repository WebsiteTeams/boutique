import { pageMetadata } from "@/lib/seo";

// The page is a client component, so its metadata lives here.
export const metadata = pageMetadata({
  title: "Wishlist",
  description: "The pieces you have saved at UMA Designers.",
  path: "/wishlist",
  noIndex: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
