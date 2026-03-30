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
    // Re-fetch with populated favourites
    const populated = await SiteUser.findById(siteUser._id).populate({
      path: "favourites",
      model: Event,
    });

    const favourites = (populated?.favourites || []).map((event: any) => ({
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
      isFree: event.isFree,
      priceFrom: event.priceFrom,
      priceTo: event.priceTo,
      price: event.price,
      phases: event.phases,
      status: event.status,
      organiser: event.organiser,
    }));

    return NextResponse.json({ success: true, favourites });
  } catch (error: any) {
    console.error("Favourites fetch error:", error);
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

    const isFavourited = siteUser.favourites.some(
      (fav: any) => fav.toString() === eventId,
    );

    if (isFavourited) {
      await SiteUser.findByIdAndUpdate(siteUser._id, {
        $pull: { favourites: eventId },
      });
      return NextResponse.json({
        success: true,
        isFavourited: false,
        message: "Event removed from your favourites.",
      });
    } else {
      await SiteUser.findByIdAndUpdate(siteUser._id, {
        $addToSet: { favourites: eventId },
      });
      return NextResponse.json({
        success: true,
        isFavourited: true,
        message: "Event saved to your favourites.",
      });
    }
  } catch (error: any) {
    console.error("Favourite toggle error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
