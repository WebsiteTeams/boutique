"use client";

import { useEffect } from "react";
import { Button, LinkButton } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 pb-20 pt-32 text-center sm:px-8"
      role="alert"
    >
      <p className="eyebrow mb-4 flex items-center gap-3 text-gold-deep">
        <span className="h-px w-8 bg-gold" />
        Something went wrong
        <span className="h-px w-8 bg-gold" />
      </p>
      <h1 className="type-display-lg text-charcoal">A stitch came loose</h1>
      <p className="mx-auto mt-5 max-w-md type-body leading-relaxed text-mist">
        We couldn&apos;t load this page just now. Please try again — your bag and wishlist are safe.
      </p>
      {error.digest && <p className="mt-3 text-xs text-taupe">Reference: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try Again</Button>
        <LinkButton href="/" variant="outline">
          Return Home
        </LinkButton>
      </div>
    </div>
  );
}
