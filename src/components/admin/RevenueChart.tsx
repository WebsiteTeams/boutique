"use client";

import { useId, useState } from "react";
import { cn, formatINR, formatINRShort } from "@/lib/utils";

interface Month {
  month: string;
  label: string;
  revenue: number;
  orders: number;
}

/** Rounds up to a clean axis maximum (1, 2, 2.5 or 5 × a power of ten). */
function niceMax(value: number) {
  if (value <= 0) return 1000;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= value)!;
  return step * power;
}

/** Monthly revenue as columns, with a hover/focus tooltip and an accessible table view. */
export function RevenueChart({ data }: { data: Month[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();
  const max = niceMax(Math.max(...data.map((d) => d.revenue)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const current = data.length - 1;

  return (
    <div>
      {showTable ? (
        <table id={tableId} className="w-full text-sm">
          <caption className="sr-only">Revenue and orders by month</caption>
          <thead>
            <tr className="border-b border-clay/60 text-left text-xs uppercase tracking-[0.12em] text-taupe">
              <th scope="col" className="pb-2 font-medium">Month</th>
              <th scope="col" className="pb-2 text-right font-medium">Orders</th>
              <th scope="col" className="pb-2 text-right font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clay/40">
            {data.map((d) => (
              <tr key={d.month}>
                <th scope="row" className="py-2 text-left font-normal text-charcoal">{d.label}</th>
                <td className="py-2 text-right tabular-nums text-mist">{d.orders}</td>
                <td className="py-2 text-right tabular-nums text-charcoal">{formatINR(d.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="flex gap-3" aria-hidden={false}>
          {/* Y axis */}
          <div className="relative h-56 w-12 shrink-0 text-right text-[0.68rem] tabular-nums text-taupe" aria-hidden>
            {ticks.map((t) => (
              <span key={t} className="absolute right-0 -translate-y-1/2" style={{ bottom: `${(t / max) * 100}%` }}>
                {t === 0 ? "₹0" : formatINRShort(t)}
              </span>
            ))}
          </div>

          <div className="relative min-w-0 flex-1">
            {/* Gridlines */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-56" aria-hidden>
              {ticks.map((t) => (
                <span
                  key={t}
                  className={cn("absolute inset-x-0 h-px", t === 0 ? "bg-clay" : "bg-clay/45")}
                  style={{ bottom: `${(t / max) * 100}%` }}
                />
              ))}
            </div>

            {/* Columns */}
            <ul className="relative flex h-56 items-end" aria-label="Monthly revenue">
              {data.map((d, i) => {
                const height = (d.revenue / max) * 100;
                const isActive = active === i;
                return (
                  <li key={d.month} className="relative flex h-full flex-1 justify-center">
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive(i)}
                      onBlur={() => setActive(null)}
                      aria-label={`${d.label}: ${formatINR(d.revenue)} from ${d.orders} ${d.orders === 1 ? "order" : "orders"}`}
                      className="group flex h-full w-full items-end justify-center rounded-md focus-visible:outline-2 focus-visible:outline-gold"
                    >
                      <span
                        className={cn(
                          "block w-full max-w-6 rounded-t-[4px] transition-colors",
                          i === current ? "bg-gold" : isActive ? "bg-taupe" : "bg-gold-soft/70"
                        )}
                        style={{ height: d.revenue > 0 ? `max(${height}%, 3px)` : "0px" }}
                      />
                    </button>

                    {/* Direct label on the current month only */}
                    {i === current && !isActive && d.revenue > 0 && (
                      <span
                        className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap pb-1.5 text-xs font-medium tabular-nums text-charcoal"
                        style={{ bottom: `${height}%` }}
                        aria-hidden
                      >
                        {formatINRShort(d.revenue)}
                      </span>
                    )}

                    {isActive && (
                      <span
                        role="tooltip"
                        className={cn(
                          "pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-charcoal px-3 py-2 text-xs text-ivory shadow-lifted",
                          i === 0 ? "left-0" : i === data.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2"
                        )}
                        style={{ bottom: `calc(${Math.min(height, 70)}% + 8px)` }}
                      >
                        <span className="block text-ivory/70">{d.label}</span>
                        <span className="block font-semibold tabular-nums">{formatINR(d.revenue)}</span>
                        <span className="block text-ivory/70">
                          {d.orders} {d.orders === 1 ? "order" : "orders"}
                        </span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* X axis */}
            <div className="mt-2 flex" aria-hidden>
              {data.map((d, i) => (
                <span
                  key={d.month}
                  className={cn(
                    "flex-1 text-center text-[0.68rem] uppercase tracking-wide",
                    i === current ? "font-semibold text-charcoal" : "text-taupe"
                  )}
                >
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => setShowTable((s) => !s)}
          aria-expanded={showTable}
          aria-controls={showTable ? tableId : undefined}
          className="min-h-9 rounded-full px-3 text-xs font-medium text-mist underline underline-offset-4 hover:text-charcoal focus-visible:outline-2 focus-visible:outline-gold"
        >
          {showTable ? "View as chart" : "View as table"}
        </button>
      </div>
    </div>
  );
}
