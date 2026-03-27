import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Organiser from "@/models/Organiser";
import { comparePassword, setOrganiserCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { email, password } = body;

    const errors: Record<string, string> = {};

    if (!email?.trim()) errors.email = "Required";
    if (!password) errors.password = "Required";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        {
          success: false,
          errors: {
            email: "Incorrect email format. Email must contain @",
          },
        },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const organiser = await Organiser.findOne({ email: normalizedEmail });

    if (!organiser) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 },
      );
    }

    const isPasswordValid = await comparePassword(password, organiser.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 },
      );
    }

    await setOrganiserCookie(organiser._id!.toString(), organiser.email);

    return NextResponse.json({
      success: true,
      message: "Login successful.",
      organiser: organiser.toJSON(),
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during login" },
      { status: 500 },
    );
  }
}
