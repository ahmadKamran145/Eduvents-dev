import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Event from "@/models/Event";

export async function POST() {
  try {
    await dbConnect();

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "GOOGLE_MAPS_API_KEY is not set" },
        { status: 500 },
      );
    }

    // Find only approved, paid events with a location that are missing coordinates
    const events = await Event.find({
      status: "approved",
      paymentStatus: "paid",
      format: { $in: ["In-Person", "Hybrid"] },
      location: { $exists: true, $ne: "" },
      $or: [{ lat: { $exists: false } }, { lat: null }],
    });

    let succeeded = 0;
    let failed = 0;
    const details: { title: string; location: string; status: string; error?: string }[] = [];

    for (const event of events) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(event.location)}&key=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === "OK" && data.results?.[0]?.geometry?.location) {
          const { lat, lng } = data.results[0].geometry.location;
          await Event.findByIdAndUpdate(event._id, {
            $set: { lat, lng },
          });
          succeeded++;
          details.push({ title: event.title, location: event.location, status: "ok" });
        } else {
          failed++;
          details.push({
            title: event.title,
            location: event.location,
            status: data.status,
            error: data.error_message,
          });
        }
      } catch (err: any) {
        failed++;
        details.push({
          title: event.title,
          location: event.location,
          status: "exception",
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: events.length,
      succeeded,
      failed,
      details,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
