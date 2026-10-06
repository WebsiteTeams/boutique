import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 pb-20 pt-32 text-center sm:px-8">
      <p className="eyebrow mb-4 flex items-center gap-3 text-gold-deep">
        <span className="h-px w-8 bg-gold" />
        404
        <span className="h-px w-8 bg-gold" />
      </p>
      <h1 className="type-display-lg text-charcoal">This piece has left the collection</h1>
      <p className="mx-auto mt-5 max-w-md type-body leading-relaxed text-mist">
        The page you are looking for may have moved, sold out or never existed. Let us help you find
        something beautiful instead.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton href="/">Return Home</LinkButton>
        <LinkButton href="/shop" variant="outline">
          Browse the Collection
        </LinkButton>
      </div>
    </div>
  );
}
