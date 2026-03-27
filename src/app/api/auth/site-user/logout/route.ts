import { NextResponse } from "next/server";
import { clearSiteUserCookie } from "@/lib/auth";

export async function POST() {
  try {
    await clearSiteUserCookie();
    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during logout" },
      { status: 500 },
    );
  }
}
