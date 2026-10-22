import Link from "next/link";
import { customizationRows, MEASUREMENT_FIELDS } from "@/lib/blouse";
import { breakdownLines } from "@/lib/blouse-pricing";
import { CUSTOM_BLOUSE_STATUSES } from "@/lib/status";
import { formatDate, formatINR } from "@/lib/utils";
import { listCustomBlouses } from "@/server/services/orders";
import { StatusSelect } from "@/components/admin/controls";
import { EmptyRow, PageTitle } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata = { title: "Custom Blouses" };

export default async function AdminCustomOrdersPage() {
  const blouses = await listCustomBlouses();

  return (
    <>
      <PageTitle
        title="Custom Blouses"
        description="Bespoke blouse orders — review the design, then move each piece through the atelier."
      />
      {blouses.length === 0 ? (
        <EmptyRow>No bespoke orders yet.</EmptyRow>
      ) : (
        <ul className="space-y-6">
          {blouses.map((b) => {
            const c = b.customization;
            return (
              <li key={b.id} className="rounded-2xl border border-clay/60 bg-white/60 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-medium text-charcoal">{b.id}</h3>
                    <p className="mt-0.5 text-xs text-mist">
                      {b.customerName} · {b.customerEmail} · {formatDate(b.createdAt)} ·{" "}
                      <Link href={`/admin/orders/${b.orderId}`} className="text-gold-deep underline underline-offset-4">
                        Order {b.orderId}
                      </Link>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium tabular-nums text-charcoal">{formatINR(b.price)}</span>
                    <StatusBadge status={b.status} />
                    <StatusSelect
                      endpoint={`/api/admin/custom-blouses/${b.id}`}
                      value={b.status}
                      options={CUSTOM_BLOUSE_STATUSES}
                      label={`Status for ${b.id}`}
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr_auto]">
                  <div className="rounded-xl bg-cream/60 p-4">
                    <h4 className="eyebrow mb-3 text-gold-deep">Design</h4>
                    <dl className="space-y-1.5 text-sm">
                      {customizationRows(c)
                        .filter((r) => r.label !== "Measurements")
                        .map((r) => (
                          <div key={r.label} className="flex justify-between gap-3">
                            <dt className="text-mist">{r.label}</dt>
                            <dd className="text-right text-charcoal">{r.value}</dd>
                          </div>
                        ))}
                    </dl>
                    {c.pricing && (
                      <>
                        <h4 className="eyebrow mb-2 mt-4 text-gold-deep">Price at order time</h4>
                        <dl className="space-y-1 text-sm">
                          {breakdownLines(c.pricing).map((line) => (
                            <div key={line.label} className="flex justify-between gap-3">
                              <dt className="text-mist">{line.label}</dt>
                              <dd className="tabular-nums text-charcoal">{formatINR(line.amount)}</dd>
                            </div>
                          ))}
                          <div className="flex justify-between gap-3 border-t border-clay/60 pt-1 font-medium">
                            <dt className="text-charcoal">Total</dt>
                            <dd className="tabular-nums text-charcoal">{formatINR(c.pricing.total)}</dd>
                          </div>
                        </dl>
                      </>
                    )}
                  </div>
                  <div className="rounded-xl bg-cream/60 p-4">
                    <h4 className="eyebrow mb-3 text-gold-deep">
                      Measurements (in){c.measurementProfile ? ` · ${c.measurementProfile}` : ""}
                    </h4>
                    <dl className="space-y-1.5 text-sm">
                      {MEASUREMENT_FIELDS.map((f) => (
                        <div key={f.id} className="flex justify-between gap-3">
                          <dt className="text-mist">{f.label}</dt>
                          <dd className="tabular-nums text-charcoal">{c.measurements?.[f.id] ? `${c.measurements[f.id]}"` : "—"}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div className="lg:w-44">
                    <h4 className="eyebrow mb-3 text-gold-deep">Reference</h4>
                    {c.referenceImage ? (
                      <a href={c.referenceImage} target="_blank" rel="noopener noreferrer" className="block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={c.referenceImage}
                          alt={`Reference image for ${b.id}`}
                          loading="lazy"
                          className="aspect-[4/5] w-full rounded-lg object-cover"
                        />
                      </a>
                    ) : (
                      <p className="text-sm text-mist">No reference image.</p>
                    )}
                  </div>
                </div>

                {c.instructions && (
                  <p className="mt-4 rounded-xl border border-clay/60 px-4 py-3 text-sm italic text-mist">
                    “{c.instructions}”
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
