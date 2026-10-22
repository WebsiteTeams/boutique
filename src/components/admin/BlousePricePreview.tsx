"use client";

import { useState } from "react";
import { breakdownLines, normaliseSelection, priceBlouse, type BlouseCatalog } from "@/lib/blouse-pricing";
import { DEFAULT_BLOUSE_OPTIONS } from "@/lib/blouse";
import { cn, formatINR } from "@/lib/utils";

const selectClass =
  "h-10 w-full min-w-0 rounded-lg border border-clay bg-white/70 px-3 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold-soft/40";

/**
 * Prices a sample blouse with the same function the builder and order API use.
 * `catalog` is what is on screen (possibly unsaved); `saved` is what customers see now.
 */
export function BlousePricePreview({ catalog, saved }: { catalog: BlouseCatalog; saved?: BlouseCatalog }) {
  const [choice, setChoice] = useState<{ designId: string | null; options: Record<string, string> }>({
    designId: null,
    options: {},
  });
  const selection = normaliseSelection(catalog, choice, DEFAULT_BLOUSE_OPTIONS);
  const result = priceBlouse(catalog, selection);
  const before = saved ? priceBlouse(saved, selection) : null;
  const activeDesigns = catalog.designs.filter((d) => d.isActive);
  const delta = result.ok && before?.ok ? result.breakdown.total - before.breakdown.total : 0;

  return (
    <div className="rounded-2xl border border-gold/40 bg-cream/60 p-5">
      <h2 className="text-base font-medium text-charcoal">Price preview</h2>
      <p className="mt-1 text-xs text-mist">Pick a sample blouse to see exactly what a customer would pay.</p>

      <div className="mt-4 grid gap-3">
        {activeDesigns.length > 0 && (
          <label className="grid gap-1 text-xs text-mist">
            Design
            <select
              className={selectClass}
              value={selection.designId ?? ""}
              onChange={(e) => setChoice((c) => ({ ...c, designId: e.target.value }))}
            >
              {activeDesigns.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.price > 0 ? `(+${formatINR(d.price)})` : "(included)"}
                </option>
              ))}
            </select>
          </label>
        )}
        {catalog.groups.map((g) => (
          <label key={g.id} className="grid gap-1 text-xs text-mist">
            {g.label}
            <select
              className={selectClass}
              value={selection.options[g.id] ?? ""}
              onChange={(e) => setChoice((c) => ({ ...c, options: { ...selection.options, [g.id]: e.target.value } }))}
            >
              {g.options
                .filter((o) => o.isActive)
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} {o.price > 0 ? `(+${formatINR(o.price)})` : "(included)"}
                  </option>
                ))}
            </select>
          </label>
        ))}
      </div>

      <div className="mt-5 border-t border-gold/30 pt-4" aria-live="polite">
        {result.ok ? (
          <>
            <dl className="space-y-1.5 text-sm">
              {breakdownLines(result.breakdown).map((line, i) => (
                <div key={line.label} className="flex justify-between gap-3">
                  <dt className="min-w-0 text-mist">{line.label}</dt>
                  <dd className="shrink-0 tabular-nums text-charcoal">
                    {i === 0 ? "" : "+"}
                    {formatINR(line.amount)}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex items-baseline justify-between border-t border-gold/30 pt-3">
              <span className="text-sm font-medium text-charcoal">Customer pays</span>
              <span className="type-price-lg tabular-nums text-charcoal">{formatINR(result.breakdown.total)}</span>
            </div>
            {saved && before?.ok && (
              <p className={cn("mt-1 text-right text-xs", delta === 0 ? "text-mist" : delta > 0 ? "text-amber-800" : "text-green-800")}>
                {delta === 0
                  ? "Same as the live price"
                  : `${delta > 0 ? "+" : "−"}${formatINR(Math.abs(delta))} vs live price ${formatINR(before.breakdown.total)}`}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-amber-800">{result.reason}</p>
        )}
      </div>
    </div>
  );
}
