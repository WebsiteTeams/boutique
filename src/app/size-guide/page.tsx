import { pageMetadata } from "@/lib/seo";
import { Ruler } from "lucide-react";
import { chuditharSizes, sizeGuideRows } from "@/lib/data";
import { MEASUREMENT_FIELDS } from "@/lib/blouse";
import { InfoPage } from "@/components/ui/InfoPage";
import { LinkButton } from "@/components/ui/Button";

export const metadata = pageMetadata({
  title: "Size Guide",
  description: "Chudithar size chart and how to measure bust, waist, hip and shoulder for the right fit at UMA Designers.",
  path: "/size-guide",
});

const TIPS = [
  { k: "Bust", v: "Measure around the fullest part of your chest, keeping the tape level." },
  { k: "Waist", v: "Measure around your natural waistline — the narrowest point, above the navel." },
  { k: "Hips", v: "Measure around the fullest part of your hips, about 8–9 inches below the waist." },
  { k: "Shoulder", v: "Measure from the edge of one shoulder to the other, across the back." },
];

export default function SizeGuidePage() {
  return (
    <InfoPage
      eyebrow="Size Guide"
      title="Find Your Perfect Fit"
      intro="Measurements below are in inches. When in doubt between two sizes, we recommend sizing up for comfort."
    >
      <section className="overflow-hidden rounded-2xl border border-clay/60 bg-white/60">
        <div className="border-b border-clay/60 bg-cream/70 px-6 py-4">
          <h2 className="type-heading-md text-charcoal">Chudithar Size Chart</h2>
          <p className="mt-0.5 text-xs text-mist">All measurements in inches</p>
        </div>
        <p className="px-4 pt-3 text-xs text-taupe min-[400px]:hidden" aria-hidden>
          Scroll sideways to see every column.
        </p>
        <div className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-gold" tabIndex={0} aria-label="Chudithar size chart">
          <table className="w-full min-w-[340px] text-left text-sm">
            <caption className="sr-only">Chudithar sizes with bust, waist, hip and shoulder measurements in inches</caption>
            <thead>
              <tr className="border-b border-clay/60 text-[0.68rem] uppercase tracking-[0.08em] text-taupe sm:text-xs sm:tracking-[0.14em]">
                <th scope="col" className="px-3 py-3 font-medium sm:px-6">Size</th>
                <th scope="col" className="px-3 py-3 font-medium sm:px-6">Bust</th>
                <th scope="col" className="px-3 py-3 font-medium sm:px-6">Waist</th>
                <th scope="col" className="px-3 py-3 font-medium sm:px-6">Hip</th>
                <th scope="col" className="px-3 py-3 font-medium sm:px-6">Shoulder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clay/40">
              {sizeGuideRows.map((r) => (
                <tr key={r.size} className={r.size === "L" ? "bg-cream/40" : ""}>
                  <th scope="row" className="px-3 py-3.5 font-medium text-charcoal sm:px-6">{r.size}</th>
                  <td className="px-3 py-3.5 tabular-nums text-charcoal/75 sm:px-6">{r.bust}</td>
                  <td className="px-3 py-3.5 tabular-nums text-charcoal/75 sm:px-6">{r.waist}</td>
                  <td className="px-3 py-3.5 tabular-nums text-charcoal/75 sm:px-6">{r.hip}</td>
                  <td className="px-3 py-3.5 tabular-nums text-charcoal/75 sm:px-6">{r.shoulder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="type-heading-md mb-4 text-charcoal">How to Measure</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TIPS.map((t) => (
            <div key={t.k} className="flex gap-4 rounded-xl border border-clay/60 bg-white/60 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-gold-deep">
                <Ruler width={17} height={17} />
              </span>
              <div>
                <h3 className="text-sm font-medium text-charcoal">{t.k}</h3>
                <p className="mt-1 text-sm leading-relaxed text-mist">{t.v}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="blouse-measure">
        <h2 id="blouse-measure" className="type-heading-md mb-1.5 text-charcoal">Measuring for a Custom Blouse</h2>
        <p className="mb-5 text-sm leading-relaxed text-mist">
          Bespoke blouses are cut to your own measurements. The numbers on the drawing match the
          fields in our custom blouse builder.
        </p>
        <div className="grid items-center gap-6 rounded-2xl border border-clay/60 bg-white/60 p-5 sm:grid-cols-2 sm:p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/custom-blouse/size-guide.svg"
            alt="Blouse drawing with numbered measuring lines for bust, waist, shoulder, armhole, sleeve length and blouse length"
            width={300}
            height={208}
            className="mx-auto h-auto w-full max-w-[300px] rounded-xl bg-cream p-3"
          />
          <ol className="space-y-3">
            {MEASUREMENT_FIELDS.map((f, i) => (
              <li key={f.id} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-[0.68rem] font-bold text-white" aria-hidden>
                  {i + 1}
                </span>
                <span>
                  <span className="block text-sm font-medium text-charcoal">
                    <span className="sr-only">{i + 1}. </span>
                    {f.label}
                  </span>
                  <span className="block text-sm leading-relaxed text-mist">{f.how}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mt-10 rounded-2xl bg-cream/70 p-6">
        <h2 className="type-heading-md text-charcoal">Not sure about sizes?</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-mist">
          For sarees, the blouse piece and saree are one-size with generous allowance. For
          bespoke blouses we stitch around <em>your</em> measurements — no chart required.
        </p>
        <p className="mt-2 text-sm text-mist">
          Available sizes: {chuditharSizes.join(" · ")}
        </p>
        <div className="mt-5">
          <LinkButton href="/custom-blouse" variant="gold" size="sm">
            Start a Bespoke Blouse
          </LinkButton>
        </div>
      </section>
    </InfoPage>
  );
}
