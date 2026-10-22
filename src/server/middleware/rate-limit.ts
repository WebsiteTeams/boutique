import { tooManyRequests } from "@/server/utils/errors";

interface Bucket {
  count: number;
  resetAt: number;
}

// In-memory fixed-window limiter. It is per server instance: on a multi-instance
// deployment, back this with a shared store (e.g. Redis) behind the same function.
const buckets = new Map<string, Bucket>();

export interface RateLimit {
  /** Logical name of the limited action, e.g. "login". */
  name: string;
  limit: number;
  windowMs: number;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function enforceRateLimit(request: Request, rule: RateLimit, subject?: string) {
  const key = `${rule.name}:${subject ?? clientIp(request)}`;
  const nowMs = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= nowMs) {
    buckets.set(key, { count: 1, resetAt: nowMs + rule.windowMs });
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (b.resetAt <= nowMs) buckets.delete(k);
    }
    return;
  }
  bucket.count += 1;
  if (bucket.count > rule.limit) throw tooManyRequests();
}

const MINUTE = 60_000;

export const RATE_LIMITS = {
  login: { name: "login", limit: 10, windowMs: 15 * MINUTE },
  adminLogin: { name: "admin-login", limit: 5, windowMs: 15 * MINUTE },
  register: { name: "register", limit: 5, windowMs: 60 * MINUTE },
  passwordResetRequest: { name: "password-reset-request", limit: 5, windowMs: 60 * MINUTE },
  passwordResetConfirm: { name: "password-reset-confirm", limit: 10, windowMs: 15 * MINUTE },
  contact: { name: "contact", limit: 5, windowMs: 60 * MINUTE },
  newsletter: { name: "newsletter", limit: 5, windowMs: 60 * MINUTE },
  upload: { name: "upload", limit: 20, windowMs: 60 * MINUTE },
  coupon: { name: "coupon", limit: 30, windowMs: 15 * MINUTE },
  order: { name: "order", limit: 15, windowMs: 15 * MINUTE },
  review: { name: "review", limit: 10, windowMs: 60 * MINUTE },
} satisfies Record<string, RateLimit>;
