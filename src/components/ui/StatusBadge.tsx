import { statusTone } from "@/lib/status";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium",
        statusTone(status),
        className
      )}
    >
      {status}
    </span>
  );
}
