import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Event from "@/models/Event";
import { getOrganiserFromCookie } from "@/lib/auth";

export async function GET() {
  try {
    const organiser = await getOrganiserFromCookie();
    if (!organiser) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    await dbConnect();

    // Find events by organiserId OR by organiserEmail (for legacy events)
    const allEvents = await Event.find({
      $and: [
        {
          $or: [
            { organiserId: organiser._id },
            { organiserEmail: organiser.email },
          ],
        },
        {
          $or: [{ paymentStatus: "paid" }, { isAdminCreated: true }],
        },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary stats
    const totalEvents = allEvents.length;
    const totalViews = allEvents.reduce(
      (sum, e) => sum + ((e as any).views || 0),
      0,
    );
    const totalClicks = allEvents.reduce(
      (sum, e) => sum + ((e as any).clicks || 0),
      0,
    );
    const activeEvents = allEvents.filter(
      (e) => e.status === "approved",
    ).length;

    // Transform events for response
    const transformedEvents = allEvents.map((e: any) => ({
      id: e._id.toString(),
      title: e.title,
      slug: e.slug,
      description: e.description,
      category: e.category,
      format: e.format,
      subjectAreas: e.subjectAreas,
      phases: e.phases,
      startDate: e.startDate,
      endDate: e.endDate,
      startTime: e.startTime,
      endTime: e.endTime,
      location: e.location,
      organiser: e.organiser,
      organiserEmail: e.organiserEmail,
      image: e.image,
      bookingUrl: e.bookingUrl,
      isFree: e.isFree,
      priceFrom: e.priceFrom,
      priceTo: e.priceTo,
      status: e.status,
      submissionDate: e.submissionDate,
      views: e.views || 0,
      clicks: e.clicks || 0,
      featured: e.featured,
    }));

    return NextResponse.json({
      success: true,
      events: transformedEvents,
      stats: { totalEvents, totalViews, totalClicks, activeEvents },
    });
  } catch (error: any) {
    console.error("Dashboard events error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
