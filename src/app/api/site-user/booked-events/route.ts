import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SiteUser from "@/models/SiteUser";
import Event from "@/models/Event";
import { getSiteUserFromCookie } from "@/lib/auth";

export async function GET() {
  try {
    const siteUser = await getSiteUserFromCookie();
    if (!siteUser) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    await dbConnect();
    const populated = await SiteUser.findById(siteUser._id).populate({
      path: "bookedEvents",
      model: Event,
    });

    const bookedEvents = (populated?.bookedEvents || []).map((event: any) => ({
      id: event._id.toString(),
      title: event.title,
      slug: event.slug,
      description: event.description,
      category: event.category,
      format: event.format,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      image: event.image,
      bookingUrl: event.bookingUrl,
      status: event.status,
      organiser: event.organiser,
    }));

    return NextResponse.json({ success: true, bookedEvents });
  } catch (error: any) {
    console.error("Booked events fetch error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: "Event ID is required" },
        { status: 400 },
      );
    }

    await SiteUser.findByIdAndUpdate(siteUser._id, {
      $addToSet: { bookedEvents: eventId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Booked event add error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
