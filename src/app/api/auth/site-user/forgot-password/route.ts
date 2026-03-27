import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import SiteUser from "@/models/SiteUser";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { email } = body;

    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, errors: { email: "Required" } },
        { status: 400 },
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        {
          success: false,
          errors: { email: "Incorrect email format. Email must contain @" },
        },
        { status: 400 },
      );
    }

    const successMessage =
      "If an account with that email exists, a password reset link has been sent.";

    const normalizedEmail = email.trim().toLowerCase();
    const siteUser = await SiteUser.findOne({ email: normalizedEmail });

    if (!siteUser) {
      return NextResponse.json({ success: true, message: successMessage });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    siteUser.resetToken = hashedToken;
    siteUser.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await siteUser.save();

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}&type=siteuser`;

    await sendPasswordResetEmail(siteUser.email, siteUser.name, resetUrl);

    return NextResponse.json({ success: true, message: successMessage });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 },
    );
  }
}
