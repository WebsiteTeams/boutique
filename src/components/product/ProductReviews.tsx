"use client";

import { ImagePlus, Loader2, ShieldCheck, Star, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { ProductReview } from "@/types";
import { api, errorFields, errorMessage, uploadImage } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { useAuth, useToast } from "@/context/store";
import { Button } from "@/components/ui/Button";
import { Field, TextArea, TextInput } from "@/components/ui/fields";
import { Rating } from "@/components/ui/Rating";

interface ProductReviewsProps {
  slug: string;
  rating: number;
  reviewCount: number;
  reviews: ProductReview[];
  /** Null when signed out. */
  eligibility: { eligible: boolean; reason: string | null } | null;
}

export function ProductReviews({ slug, rating, reviewCount, reviews, eligibility }: ProductReviewsProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stars, setStars] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<"idle" | "uploading" | "submitting">("idle");
  const [submitted, setSubmitted] = useState(false);

  const addImage = async (file?: File | null) => {
    if (!file || images.length >= 3) return;
    setBusy("uploading");
    try {
      const url = await uploadImage(file, "reviews");
      setImages((prev) => [...prev, url]);
    } catch (error) {
      showToast("Upload failed", errorMessage(error), "error");
    } finally {
      setBusy("idle");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars === 0) {
      setErrors({ rating: "Please choose a star rating" });
      return;
    }
    setBusy("submitting");
    setErrors({});
    try {
      await api(`/api/products/${slug}/reviews`, { body: { rating: stars, title, comment, images } });
      setSubmitted(true);
      showToast("Thank you for your review", "It will appear once our team has approved it.");
      router.refresh();
    } catch (error) {
      setErrors(errorFields(error));
      showToast("Couldn't submit review", errorMessage(error), "error");
    } finally {
      setBusy("idle");
    }
  };

  return (
    <section id="reviews" className="mx-auto max-w-3xl scroll-mt-28 px-5 py-14 sm:px-8 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-clay/60 pb-6">
        <div>
          <p className="eyebrow mb-2 text-gold-deep">Customer Reviews</p>
          <h2 className="type-heading-lg text-charcoal">What customers say</h2>
        </div>
        {reviewCount > 0 && (
          <div className="text-right">
            <p className="type-heading-lg tabular-nums text-charcoal">{rating.toFixed(1)}</p>
            <Rating value={rating} size={15} className="justify-end" />
            <p className="mt-1 text-xs text-mist">
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </p>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="py-8 text-sm text-mist">
          No reviews yet. Reviews are written by customers after their order has been delivered.
        </p>
      ) : (
        <ul className="divide-y divide-clay/50">
          {reviews.map((r) => (
            <li key={r.id} className="py-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Rating value={r.rating} />
                <span className="text-xs text-mist">{formatDate(r.createdAt)}</span>
              </div>
              {r.title && <p className="mt-2 font-medium text-charcoal">{r.title}</p>}
              <p className="mt-1.5 text-sm leading-relaxed text-mist">{r.comment}</p>
              {r.images.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {r.images.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src}
                      src={src}
                      alt={`Customer photo from ${r.author}`}
                      loading="lazy"
                      className="h-20 w-16 rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
              <p className="mt-3 flex items-center gap-2 text-xs text-charcoal">
                {r.author}
                {r.verifiedPurchase && (
                  <span className="flex items-center gap-1 text-gold-deep">
                    <ShieldCheck width={13} height={13} />
                    Verified purchase
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* Write a review */}
      <div className="mt-6 rounded-2xl border border-clay/60 bg-white/60 p-6">
        {!user ? (
          <p className="text-sm text-mist">
            Purchased this piece?{" "}
            <Link href={`/login?next=/product/${slug}`} className="font-medium text-gold-deep underline underline-offset-4">
              Sign in
            </Link>{" "}
            to share your review.
          </p>
        ) : submitted ? (
          <p className="text-sm text-mist" role="status">
            Thank you — your review has been submitted and is awaiting approval.
          </p>
        ) : !eligibility?.eligible ? (
          <p className="text-sm text-mist">
            {eligibility?.reason ?? "Reviews open once your order of this piece is delivered."}
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-5" noValidate>
            <h3 className="type-heading-md text-charcoal">Write a review</h3>
            <div>
              <span className="mb-2 block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-charcoal/70" id="rating-label">
                Your rating <span className="text-gold-deep">*</span>
              </span>
              <div className="flex gap-1" role="radiogroup" aria-labelledby="rating-label">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={stars === n}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onClick={() => setStars(n)}
                    className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-cream"
                  >
                    <Star
                      width={22}
                      height={22}
                      strokeWidth={1.2}
                      className={n <= stars ? "fill-gold text-gold" : "text-taupe"}
                    />
                  </button>
                ))}
              </div>
              {errors.rating && <p className="mt-1 text-xs text-red-600">{errors.rating}</p>}
            </div>
            <Field label="Headline" error={errors.title}>
              <TextInput value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} placeholder="Sum it up in a line" />
            </Field>
            <Field label="Your review" required error={errors.comment}>
              <TextArea
                value={comment}
                maxLength={2000}
                error={!!errors.comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the fabric, fit and finish?"
              />
            </Field>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => addImage(e.target.files?.[0])}
              />
              <div className="flex flex-wrap items-center gap-3">
                {images.map((src) => (
                  <span key={src} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="Your uploaded photo" className="h-20 w-16 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((i) => i !== src))}
                      aria-label="Remove photo"
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-charcoal text-ivory"
                    >
                      <X width={12} height={12} />
                    </button>
                  </span>
                ))}
                {images.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy !== "idle"}
                    className={cn(
                      "flex h-20 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-clay text-[0.65rem] text-mist transition-colors hover:border-gold",
                      busy === "uploading" && "opacity-60"
                    )}
                  >
                    {busy === "uploading" ? <Loader2 width={16} height={16} className="animate-spin" /> : <ImagePlus width={16} height={16} />}
                    Add photo
                  </button>
                )}
              </div>
            </div>
            <Button type="submit" disabled={busy !== "idle"}>
              {busy === "submitting" ? "Submitting…" : "Submit Review"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
