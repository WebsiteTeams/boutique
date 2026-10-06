import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import type { z } from "zod";
import type { Appointment, ProductReview, SessionUser } from "@/types";
import { absoluteUrl } from "@/lib/config";
import { db } from "@/server/db/client";
import {
  appointments,
  contactMessages,
  newsletterSubscribers,
  orderItems,
  orders,
  products,
  reviews,
  users,
} from "@/server/db/schema";
import { badRequest, conflict, forbidden, notFound } from "@/server/utils/errors";
import { newId, nextAppointmentId, now, randomToken } from "@/server/utils/ids";
import type {
  appointmentSchema,
  appointmentUpdateSchema,
  contactSchema,
  reviewSchema,
} from "@/server/validators";
import { notifyAdmin, sendEmail } from "./notifications";

/* ---------------- Appointments ---------------- */

const toAppointment = (row: typeof appointments.$inferSelect, admin = false): Appointment => ({
  id: row.id,
  purpose: row.purpose,
  date: row.date,
  time: row.time,
  name: row.name,
  phone: row.phone,
  email: row.email,
  notes: row.notes,
  status: row.status,
  createdAt: row.createdAt,
  ...(admin ? { adminNotes: row.adminNotes } : {}),
});

const ACTIVE_APPOINTMENT = ["Pending", "Confirmed", "Rescheduled"];

async function assertSlotFree(date: string, time: string, excludeId?: string) {
  const [clash] = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.date, date),
        eq(appointments.time, time),
        inArray(appointments.status, ACTIVE_APPOINTMENT),
        excludeId ? ne(appointments.id, excludeId) : undefined
      )
    )
    .limit(1);
  if (clash) throw conflict("That slot has just been taken. Please choose another time.");
}

/** Slots already booked on a given date, so the form can disable them. */
export async function bookedSlots(date: string): Promise<string[]> {
  const rows = await db
    .select({ time: appointments.time })
    .from(appointments)
    .where(and(eq(appointments.date, date), inArray(appointments.status, ACTIVE_APPOINTMENT)));
  return rows.map((r) => r.time);
}

export async function createAppointment(
  input: z.infer<typeof appointmentSchema>,
  user: SessionUser | null
): Promise<Appointment> {
  await assertSlotFree(input.date, input.time);
  const row = await db.transaction(async (tx) => {
    const id = await nextAppointmentId(tx);
    const [created] = await tx
      .insert(appointments)
      .values({ id, userId: user?.id ?? null, ...input, status: "Pending", createdAt: now() })
      .returning();
    return created;
  });
  await notifyAdmin({
    type: "appointment",
    title: `New appointment request ${row.id}`,
    body: `${row.name} · ${row.purpose} · ${row.date} at ${row.time}`,
    link: "/admin/appointments",
  });
  await sendEmail({
    to: row.email,
    subject: `Appointment request received — ${row.id}`,
    text: `Thank you ${row.name}. We have received your request for a ${row.purpose} appointment on ${row.date} at ${row.time}. Our team will confirm it shortly.`,
  });
  return toAppointment(row);
}

export async function listAppointmentsForUser(userId: string): Promise<Appointment[]> {
  const rows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.userId, userId))
    .orderBy(desc(appointments.date), desc(appointments.time));
  return rows.map((r) => toAppointment(r));
}

export async function listAllAppointments(status?: string): Promise<Appointment[]> {
  const rows = await db
    .select()
    .from(appointments)
    .where(status ? eq(appointments.status, status) : undefined)
    .orderBy(desc(appointments.date), desc(appointments.time));
  return rows.map((r) => toAppointment(r, true));
}

export async function updateAppointment(id: string, change: z.infer<typeof appointmentUpdateSchema>) {
  const [row] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  if (!row) throw notFound("Appointment not found.");
  const moved = (change.date && change.date !== row.date) || (change.time && change.time !== row.time);
  const date = change.date ?? row.date;
  const time = change.time ?? row.time;
  if (moved) await assertSlotFree(date, time, id);
  const status = change.status ?? (moved ? "Rescheduled" : row.status);
  const [updated] = await db
    .update(appointments)
    .set({ date, time, status, adminNotes: change.adminNotes ?? row.adminNotes })
    .where(eq(appointments.id, id))
    .returning();
  if (status !== row.status || moved) {
    await sendEmail({
      to: updated.email,
      subject: `Your UMA appointment ${updated.id} — ${updated.status}`,
      text: `Your ${updated.purpose} appointment is now ${updated.status.toLowerCase()} for ${updated.date} at ${updated.time}.`,
    });
  }
  return toAppointment(updated, true);
}

/* ---------------- Reviews ---------------- */

const DELIVERED = "Delivered";

/** A customer may review a product once, and only after an order containing it was delivered. */
export async function reviewEligibility(userId: string, productId: string) {
  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.productId, productId)))
    .limit(1);
  if (existing) return { eligible: false, reason: "You have already reviewed this piece." as const, orderId: null };
  const [purchase] = await db
    .select({ orderId: orders.id })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(eq(orders.userId, userId), eq(orders.status, DELIVERED), eq(orderItems.productId, productId)))
    .limit(1);
  if (!purchase) {
    return { eligible: false, reason: "Reviews open once your order of this piece is delivered." as const, orderId: null };
  }
  return { eligible: true, reason: null, orderId: purchase.orderId };
}

async function refreshProductRating(productId: string) {
  const [agg] = await db
    .select({ count: sql<number>`count(*)`, avg: sql<number | null>`avg(${reviews.rating})` })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "Approved")));
  await db
    .update(products)
    .set({ reviewCount: agg.count, rating: agg.avg ? Math.round(agg.avg * 10) / 10 : 0 })
    .where(eq(products.id, productId));
}

export async function createReview(user: SessionUser, productId: string, input: z.infer<typeof reviewSchema>) {
  const [product] = await db.select({ id: products.id, name: products.name }).from(products).where(eq(products.id, productId)).limit(1);
  if (!product) throw notFound("Product not found.");
  const eligibility = await reviewEligibility(user.id, productId);
  if (!eligibility.eligible) throw forbidden(eligibility.reason ?? "You cannot review this piece yet.");
  await db.insert(reviews).values({
    id: newId("rev"),
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

const reviewSelect = {
  review: reviews,
  author: users.name,
  productName: products.name,
  productSlug: products.slug,
};

function toReview(r: { review: typeof reviews.$inferSelect; author: string; productName: string; productSlug: string }): ProductReview {
  return {
    id: r.review.id,
    productId: r.review.productId,
    productName: r.productName,
    productSlug: r.productSlug,
    author: r.author,
    rating: r.review.rating,
    title: r.review.title,
    comment: r.review.comment,
    images: r.review.images,
    verifiedPurchase: r.review.verifiedPurchase,
    status: r.review.status,
    createdAt: r.review.createdAt,
  };
}

const reviewQuery = () =>
  db
    .select(reviewSelect)
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.userId))
    .innerJoin(products, eq(products.id, reviews.productId));

export async function listApprovedReviews(productId: string): Promise<ProductReview[]> {
  const rows = await reviewQuery()
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "Approved")))
    .orderBy(desc(reviews.createdAt));
  return rows.map(toReview);
}

export async function listReviewsForUser(userId: string): Promise<ProductReview[]> {
  const rows = await reviewQuery().where(eq(reviews.userId, userId)).orderBy(desc(reviews.createdAt));
  return rows.map(toReview);
}

export async function listAllReviews(status?: string): Promise<ProductReview[]> {
  const rows = await reviewQuery()
    .where(status ? eq(reviews.status, status) : undefined)
    .orderBy(desc(reviews.createdAt));
  return rows.map(toReview);
}

export async function moderateReview(id: string, status: string) {
  const [row] = await db.update(reviews).set({ status }).where(eq(reviews.id, id)).returning();
  if (!row) throw notFound("Review not found.");
  await refreshProductRating(row.productId);
}

export async function deleteReview(id: string) {
  const [row] = await db.delete(reviews).where(eq(reviews.id, id)).returning();
  if (!row) throw notFound("Review not found.");
  await refreshProductRating(row.productId);
}

/* ---------------- Contact ---------------- */

export async function createContactMessage(input: z.infer<typeof contactSchema>) {
  const id = newId("msg");
  await db.insert(contactMessages).values({ id, ...input, status: "New", createdAt: now() });
  await notifyAdmin({
    type: "message",
    title: `New enquiry — ${input.topic}`,
    body: `${input.name} (${input.email}): ${input.message.slice(0, 200)}`,
    link: "/admin/messages",
  });
  return { id };
}

export const listContactMessages = () =>
  db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));

export async function updateContactMessage(id: string, status: string) {
  const updated = await db
    .update(contactMessages)
    .set({ status })
    .where(eq(contactMessages.id, id))
    .returning({ id: contactMessages.id });
  if (updated.length === 0) throw notFound("Message not found.");
}

/* ---------------- Newsletter ---------------- */

export async function subscribeNewsletter(email: string): Promise<{ alreadySubscribed: boolean }> {
  const [existing] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);
  if (existing?.status === "subscribed") return { alreadySubscribed: true };
  const token = existing?.token ?? randomToken(24);
  if (existing) {
    await db
      .update(newsletterSubscribers)
      .set({ status: "subscribed", subscribedAt: now(), unsubscribedAt: null })
      .where(eq(newsletterSubscribers.email, email));
  } else {
    await db.insert(newsletterSubscribers).values({ email, status: "subscribed", token, subscribedAt: now() });
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
  const [row] = await db
    .update(newsletterSubscribers)
    .set({ status: "unsubscribed", unsubscribedAt: now() })
    .where(eq(newsletterSubscribers.token, token))
    .returning({ email: newsletterSubscribers.email });
  if (!row) throw badRequest("This unsubscribe link is not valid.");
  return row.email;
}

export const listSubscribers = () =>
  db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.subscribedAt));
