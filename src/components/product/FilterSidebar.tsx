"use client";

import { motion } from "framer-motion";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterGroup {
  id: string;
  label: string;
  options: string[];
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
}: FilterSidebarProps) {
  return (
    <motion.div
      initial={mobile ? { x: -320 } : false}
      animate={mobile ? { x: 0 } : false}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex h-full w-[300px] flex-col overflow-y-auto bg-ivory",
        !mobile && "w-auto lg:block lg:max-h-[calc(100vh-10rem)]",
        className
      )}
    >
      {mobile && (
        <div className="flex items-center justify-between border-b border-clay/60 px-6 py-5">
          <h3 className="type-heading-md flex items-center gap-2 text-charcoal">
            <SlidersHorizontal width={16} height={16} />
            Filters
            {activeCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[0.65rem] text-white">
                {activeCount}
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-charcoal hover:bg-sand/60"
            aria-label="Close filters"
          >
            <X width={18} height={18} />
          </button>
        </div>
      )}

      <div className={cn("px-6 py-6", mobile && "pb-24")}>
        <div className="mb-6 flex items-center justify-between">
          <span className="eyebrow text-gold-deep">Refine</span>
          {activeCount > 0 && (
            <button
              onClick={onClear}
              className="text-xs font-medium text-charcoal underline underline-offset-4 transition-colors hover:text-gold-deep"
            >
              Clear all ({activeCount})
            </button>
          )}
        </div>

        <div className="space-y-7">
          {groups.map((group) => (
            <fieldset key={group.id}>
              <legend className="mb-3 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-charcoal">
                {group.label}
              </legend>
              <div className="space-y-2.5">
                {group.options.map((option) => {
                  const isSelected = selected[group.id]?.includes(option) ?? false;
                  return (
                    <label
                      key={option}
                      onMouseDown={(e) => e.preventDefault()}
                      className="group flex cursor-pointer items-center gap-3"
                    >
                      <span
                        className={cn(
                          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-all",
                          isSelected
                            ? "border-charcoal bg-charcoal"
                            : "border-taupe/50 group-hover:border-charcoal"
                        )}
                      >
                        {isSelected && <Check width={12} height={12} className="text-ivory" />}
                      </span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onChange(group.id, option)}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          "text-sm transition-colors",
                          isSelected ? "text-charcoal" : "text-mist group-hover:text-charcoal"
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
            onClick={onClose}
            className="type-btn flex h-12 w-full items-center justify-center rounded-full bg-charcoal text-ivory"
          >
            Show results
          </button>
        </div>
      )}
    </motion.div>
  );
}
