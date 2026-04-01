import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getAuthRole(request: NextRequest): string | null {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return null;

  try {
    // Decode JWT payload without verification (middleware can't use jsonwebtoken)
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;
    const payload = JSON.parse(atob(payloadBase64));
    return payload.role || null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // Redirect www to non-www
  if (host.startsWith("www.")) {
    const newHost = host.replace("www.", "");
    const url = new URL(request.url);
    url.host = newHost;
    url.port = "";
    return NextResponse.redirect(url.toString(), 301);
  }

  const { pathname } = request.nextUrl;
  const role = getAuthRole(request);

  // Protect organiser routes
  if (
    pathname.startsWith("/organiser/dashboard") ||
    pathname.startsWith("/organiser/account")
  ) {
    if (role !== "organiser") {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect site user routes
  if (
    pathname.startsWith("/site-user/favourites") ||
    pathname.startsWith("/site-user/booked-events") ||
    pathname.startsWith("/site-user/account")
  ) {
    if (role !== "siteuser") {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Guard /list-event
  if (pathname.startsWith("/list-event")) {
    // Organiser logged in → allow access
    if (role === "organiser") {
      return NextResponse.next();
    }

    // Site user logged in → redirect to organiser prompt
    if (role === "siteuser") {
      const promptUrl = new URL("/site-user/organiser-prompt", request.url);
      return NextResponse.redirect(promptUrl);
    }

    // Not logged in or admin → redirect to register page
    const registerUrl = new URL("/organiser/register", request.url);
    return NextResponse.redirect(registerUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.png|icon.png).*)",
};
