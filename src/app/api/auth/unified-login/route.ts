import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Organiser from "@/models/Organiser";
import SiteUser from "@/models/SiteUser";
import {
  comparePassword,
  setOrganiserCookie,
  setSiteUserCookie,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
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
          errors: { email: "Incorrect email format. Email must contain @" },
        },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check admin credentials
    try {
      const adminCredentialsJson = process.env.ADMIN_CREDENTIALS;
      if (adminCredentialsJson) {
        const adminCredentials: Array<{ email: string; password: string }> =
          JSON.parse(adminCredentialsJson);
        const matchingAdmin = adminCredentials.find(
          (admin) =>
            admin.email.toLowerCase() === normalizedEmail &&
            admin.password === password,
        );
        if (matchingAdmin) {
          return NextResponse.json({
            success: true,
            message: "Login successful.",
            role: "admin",
            user: { email: matchingAdmin.email, role: "admin" },
          });
        }
      }
    } catch {}

    await dbConnect();

    // 2. Check Organiser collection
    const organiser = await Organiser.findOne({ email: normalizedEmail });
    if (organiser) {
      const isPasswordValid = await comparePassword(
        password,
        organiser.password,
      );
      if (isPasswordValid) {
        await setOrganiserCookie(organiser._id!.toString(), organiser.email);
        return NextResponse.json({
          success: true,
          message: "Login successful.",
          role: "organiser",
          user: organiser.toJSON(),
        });
      }
    }

    // 3. Check SiteUser collection
    const siteUser = await SiteUser.findOne({ email: normalizedEmail });
    if (siteUser) {
      const isPasswordValid = await comparePassword(
        password,
        siteUser.password,
      );
      if (isPasswordValid) {
        await setSiteUserCookie(siteUser._id!.toString(), siteUser.email);
        return NextResponse.json({
          success: true,
          message: "Login successful.",
          role: "siteuser",
          user: siteUser.toJSON(),
        });
      }
    }

    return NextResponse.json(
      { success: false, message: "Invalid email or password" },
      { status: 401 },
    );
  } catch (error: any) {
    console.error("Unified login error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during login" },
      { status: 500 },
    );
  }
}
