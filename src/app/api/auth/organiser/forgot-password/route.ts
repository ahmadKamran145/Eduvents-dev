import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import Organiser from "@/models/Organiser";
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

    // Always return success to prevent email enumeration
    const successMessage =
      "If an account with that email exists, a password reset link has been sent.";

    const normalizedEmail = email.trim().toLowerCase();
    const organiser = await Organiser.findOne({ email: normalizedEmail });

    if (!organiser) {
      return NextResponse.json({ success: true, message: successMessage });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    organiser.resetToken = hashedToken;
    organiser.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await organiser.save();

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/organiser/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

    await sendPasswordResetEmail(organiser.email, organiser.name, resetUrl);

    return NextResponse.json({ success: true, message: successMessage });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 },
    );
  }
}
