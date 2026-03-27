import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Organiser from "@/models/Organiser";
import {
  getOrganiserFromCookie,
  hashPassword,
  comparePassword,
} from "@/lib/auth";

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
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const organiser = await getOrganiserFromCookie();
    if (!organiser) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    await dbConnect();
    const body = await request.json();
    const { name, organisationName, currentPassword, newPassword } = body;

    const errors: Record<string, string> = {};

    // Handle password change
    if (currentPassword || newPassword) {
      if (!currentPassword) {
        errors.currentPassword = "Required";
      }
      if (!newPassword) {
        errors.newPassword = "Required";
      } else if (newPassword.length < 8) {
        errors.newPassword = "Password must be at least 8 characters";
      }

      if (Object.keys(errors).length > 0) {
        return NextResponse.json({ success: false, errors }, { status: 400 });
      }

      const isPasswordValid = await comparePassword(
        currentPassword,
        organiser.password,
      );
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, errors: { currentPassword: "Incorrect password" } },
          { status: 400 },
        );
      }

      organiser.password = await hashPassword(newPassword);
    }

    // Handle profile update
    if (name !== undefined) {
      if (!name.trim()) {
        errors.name = "Required";
      } else if (name.trim().length > 100) {
        errors.name = "Name must be 100 characters or less";
      } else {
        organiser.name = name.trim();
      }
    }

    if (organisationName !== undefined) {
      if (!organisationName.trim()) {
        errors.organisationName = "Required";
      } else if (organisationName.trim().length > 50) {
        errors.organisationName =
          "Organisation Name must be 50 characters or less";
      } else {
        organiser.organisationName = organisationName.trim();
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    await organiser.save();

    return NextResponse.json({
      success: true,
      message: "Account updated successfully.",
      organiser: organiser.toJSON(),
    });
  } catch (error: any) {
    console.error("Account update error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
