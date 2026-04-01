import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();

  const authToken = cookieStore.get("auth_token")?.value;
  const organiserToken = cookieStore.get("organiser_token")?.value;
  const siteUserToken = cookieStore.get("siteuser_token")?.value;
  const adminToken = cookieStore.get("admin_token")?.value;

  const allCookies = cookieStore.getAll().map((c) => c.name);

  let authPayload = null;
  if (authToken) {
    authPayload = verifyToken(authToken);
  }

  let legacyPayload = null;
  const legacyToken = organiserToken || siteUserToken || adminToken;
  if (legacyToken) {
    legacyPayload = verifyToken(legacyToken);
  }

  return NextResponse.json({
    allCookieNames: allCookies,
    hasAuthToken: !!authToken,
    hasOrganiserToken: !!organiserToken,
    hasSiteUserToken: !!siteUserToken,
    hasAdminToken: !!adminToken,
    authPayload,
    legacyPayload,
  });
}
