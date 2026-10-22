import { pageMetadata } from "@/lib/seo";

// The page is a client component, so its metadata lives here.
export const metadata = pageMetadata({
  title: "About UMA Designers",
  description: "The story of UMA Designers — a T. Nagar atelier pairing handloom weaves with made-to-measure tailoring for sarees, chudithars and bespoke blouses.",
  path: "/about",
  image: "/images/brand-story.png",
  absoluteTitle: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
