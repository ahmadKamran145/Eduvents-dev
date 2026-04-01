import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeBase64Url(str: string): string {
  // JWT uses base64url: replace - with +, _ with /, and add padding
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad === 2) base64 += "==";
  else if (pad === 3) base64 += "=";
  return atob(base64);
}

function getRoleFromToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

function getAuthRole(request: NextRequest): string | null {
  // Check new single cookie first, then fall back to legacy cookies
  const authToken = request.cookies.get("auth_token")?.value;
  if (authToken) return getRoleFromToken(authToken);

  const organiserToken = request.cookies.get("organiser_token")?.value;
  if (organiserToken) return getRoleFromToken(organiserToken);

  const siteUserToken = request.cookies.get("siteuser_token")?.value;
  if (siteUserToken) return getRoleFromToken(siteUserToken);

  const adminToken = request.cookies.get("admin_token")?.value;
  if (adminToken) return getRoleFromToken(adminToken);

  return null;
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

  // Guard /list-event — only block site users, allow organiser + fallback to client
  if (pathname.startsWith("/list-event")) {
    if (role === "siteuser") {
      const promptUrl = new URL("/site-user/organiser-prompt", request.url);
      return NextResponse.redirect(promptUrl);
    }
    // Let organiser, admin, and unknown (null) through —
    // the page and client-side auth handle the rest
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.png|icon.png).*)",
};
