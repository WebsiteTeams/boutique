import { pageMetadata } from "@/lib/seo";

// The page is a client component, so its metadata lives here.
export const metadata = pageMetadata({
  title: "Returns & Exchanges",
  description: "How to return or exchange an UMA Designers order, including timelines, refunds and the rules for made-to-order pieces.",
  path: "/returns",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
