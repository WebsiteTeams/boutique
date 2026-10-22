import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/server/auth/constants";

/**
 * Optimistic gate for signed-in areas: visitors without a session cookie are
 * sent to the login page. This is a convenience redirect only — every page
 * and API route re-checks the session (and the admin role) on the server.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login" || request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  // Staff areas use the separate admin sign-in page.
  const login = new URL(pathname.startsWith("/admin") ? "/admin/login" : "/login", request.url);
  login.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/orders/:path*", "/order-success/:path*"],
};
