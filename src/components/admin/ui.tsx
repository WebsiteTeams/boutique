import Link from "next/link";
import { cn } from "@/lib/utils";

/** Shared admin building blocks, matching the storefront's card and table styling. */

export function AdminCard({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-clay/60 bg-white/60 p-6", className)}>
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="text-base font-medium text-charcoal">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function AdminTable({
  head,
  children,
  minWidth = 640,
}: {
  head: string[];
  children: React.ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-clay/60 text-xs uppercase tracking-[0.14em] text-taupe">
            {head.map((h) => (
              <th key={h} scope="col" className="pb-3 pr-4 font-medium last:pr-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-clay/40">{children}</tbody>
      </table>
    </div>
  );
}

export const Td = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <td className={cn("py-3.5 pr-4 align-middle last:pr-0", className)}>{children}</td>
);

export function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-cream/50 p-8 text-center text-sm text-mist">{children}</p>;
}

/** Filter pills driven by a `?status=` style query parameter. */
export function FilterTabs({
  basePath,
  param = "status",
  current,
  options,
}: {
  basePath: string;
  param?: string;
  current?: string;
  options: readonly string[];
}) {
  const pill = (label: string, value?: string) => {
    const active = (current ?? "") === (value ?? "");
    return (
      <Link
        key={label}
        href={value ? `${basePath}?${param}=${encodeURIComponent(value)}` : basePath}
        aria-current={active ? "page" : undefined}
        className={cn(
          "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
          active ? "border-charcoal bg-charcoal text-ivory" : "border-clay text-mist hover:border-charcoal hover:text-charcoal"
        )}
      >
        {label}
      </Link>
    );
  };
  return (
    <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
      {pill("All")}
      {options.map((o) => pill(o, o))}
    </div>
  );
}

export function PageTitle({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="type-heading-lg text-charcoal">{title}</h2>
        {description && <p className="mt-1 text-sm text-mist">{description}</p>}
      </div>
      {action}
    </div>
  );
}
