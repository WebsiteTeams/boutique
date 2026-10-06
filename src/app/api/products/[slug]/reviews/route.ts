import { route } from "@/server/http";
import { RATE_LIMITS } from "@/server/middleware/rate-limit";
import { createReview, listApprovedReviews, reviewEligibility } from "@/server/services/boutique";
import { getProductRowBySlug } from "@/server/services/products";
import { notFound } from "@/server/utils/errors";
import { reviewSchema } from "@/server/validators";

export const GET = route({}, async ({ params, user }) => {
  const product = await getProductRowBySlug(params.slug);
  if (!product) throw notFound("Product not found.");
  return {
    reviews: await listApprovedReviews(product.id),
    eligibility: user ? await reviewEligibility(user.id, product.id) : null,
  };
});

export const POST = route(
  { auth: "user", body: reviewSchema, rateLimit: RATE_LIMITS.review },
  async ({ params, user, body }) => {
    const product = await getProductRowBySlug(params.slug);
    if (!product) throw notFound("Product not found.");
    await createReview(user, product.id, body);
    return { ok: true };
  }
);
