import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  // Protect organiser routes
  if (
    pathname.startsWith("/organiser/dashboard") ||
    pathname.startsWith("/organiser/account")
  ) {
    const token = request.cookies.get("organiser_token")?.value;
    if (!token) {
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
    const token = request.cookies.get("siteuser_token")?.value;
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Guard /list-event
  if (pathname.startsWith("/list-event")) {
    const siteUserToken = request.cookies.get("siteuser_token")?.value;
    const organiserToken = request.cookies.get("organiser_token")?.value;

    // Site user logged in → redirect to organiser prompt
    if (siteUserToken) {
      const promptUrl = new URL("/site-user/organiser-prompt", request.url);
      return NextResponse.redirect(promptUrl);
    }

    // Not logged in at all → redirect to register page
    if (!organiserToken) {
      const registerUrl = new URL("/organiser/register", request.url);
      return NextResponse.redirect(registerUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.png|icon.png).*)",
};
//test
