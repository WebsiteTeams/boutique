import type { z } from "zod";
import type { ProductReview, SessionUser } from "@/types";
import { absoluteUrl } from "@/lib/config";
import {
  ContactMessages,
  NewsletterSubscribers,
  Orders,
  plainAll,
  Products,
  Reviews,
  Users,
  type ContactMessageRow,
  type NewsletterSubscriberRow,
  type ReviewRow,
} from "@/server/db/models";
import { badRequest, forbidden, notFound } from "@/server/utils/errors";
import { newId, now, randomToken } from "@/server/utils/ids";
import type { contactSchema, reviewSchema } from "@/server/validators";
import { notifyAdmin, sendEmail } from "./notifications";

/* ---------------- Reviews ---------------- */

const DELIVERED = "Delivered";

/** A customer may review a product once, and only after an order containing it was delivered. */
export async function reviewEligibility(userId: string, productId: string) {
  if (await Reviews.exists({ userId, productId })) {
    return { eligible: false, reason: "You have already reviewed this piece." as const, orderId: null };
  }
  const purchase = await Orders.findOne({ userId, status: DELIVERED, "items.productId": productId }, { _id: 1 }).lean();
  if (!purchase) {
    return { eligible: false, reason: "Reviews open once your order of this piece is delivered." as const, orderId: null };
  }
  return { eligible: true, reason: null, orderId: purchase._id };
}

async function refreshProductRating(productId: string) {
  const [agg] = await Reviews.aggregate<{ count: number; avg: number | null }>([
    { $match: { productId, status: "Approved" } },
    { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: "$rating" } } },
  ]);
  await Products.updateOne(
    { _id: productId },
    { $set: { reviewCount: agg?.count ?? 0, rating: agg?.avg ? Math.round(agg.avg * 10) / 10 : 0 } }
  );
}

export async function createReview(user: SessionUser, productId: string, input: z.infer<typeof reviewSchema>) {
  const product = await Products.findById(productId, { name: 1 }).lean();
  if (!product) throw notFound("Product not found.");
  const eligibility = await reviewEligibility(user.id, productId);
  if (!eligibility.eligible) throw forbidden(eligibility.reason ?? "You cannot review this piece yet.");
  await Reviews.create({
    _id: newId("rev"),
    productId,
    userId: user.id,
    orderId: eligibility.orderId,
    rating: input.rating,
    title: input.title,
    comment: input.comment,
    images: input.images,
    verifiedPurchase: true,
    status: "Pending",
    createdAt: now(),
  });
  await notifyAdmin({
    type: "review",
    title: `New review awaiting moderation`,
    body: `${user.name} rated ${product.name} ${input.rating}/5`,
    link: "/admin/reviews",
  });
}

/** Attaches author and product names; reviews whose author or product is gone are skipped (as the SQL join did). */
async function withNames(rows: ReviewRow[]): Promise<ProductReview[]> {
  const [authors, items] = await Promise.all([
    Users.find({ _id: { $in: [...new Set(rows.map((r) => r.userId))] } }, { name: 1 }).lean(),
    Products.find({ _id: { $in: [...new Set(rows.map((r) => r.productId))] } }, { name: 1, slug: 1 }).lean(),
  ]);
  const authorById = new Map(authors.map((a) => [a._id, a.name]));
  const productById = new Map(items.map((p) => [p._id, p]));
  return rows.flatMap((r) => {
    const author = authorById.get(r.userId);
    const product = productById.get(r.productId);
    if (author === undefined || !product) return [];
    return [
      {
        id: r.id,
        productId: r.productId,
        productName: product.name,
        productSlug: product.slug,
        author,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        images: r.images,
        verifiedPurchase: r.verifiedPurchase,
        status: r.status,
        createdAt: r.createdAt,
      },
    ];
  });
}

const findReviews = async (filter: Record<string, unknown>) =>
  withNames(plainAll<ReviewRow>(await Reviews.find(filter).sort({ createdAt: -1 }).lean()));

export const listApprovedReviews = (productId: string) => findReviews({ productId, status: "Approved" });

export const listReviewsForUser = (userId: string) => findReviews({ userId });

export const listAllReviews = (status?: string) => findReviews(status ? { status } : {});

export async function moderateReview(id: string, status: string) {
  const row = await Reviews.findOneAndUpdate({ _id: id }, { $set: { status } }, { new: true }).lean();
  if (!row) throw notFound("Review not found.");
  await refreshProductRating(row.productId);
}

export async function deleteReview(id: string) {
  const row = await Reviews.findOneAndDelete({ _id: id }).lean();
  if (!row) throw notFound("Review not found.");
  await refreshProductRating(row.productId);
}

/* ---------------- Contact ---------------- */

export async function createContactMessage(input: z.infer<typeof contactSchema>) {
  const id = newId("msg");
  await ContactMessages.create({ _id: id, ...input, status: "New", createdAt: now() });
  await notifyAdmin({
    type: "message",
    title: `New enquiry — ${input.topic}`,
    body: `${input.name} (${input.email}): ${input.message.slice(0, 200)}`,
    link: "/admin/messages",
  });
  return { id };
}

export const listContactMessages = async () =>
  plainAll<ContactMessageRow>(await ContactMessages.find().sort({ createdAt: -1 }).lean());

export async function updateContactMessage(id: string, status: string) {
  const res = await ContactMessages.updateOne({ _id: id }, { $set: { status } });
  if (res.matchedCount === 0) throw notFound("Message not found.");
}

/* ---------------- Newsletter ---------------- */

/** Subscriber documents use the email address as `_id`. */
const toSubscriber = (doc: { _id: string } & Omit<NewsletterSubscriberRow, "email">): NewsletterSubscriberRow => {
  const { _id, ...rest } = doc;
  return { email: _id, ...rest };
};

export async function subscribeNewsletter(email: string): Promise<{ alreadySubscribed: boolean }> {
  const existing = await NewsletterSubscribers.findById(email).lean();
  if (existing?.status === "subscribed") return { alreadySubscribed: true };
  const token = existing?.token ?? randomToken(24);
  if (existing) {
    await NewsletterSubscribers.updateOne(
      { _id: email },
      { $set: { status: "subscribed", subscribedAt: now(), unsubscribedAt: null } }
    );
  } else {
    await NewsletterSubscribers.create({ _id: email, status: "subscribed", token, subscribedAt: now(), unsubscribedAt: null });
  }
  await sendEmail({
    to: email,
    subject: "Welcome to the UMA world",
    text: `You're subscribed to UMA Designers updates.\n\nUnsubscribe any time: ${absoluteUrl(`/unsubscribe?token=${token}`)}`,
  });
  return { alreadySubscribed: false };
}

export async function unsubscribeNewsletter(token: string): Promise<string> {
  if (!token) throw badRequest("This unsubscribe link is not valid.");
  const row = await NewsletterSubscribers.findOneAndUpdate(
    { token },
    { $set: { status: "unsubscribed", unsubscribedAt: now() } },
    { new: true }
  ).lean();
  if (!row) throw badRequest("This unsubscribe link is not valid.");
  return row._id;
}

export const listSubscribers = async () =>
  (await NewsletterSubscribers.find().sort({ subscribedAt: -1 }).lean()).map(toSubscriber);
