"use client";

import { Modal } from "@/components/ui/Modal";
import { sizeGuideRows } from "@/lib/data";

export function SizeGuide({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Size Guide" className="max-w-3xl">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-xl bg-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/custom-blouse/size-guide.png"
            alt="Custom blouse measurement size guide: bust, shoulder, waist, armhole, sleeve length, blouse length and neck depth"
            className="h-auto w-full object-contain"
          />
        </div>

        <div>
          <h4 className="mb-1 text-sm font-medium text-charcoal">How to measure</h4>
          <p className="text-sm leading-relaxed text-mist">
            Measure around the fullest part of your bust keeping the tape comfortably
            firm. For the waist, measure the narrowest point. The size chart below uses
            your bust as the primary fit reference.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-clay">
                <th className="py-2.5 pr-4 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-charcoal">Size</th>
                <th className="py-2.5 pr-4 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-charcoal">Bust (in)</th>
                <th className="py-2.5 pr-4 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-charcoal">Waist (in)</th>
                <th className="py-2.5 pr-4 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-charcoal">Hip (in)</th>
                <th className="py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-charcoal">Shoulder (in)</th>
              </tr>
            </thead>
            <tbody>
              {sizeGuideRows.map((row) => (
                <tr key={row.size} className="border-b border-clay/50 last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-charcoal">{row.size}</td>
                  <td className="py-2.5 pr-4 text-mist">{row.bust}</td>
                  <td className="py-2.5 pr-4 text-mist">{row.waist}</td>
                  <td className="py-2.5 pr-4 text-mist">{row.hip}</td>
                  <td className="py-2.5 text-mist">{row.shoulder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="rounded-lg bg-cream p-4 text-xs leading-relaxed text-mist">
          Between sizes? We recommend the larger size for a relaxed fit. For custom
          blouses, enter your exact measurements and our tailor will confirm before
          stitching.
        </p>
      </div>
    </Modal>
  );
}
