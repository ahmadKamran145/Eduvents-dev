import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Event from "@/models/Event";
import { geocodeAddress } from "@/lib/geocode";

export async function POST() {
  try {
    await dbConnect();

    // Find all In-Person / Hybrid events that are missing coordinates
    const events = await Event.find({
      format: { $in: ["In-Person", "Hybrid"] },
      location: { $exists: true, $ne: "" },
      $or: [{ lat: { $exists: false } }, { lat: null }],
    });

    let succeeded = 0;
    let failed = 0;

    for (const event of events) {
      try {
        // Debug: log what Google returns
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        const debugUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(event.location)}&key=${apiKey}`;
        const debugRes = await fetch(debugUrl);
        const debugData = await debugRes.json();
        console.log(`[geocode] "${event.location}" → status: ${debugData.status}, error: ${debugData.error_message || "none"}`);

        const coords = await geocodeAddress(event.location);
        if (coords) {
          await Event.findByIdAndUpdate(event._id, {
            $set: { lat: coords.lat, lng: coords.lng },
          });
          succeeded++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`[geocode] failed for "${event.location}":`, err);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: events.length,
      succeeded,
      failed,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
