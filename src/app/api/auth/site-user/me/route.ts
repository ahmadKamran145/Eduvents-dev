import { NextResponse } from "next/server";
import { getSiteUserFromCookie } from "@/lib/auth";

export async function GET() {
  try {
    const siteUser = await getSiteUserFromCookie();

    if (!siteUser) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      siteUser: siteUser.toJSON(),
    });
  } catch (error: any) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 },
    );
  }
}
