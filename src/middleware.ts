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

  // Protect organiser dashboard and account routes
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/organiser/dashboard") ||
    pathname.startsWith("/organiser/account")
  ) {
    const token = request.cookies.get("organiser_token")?.value;
    if (!token) {
      const loginUrl = new URL("/organiser/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.png|icon.png).*)",
};
