"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/context/store";
import { cn } from "@/lib/utils";

export function Newsletter({
  dark,
  className,
}: {
  dark?: boolean;
  className?: string;
}) {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Please enter a valid email", undefined, "error");
      return;
    }
    showToast("Welcome to the UMA world", "You'll be first to hear about new collections.");
    setEmail("");
  };

  return (
    <div
      className={cn(
        "flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="max-w-md">
        <p
          className={cn(
            "eyebrow mb-3",
            dark ? "text-gold-soft" : "text-gold-deep"
          )}
        >
          The Edit
        </p>
        <h3
          className={cn(
            "serif-display text-2xl sm:text-[1.7rem]",
            dark ? "text-ivory" : "text-charcoal"
          )}
        >
          Join our world of timeless style.
        </h3>
        <p className={cn("mt-2 text-sm leading-relaxed", dark ? "text-ivory/60" : "text-mist")}>
          Early access to collections, styling notes and private previews. No noise, ever.
        </p>
      </div>
      <form onSubmit={submit} className="w-full sm:w-auto" noValidate>
        <div
          className={cn(
            "flex items-center gap-2 rounded-full border p-1.5 transition-colors focus-within:border-gold",
            dark ? "border-ivory/25" : "border-clay bg-white/60"
          )}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            aria-label="Email address"
            className={cn(
              "w-full min-w-0 flex-1 bg-transparent px-4 text-sm focus:outline-none sm:w-64",
              dark ? "text-ivory placeholder:text-ivory/40" : "text-charcoal placeholder:text-taupe"
            )}
          />
          <button
            type="submit"
            className={cn(
              "inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-5 text-[0.68rem] font-medium uppercase tracking-[0.18em] transition-colors",
              dark
                ? "bg-ivory text-charcoal hover:bg-white"
                : "bg-charcoal text-ivory hover:bg-ink"
            )}
          >
            Subscribe
            <ArrowRight width={14} height={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
