import Link from "next/link";
import { PackagePlus, Pencil } from "lucide-react";
import { CATEGORY_OPTIONS } from "@/lib/config";
import { stockState } from "@/lib/status";
import { formatINR } from "@/lib/utils";
import { listProductRows } from "@/server/services/products";
import { ActionButton, InlineField } from "@/components/admin/controls";
import { AdminCard, AdminTable, EmptyRow, PageTitle, Td } from "@/components/admin/ui";
import { LinkButton } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata = { title: "Products" };

const STOCK_FILTERS = [
  { id: "low", label: "Low stock" },
  { id: "out", label: "Out of stock" },
  { id: "hidden", label: "Hidden" },
];

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; stock?: string }>;
}) {
  const { q, category, stock } = await searchParams;
  let rows = await listProductRows({ includeInactive: true, search: q, category });
  if (stock === "low") rows = rows.filter((r) => stockState(r) === "Low Stock");
  if (stock === "out") rows = rows.filter((r) => stockState(r) === "Out of Stock");
  if (stock === "hidden") rows = rows.filter((r) => !r.isActive);

  const select =
    "h-10 rounded-full border border-clay bg-white/70 px-4 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold-soft/40";

  return (
    <>
      <PageTitle
        title="Products"
        description={`${rows.length} product${rows.length === 1 ? "" : "s"} shown.`}
        action={
          <LinkButton href="/admin/products/new" variant="gold" size="sm">
            <PackagePlus width={14} height={14} />
            Add Product
          </LinkButton>
        }
      />

      <form method="get" className="mb-5 flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name, fabric, SKU…"
          aria-label="Search products"
          className={`${select} min-w-0 flex-1 sm:max-w-xs`}
        />
        <select name="category" defaultValue={category ?? ""} aria-label="Category" className={select}>
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select name="stock" defaultValue={stock ?? ""} aria-label="Stock" className={select}>
          <option value="">Any stock level</option>
          {STOCK_FILTERS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        <button type="submit" className="h-10 rounded-full bg-charcoal px-5 text-xs font-medium uppercase tracking-[0.14em] text-ivory hover:bg-ink">
          Filter
        </button>
        {(q || category || stock) && (
          <Link href="/admin/products" className="text-xs text-mist underline underline-offset-4 hover:text-charcoal">
            Clear
          </Link>
        )}
      </form>

      <AdminCard>
        {rows.length === 0 ? (
          <EmptyRow>No products match these filters.</EmptyRow>
        ) : (
          <AdminTable head={["Product", "Category", "Price", "Stock", "Status", "Actions"]} minWidth={900}>
            {rows.map((p) => {
              const state = stockState(p);
              return (
                <tr key={p.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="h-12 w-10 shrink-0 overflow-hidden rounded bg-cream">
                        {p.images[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <Link href={`/admin/products/${p.id}/edit`} className="block max-w-[240px] truncate font-medium text-charcoal hover:text-gold-deep">
                          {p.name}
                        </Link>
                        <span className="block text-xs text-mist">{p.sku || p.slug}</span>
                      </span>
                    </div>
                  </Td>
                  <Td className="capitalize text-mist">{p.category}</Td>
                  <Td className="tabular-nums text-charcoal">
                    {formatINR(p.price)}
                    {p.mrp && p.mrp > p.price && (
                      <span className="block text-xs text-mist line-through">{formatINR(p.mrp)}</span>
                    )}
                  </Td>
                  <Td>
                    {p.deliveryType === "made_to_order" ? (
                      <span className="text-xs text-mist">Not tracked</span>
                    ) : (
                      <InlineField
                        key={p.stock}
                        endpoint={`/api/admin/products/${p.id}/stock`}
                        field="stock"
                        type="number"
                        transform="number"
                        initial={String(p.stock)}
                        label={`Stock for ${p.name}`}
                        buttonLabel="Set"
                      />
                    )}
                  </Td>
                  <Td>
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={state} />
                      {!p.isActive && <StatusBadge status="Inactive" />}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      {p.deliveryType === "ready" && p.stock > 0 && (
                        <ActionButton
                          endpoint={`/api/admin/products/${p.id}/stock`}
                          body={{ adjust: -1 }}
                          success="Store sale recorded"
                          ariaLabel={`Record a store sale of ${p.name}`}
                        >
                          Store sale −1
                        </ActionButton>
                      )}
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-clay px-3.5 text-xs font-medium text-charcoal hover:border-charcoal"
                      >
                        <Pencil width={12} height={12} />
                        Edit
                      </Link>
                      <ActionButton
                        endpoint={`/api/admin/products/${p.id}`}
                        method="DELETE"
                        variant="danger"
                        confirm={`Delete “${p.name}” permanently? Past orders keep their record of it.`}
                        success="Product deleted"
                        ariaLabel={`Delete ${p.name}`}
                      >
                        Delete
                      </ActionButton>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </AdminTable>
        )}
      </AdminCard>
    </>
  );
}
