import { createHash } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { eq, lt } from "drizzle-orm";
import type { SessionUser } from "@/types";
import { env } from "@/server/config/env";
import { db } from "@/server/db/client";
import { sessions, users } from "@/server/db/schema";
import { forbidden, unauthorized } from "@/server/utils/errors";
import { now, randomToken } from "@/server/utils/ids";
import { SESSION_COOKIE } from "./constants";

const SESSION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export function toSessionUser(row: typeof users.$inferSelect): SessionUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    createdAt: row.createdAt,
  };
}

/** Creates a server-side session and sets the httpOnly cookie. */
export async function createSession(userId: string) {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * DAY_MS);
  await db.insert(sessions).values({
    id: hashToken(token),
    userId,
    expiresAt: expires.toISOString(),
    createdAt: now(),
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    expires,
  });
  // Opportunistic cleanup of expired sessions.
  await db.delete(sessions).where(lt(sessions.expiresAt, now()));
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  store.delete(SESSION_COOKIE);
}

/** Resolves the signed-in user from the session cookie (deduplicated per request). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, hashToken(token)))
    .limit(1);
  if (!row || row.expiresAt <= now()) return null;
  return toSessionUser(row.user);
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw forbidden();
  return user;
}
