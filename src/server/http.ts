import { NextResponse } from "next/server";
import { z } from "zod";
import type { SessionUser } from "@/types";
import { getCurrentUser, requireAdmin, requireUser } from "@/server/auth/session";
import { enforceRateLimit, type RateLimit } from "@/server/middleware/rate-limit";
import { ApiError, badRequest, forbidden } from "@/server/utils/errors";

type AuthMode = "public" | "user" | "admin";

interface RouteOptions<TBody extends z.ZodType | undefined, TAuth extends AuthMode> {
  auth?: TAuth;
  body?: TBody;
  rateLimit?: RateLimit;
}

interface RouteContext<TBody extends z.ZodType | undefined, TAuth extends AuthMode> {
  request: Request;
  params: Record<string, string>;
  query: URLSearchParams;
  /** Present for "user"/"admin" routes; resolved (possibly null) for public routes. */
  user: TAuth extends "public" ? SessionUser | null : SessionUser;
  body: TBody extends z.ZodType ? z.infer<TBody> : undefined;
}

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Rejects cross-site state-changing requests (defence in depth on top of SameSite cookies). */
function assertSameOrigin(request: Request) {
  if (!MUTATING.has(request.method)) return;
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    if (new URL(origin).host !== host) throw forbidden("Cross-site request blocked.");
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw forbidden("Cross-site request blocked.");
  }
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { message: error.message, fields: error.fields } },
      { status: error.status }
    );
  }
  // Never leak internals (SQL, stack traces) to the client.
  console.error("[api] unhandled error", error);
  return NextResponse.json(
    { error: { message: "Something went wrong on our side. Please try again." } },
    { status: 500 }
  );
}

/**
 * Wraps a route handler with authentication, same-origin checks, rate limiting,
 * body validation and sanitised error responses. Successful handlers return
 * plain data, which is sent as `{ data }`.
 */
export function route<TBody extends z.ZodType | undefined = undefined, TAuth extends AuthMode = "public">(
  options: RouteOptions<TBody, TAuth>,
  handler: (ctx: RouteContext<TBody, TAuth>) => Promise<unknown>
) {
  return async (request: Request, context: { params: Promise<Record<string, string | string[]>> }) => {
    try {
      assertSameOrigin(request);
      if (options.rateLimit) enforceRateLimit(request, options.rateLimit);

      const auth = options.auth ?? "public";
      const user =
        auth === "admin" ? await requireAdmin() : auth === "user" ? await requireUser() : await getCurrentUser();

      let body: unknown = undefined;
      if (options.body) {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          throw badRequest("Invalid request body.");
        }
        const parsed = options.body.safeParse(raw);
        if (!parsed.success) {
          throw badRequest("Please check the highlighted fields.", fieldErrors(parsed.error));
        }
        body = parsed.data;
      }

      const rawParams = (await context.params) ?? {};
      const params: Record<string, string> = {};
      for (const [k, v] of Object.entries(rawParams)) {
        params[k] = decodeURIComponent(Array.isArray(v) ? v.join("/") : v);
      }

      const data = await handler({
        request,
        params,
        query: new URL(request.url).searchParams,
        user: user as RouteContext<TBody, TAuth>["user"],
        body: body as RouteContext<TBody, TAuth>["body"],
      });
      if (data instanceof Response) return data;
      return NextResponse.json({ data: data ?? null });
    } catch (error) {
      return errorResponse(error);
    }
  };
}
