import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getSiteUserFromCookie, hashPassword, comparePassword } from "@/lib/auth";

export async function GET() {
  try {
    const siteUser = await getSiteUserFromCookie();
    if (!siteUser) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }
    return NextResponse.json({ success: true, siteUser: siteUser.toJSON() });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const siteUser = await getSiteUserFromCookie();
    if (!siteUser) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    await dbConnect();
    const body = await request.json();
    const { name, subjectInterests, role, currentPassword, newPassword } = body;

    const errors: Record<string, string> = {};

    if (currentPassword || newPassword) {
      if (!currentPassword) errors.currentPassword = "Required";
      if (!newPassword) errors.newPassword = "Required";
      else if (newPassword.length < 8)
        errors.newPassword = "Password must be at least 8 characters";

      if (Object.keys(errors).length > 0) {
        return NextResponse.json({ success: false, errors }, { status: 400 });
      }

      const isPasswordValid = await comparePassword(
        currentPassword,
        siteUser.password,
      );
      if (!isPasswordValid) {
        return NextResponse.json(
          {
            success: false,
            errors: { currentPassword: "Incorrect password" },
          },
          { status: 400 },
        );
      }

      siteUser.password = await hashPassword(newPassword);
    }

    if (name !== undefined) {
      if (!name.trim()) errors.name = "Required";
      else if (name.trim().length > 100)
        errors.name = "Name must be 100 characters or less";
      else siteUser.name = name.trim();
    }

    if (subjectInterests !== undefined) {
      siteUser.subjectInterests = subjectInterests;
    }

    if (role !== undefined) {
      if (role !== "teacher" && role !== "other")
        errors.role = "Please select a valid role";
      else siteUser.role = role;
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    await siteUser.save();

    return NextResponse.json({
      success: true,
      message: "Account updated successfully.",
      siteUser: siteUser.toJSON(),
    });
  } catch (error: any) {
    console.error("Account update error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
