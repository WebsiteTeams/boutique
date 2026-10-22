import { pageMetadata } from "@/lib/seo";

// The page is a client component, so its metadata lives here.
export const metadata = pageMetadata({
  title: "Unsubscribe",
  description: "Stop receiving UMA Designers newsletter emails.",
  path: "/unsubscribe",
  noIndex: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
