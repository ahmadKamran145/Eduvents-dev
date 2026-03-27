import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Organiser from "@/models/Organiser";
import { hashPassword, setOrganiserCookie, isEmailTaken } from "@/lib/auth";
import { syncOrganiserToMailchimp } from "@/lib/mailchimp";
import { sendOrganiserWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, email, password, organisationName } = body;

    const errors: Record<string, string> = {};

    // Validate required fields
    if (!name?.trim()) errors.name = "Required";
    if (!email?.trim()) errors.email = "Required";
    if (!password) errors.password = "Required";
    if (!organisationName?.trim()) errors.organisationName = "Required";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    // Validate field constraints
    if (name.trim().length > 100) {
      errors.name = "Name must be 100 characters or less";
    }
    if (!email.includes("@")) {
      errors.email = "Incorrect email format. Email must contain @";
    }
    if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (organisationName.trim().length > 50) {
      errors.organisationName = "Organisation Name must be 50 characters or less";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email exists across all user types
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

    // Hash password and create organiser
    const hashedPassword = await hashPassword(password);
    const organiser = await Organiser.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      organisationName: organisationName.trim(),
    });

    // Set auth cookie
    await setOrganiserCookie(organiser._id!.toString(), organiser.email);

    // Fire-and-forget: Mailchimp sync and welcome email
    syncOrganiserToMailchimp(
      organiser.email,
      organiser.name,
      organiser.organisationName,
    ).catch((err) => console.error("Mailchimp sync error:", err));

    sendOrganiserWelcomeEmail(organiser.email, organiser.name).catch((err) =>
      console.error("Welcome email error:", err),
    );

    return NextResponse.json({
      success: true,
      message: "Account created successfully. Welcome to EDUVENTS!",
      organiser: organiser.toJSON(),
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during registration" },
      { status: 500 },
    );
  }
}
