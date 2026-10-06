"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/context/store";
import { api, errorMessage } from "@/lib/api";
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

  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Please enter a valid email", undefined, "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api<{ alreadySubscribed: boolean }>("/api/newsletter", { body: { email } });
      if (res.alreadySubscribed) {
        showToast("You're already subscribed", "We'll keep you posted on new collections.", "info");
      } else {
        showToast("Welcome to the UMA world", "You'll be first to hear about new collections.");
      }
      setEmail("");
    } catch (error) {
      showToast("Couldn't subscribe", errorMessage(error), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-7 text-center lg:flex-row lg:justify-between lg:text-left",
        className
      )}
    >
      <div className="max-w-xl">
        <h3
          className={cn(
            "type-heading-xl text-balance",
            dark ? "text-ivory" : "text-charcoal"
          )}
        >
          Stay Close to the Collection
        </h3>
        <p className={cn("mt-3 text-sm leading-relaxed", dark ? "text-ivory/70" : "text-mist")}>
          Be the first to discover new arrivals, festive edits and exclusive boutique
          releases.
        </p>
      </div>
      <form onSubmit={submit} className="w-full max-w-md" noValidate>
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
            autoComplete="email"
            aria-label="Email address"
            className={cn(
              "w-full min-w-0 flex-1 bg-transparent px-4 text-sm focus:outline-none",
              dark ? "text-ivory placeholder:text-ivory/60" : "text-charcoal placeholder:text-taupe"
            )}
          />
          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "type-btn inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-5 transition-colors disabled:opacity-60",
              dark
                ? "bg-ivory text-charcoal hover:bg-white"
                : "bg-charcoal text-ivory hover:bg-ink"
            )}
          >
            {submitting ? "Subscribing…" : "Subscribe"}
            <ArrowRight width={14} height={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
