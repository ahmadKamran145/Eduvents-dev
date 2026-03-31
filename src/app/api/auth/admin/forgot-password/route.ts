import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
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
    const admin = await Admin.findOne({ email: normalizedEmail });

    if (!admin) {
      return NextResponse.json({ success: true, message: successMessage });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    admin.resetToken = hashedToken;
    admin.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await admin.save();

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

    await sendPasswordResetEmail(admin.email, admin.name, resetUrl);

    return NextResponse.json({ success: true, message: successMessage });
  } catch (error: any) {
    console.error("Admin forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 },
    );
  }
}
