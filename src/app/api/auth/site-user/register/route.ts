import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SiteUser from "@/models/SiteUser";
import { hashPassword, setSiteUserCookie, isEmailTaken } from "@/lib/auth";
import { syncSiteUserToMailchimp } from "@/lib/mailchimp";
import { sendSiteUserWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, email, password, subjectInterests, role } = body;

    const errors: Record<string, string> = {};

    if (!name?.trim()) errors.name = "Required";
    if (!email?.trim()) errors.email = "Required";
    if (!password) errors.password = "Required";
    if (!role) errors.role = "Required";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    if (name.trim().length > 100)
      errors.name = "Name must be 100 characters or less";
    if (!email.includes("@"))
      errors.email = "Incorrect email format. Email must contain @";
    if (password.length < 8)
      errors.password = "Password must be at least 8 characters";
    if (role !== "teacher" && role !== "other")
      errors.role = "Please select a role";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (await isEmailTaken(normalizedEmail)) {
      return NextResponse.json(
        {
          success: false,
          errors: {
            email:
              "An account with this email address already exists. Please login or use a different email.",
          },
        },
        { status: 400 },
      );
    }

    const hashedPassword = await hashPassword(password);
    const siteUser = await SiteUser.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      subjectInterests: subjectInterests || [],
      role,
    });

    await setSiteUserCookie(siteUser._id!.toString(), siteUser.email);

    syncSiteUserToMailchimp(
      siteUser.email,
      siteUser.name,
      siteUser.subjectInterests,
      siteUser.role,
    ).catch((err) => console.error("Mailchimp sync error:", err));

    sendSiteUserWelcomeEmail(siteUser.email, siteUser.name).catch((err) =>
      console.error("Welcome email error:", err),
    );

    return NextResponse.json({
      success: true,
      message: "Account created successfully. Welcome to EDUVENTS!",
      siteUser: siteUser.toJSON(),
    });
  } catch (error: any) {
    console.error("Site user registration error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during registration" },
      { status: 500 },
    );
  }
}
