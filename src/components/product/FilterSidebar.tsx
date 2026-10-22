"use client";

import { Check, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterGroup {
  id: string;
  label: string;
  options: string[];
}

interface SortControl {
  value: string;
  options: { id: string; label: string }[];
  onChange: (value: string) => void;
}

interface FilterSidebarProps {
  groups: FilterGroup[];
  selected: Record<string, string[]>;
  onChange: (groupId: string, value: string) => void;
  onClear: () => void;
  className?: string;
  activeCount: number;
  onClose?: () => void;
  mobile?: boolean;
  /** Phones sort from inside the sheet, since the toolbar has no room for it. */
  sort?: SortControl;
  resultCount?: number;
}

export function FilterSidebar({
  groups,
  selected,
  onChange,
  onClear,
  className,
  activeCount,
  onClose,
  mobile,
  sort,
  resultCount,
}: FilterSidebarProps) {
  return (
    <div
      className={cn(
        "flex flex-col bg-ivory",
        mobile && "relative h-full w-[320px] max-w-full",
        className
      )}
    >
      {mobile && (
        <div className="flex items-center justify-between border-b border-clay/60 px-6 py-4">
          <h2 className="type-heading-md flex items-center gap-2 text-charcoal">
            <SlidersHorizontal width={16} height={16} aria-hidden />
            Filter &amp; Sort
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[0.65rem] text-white">
                {activeCount}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-charcoal hover:bg-sand/60"
            aria-label="Close filters"
          >
            <X width={18} height={18} />
          </button>
        </div>
      )}

      <div className={cn(mobile ? "flex-1 overflow-y-auto overscroll-contain px-6 py-6 pb-28" : "py-1")}>
        {mobile && sort && (
          <fieldset className="mb-8">
            <legend className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-charcoal">
              Sort by
            </legend>
            <div className="grid gap-0.5">
              {sort.options.map((o) => {
                const active = sort.value === o.id;
                return (
                  <label key={o.id} className="group flex min-h-10 cursor-pointer items-center gap-3 rounded-md">
                    <input
                      type="radio"
                      name="sort"
                      value={o.id}
                      checked={active}
                      onChange={() => sort.onChange(o.id)}
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-gold",
                        active ? "border-charcoal" : "border-taupe/60 group-hover:border-charcoal"
                      )}
                    >
                      {active && <span className="h-2 w-2 rounded-full bg-charcoal" />}
                    </span>
                    <span className={cn("text-sm", active ? "font-medium text-charcoal" : "text-charcoal/80")}>
                      {o.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <div className="mb-5 flex min-h-8 items-center justify-between">
          <span className="eyebrow text-gold-deep">Refine</span>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="min-h-8 px-1 text-xs font-medium text-charcoal underline underline-offset-4 transition-colors hover:text-gold-deep"
            >
              Clear all ({activeCount})
            </button>
          )}
        </div>

        <div className="space-y-7">
          {groups.map((group) => (
            <fieldset key={group.id}>
              <legend className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-charcoal">
                {group.label}
              </legend>
              <div className="grid gap-0.5">
                {group.options.map((option) => {
                  const isSelected = selected[group.id]?.includes(option) ?? false;
                  return (
                    <label
                      key={option}
                      className="group flex min-h-9 cursor-pointer items-center gap-3 rounded-md"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onChange(group.id, option)}
                        className="peer sr-only"
                      />
                      <span
                        className={cn(
                          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-gold peer-focus-visible:ring-offset-2",
                          isSelected
                            ? "border-charcoal bg-charcoal"
                            : "border-taupe/60 group-hover:border-charcoal"
                        )}
                        aria-hidden
                      >
                        {isSelected && <Check width={12} height={12} className="text-ivory" />}
                      </span>
                      <span
                        className={cn(
                          "text-sm leading-snug transition-colors duration-200",
                          isSelected ? "font-medium text-charcoal" : "text-charcoal/80 group-hover:text-charcoal"
                        )}
                      >
                        {option}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      {mobile && (
        <div className="absolute inset-x-0 bottom-0 border-t border-clay/60 bg-ivory p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="type-btn flex h-12 w-full items-center justify-center rounded-full bg-charcoal text-ivory transition-colors hover:bg-ink"
          >
            {resultCount === undefined ? "Show results" : `Show ${resultCount} ${resultCount === 1 ? "piece" : "pieces"}`}
          </button>
        </div>
      )}
    </div>
  );
}
