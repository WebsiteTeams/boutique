import Link from "next/link";
import { REVIEW_STATUSES } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import { listAllReviews } from "@/server/services/boutique";
import { ActionButton, StatusSelect } from "@/components/admin/controls";
import { EmptyRow, FilterTabs, PageTitle } from "@/components/admin/ui";
import { Rating } from "@/components/ui/Rating";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = REVIEW_STATUSES.find((s) => s === status);
  const reviews = await listAllReviews(filter);

  return (
    <>
      <PageTitle
        title="Reviews"
        description="Only approved reviews appear on product pages and count towards ratings."
      />
      <FilterTabs basePath="/admin/reviews" current={filter} options={REVIEW_STATUSES} />
      {reviews.length === 0 ? (
        <EmptyRow>No {filter ? filter.toLowerCase() : ""} reviews.</EmptyRow>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-clay/60 bg-white/60 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link href={`/product/${r.productSlug}`} className="font-medium text-charcoal hover:text-gold-deep">
                    {r.productName}
                  </Link>
                  <p className="mt-0.5 text-xs text-mist">
                    {r.author} · {formatDate(r.createdAt)}
                    {r.verifiedPurchase ? " · Verified purchase" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status} />
                  <StatusSelect
                    endpoint={`/api/admin/reviews/${r.id}`}
                    value={r.status}
                    options={REVIEW_STATUSES}
                    label={`Moderation status for review by ${r.author}`}
                  />
                  <ActionButton
                    endpoint={`/api/admin/reviews/${r.id}`}
                    method="DELETE"
                    variant="danger"
                    confirm="Delete this review permanently?"
                    success="Review deleted"
                  >
                    Delete
                  </ActionButton>
                </div>
              </div>
              <Rating value={r.rating} className="mt-3" />
              {r.title && <p className="mt-2 text-sm font-medium text-charcoal">{r.title}</p>}
              <p className="mt-1 text-sm leading-relaxed text-mist">{r.comment}</p>
              {r.images.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {r.images.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt="Customer review photo" loading="lazy" className="h-20 w-16 rounded-lg object-cover" />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
