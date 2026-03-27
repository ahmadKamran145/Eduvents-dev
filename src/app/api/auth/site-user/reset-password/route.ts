import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import SiteUser from "@/models/SiteUser";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { email, token, password } = body;

    if (!email || !token || !password) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          errors: { password: "Password must be at least 8 characters" },
        },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const siteUser = await SiteUser.findOne({
      email: normalizedEmail,
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!siteUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired reset token. Please request a new one.",
        },
        { status: 400 },
      );
    }

    siteUser.password = await hashPassword(password);
    siteUser.resetToken = undefined;
    siteUser.resetTokenExpiry = undefined;
    await siteUser.save();

    return NextResponse.json({
      success: true,
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 },
    );
  }
}
