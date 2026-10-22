"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({ title, children, defaultOpen }: AccordionItemProps) {
  const [open, setOpen] = useState(!!defaultOpen);
  const id = useId();
  const buttonId = `${id}-button`;
  const panelId = `${id}-panel`;
  return (
    <div className="border-b border-clay/70">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        id={buttonId}
        className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-gold"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="text-[0.95rem] font-medium tracking-wide text-charcoal">
          {title}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-gold-deep"
        >
          <ChevronDown width={18} height={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-sm leading-relaxed text-mist">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Accordion({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("border-t border-clay/70", className)}>{children}</div>;
}
