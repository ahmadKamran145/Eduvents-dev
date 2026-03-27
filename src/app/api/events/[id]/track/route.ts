import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Event from "@/models/Event";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const { type } = body;

    if (type !== "view" && type !== "click") {
      return NextResponse.json(
        { success: false, message: "Invalid tracking type" },
        { status: 400 },
      );
    }

    const field = type === "view" ? "views" : "clicks";
    await Event.findByIdAndUpdate(id, { $inc: { [field]: 1 } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
