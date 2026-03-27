import { NextResponse } from "next/server";
import { getOrganiserFromCookie } from "@/lib/auth";

export async function GET() {
  try {
    const organiser = await getOrganiserFromCookie();

    if (!organiser) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      organiser: organiser.toJSON(),
    });
  } catch (error: any) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 },
    );
  }
}
