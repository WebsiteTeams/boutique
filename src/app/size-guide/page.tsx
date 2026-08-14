import { Ruler } from "lucide-react";
import { chuditharSizes, sizeGuideRows } from "@/lib/data";
import { InfoPage } from "@/components/ui/InfoPage";
import { LinkButton } from "@/components/ui/Button";

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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-clay/60 text-xs uppercase tracking-[0.14em] text-taupe">
                <th className="px-6 py-3 font-medium">Size</th>
                <th className="px-6 py-3 font-medium">Bust</th>
                <th className="px-6 py-3 font-medium">Waist</th>
                <th className="px-6 py-3 font-medium">Hip</th>
                <th className="px-6 py-3 font-medium">Shoulder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clay/40">
              {sizeGuideRows.map((r) => (
                <tr key={r.size} className={r.size === "L" ? "bg-cream/40" : ""}>
                  <td className="px-6 py-3.5 font-medium text-charcoal">{r.size}</td>
                  <td className="px-6 py-3.5 tabular-nums text-mist">{r.bust}</td>
                  <td className="px-6 py-3.5 tabular-nums text-mist">{r.waist}</td>
                  <td className="px-6 py-3.5 tabular-nums text-mist">{r.hip}</td>
                  <td className="px-6 py-3.5 tabular-nums text-mist">{r.shoulder}</td>
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
