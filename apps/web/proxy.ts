import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/*
 * Fast redirects only: checks that a session cookie exists, not that it is valid.
 * The API validates the session on every request; an expired cookie gets a 401 there
 * and the page sends the user back to /auth.
 */
export function proxy(request: NextRequest) {
  const signedIn = getSessionCookie(request) !== null;
  const { pathname, search } = request.nextUrl;

  if (!signedIn) {
    const url = new URL("/auth", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/history", "/sources", "/settings", "/interviews/:path*", "/interview"],
};
