"use client";

import { useState } from "react";
import type { BlouseCatalog, CatalogDesign } from "@/lib/blouse-pricing";
import { cn } from "@/lib/utils";
import { BlouseDesignsManager } from "@/components/admin/BlouseDesignsManager";
import { BlousePricingEditor } from "@/components/admin/BlousePricingEditor";

const TABS = [
  { id: "pricing", label: "Pricing & options" },
  { id: "designs", label: "Designs" },
] as const;

/** Admin home for everything the custom blouse builder offers and charges. */
export function BlouseStudio({ initial }: { initial: BlouseCatalog }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("pricing");
  const [designs, setDesigns] = useState<CatalogDesign[]>(initial.designs);

  return (
    <div>
      <div role="tablist" aria-label="Custom blouse settings" className="mb-6 flex gap-1 border-b border-clay/60">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px min-h-11 border-b-2 px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-gold",
              tab === t.id ? "border-charcoal text-charcoal" : "border-transparent text-mist hover:text-charcoal"
            )}
          >
            {t.label}
            {t.id === "designs" && <span className="ml-2 text-xs text-taupe">{designs.length}</span>}
          </button>
        ))}
      </div>

      {/* Both panels stay mounted so unsaved price edits survive switching tabs. */}
      <div id="panel-pricing" role="tabpanel" aria-labelledby="tab-pricing" hidden={tab !== "pricing"}>
        <BlousePricingEditor initial={initial} designs={designs} />
      </div>
      <div id="panel-designs" role="tabpanel" aria-labelledby="tab-designs" hidden={tab !== "designs"}>
        <BlouseDesignsManager designs={designs} onChange={setDesigns} />
      </div>
    </div>
  );
}
