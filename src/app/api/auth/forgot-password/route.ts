import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import Organiser from "@/models/Organiser";
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    // Check Admin
    const admin = await Admin.findOne({ email: normalizedEmail });
    if (admin) {
      admin.resetToken = hashedToken;
      admin.resetTokenExpiry = expiry;
      await admin.save();
      const resetUrl = `${baseUrl}/admin/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;
      await sendPasswordResetEmail(admin.email, admin.name, resetUrl);
      return NextResponse.json({ success: true, message: successMessage });
    }

    // Check Organiser
    const organiser = await Organiser.findOne({ email: normalizedEmail });
    if (organiser) {
      organiser.resetToken = hashedToken;
      organiser.resetTokenExpiry = expiry;
      await organiser.save();
      const resetUrl = `${baseUrl}/organiser/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;
      await sendPasswordResetEmail(organiser.email, organiser.name, resetUrl);
      return NextResponse.json({ success: true, message: successMessage });
    }

    // Check SiteUser
    const siteUser = await SiteUser.findOne({ email: normalizedEmail });
    if (siteUser) {
      siteUser.resetToken = hashedToken;
      siteUser.resetTokenExpiry = expiry;
      await siteUser.save();
      const resetUrl = `${baseUrl}/site-user/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;
      await sendPasswordResetEmail(siteUser.email, siteUser.name, resetUrl);
      return NextResponse.json({ success: true, message: successMessage });
    }

    // No account found — return same message to prevent enumeration
    return NextResponse.json({ success: true, message: successMessage });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 },
    );
  }
}
