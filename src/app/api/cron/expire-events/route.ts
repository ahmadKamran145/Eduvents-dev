import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Event from "@/models/Event";
import { sendEventExpiredEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await dbConnect();

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Find all approved events where endDate is in the past (before today)
    // On Demand events have no endDate, so they are excluded naturally
    const expiredEvents = await Event.find({
      status: "approved",
      endDate: { $lt: today, $ne: "" },
    });

    let expiredCount = 0;
    const errors: string[] = [];

    for (const event of expiredEvents) {
      try {
        event.status = "expired";
        event.expiredAt = today;
        await event.save();
        expiredCount++;

        // Send expiry notification email (non-blocking)
        sendEventExpiredEmail(
          event.organiserEmail,
          event.organiser,
          event.title,
        ).catch((err) =>
          console.error(
            `Failed to send expiry email for event ${event.title}:`,
            err,
          ),
        );
      } catch (err: any) {
        console.error(`Failed to expire event ${event._id}:`, err);
        errors.push(`Event ${event._id}: ${err.message}`);
      }
    }

    console.log(
      `Cron: Expired ${expiredCount} events out of ${expiredEvents.length} found`,
    );

    return NextResponse.json({
      success: true,
      message: `Expired ${expiredCount} events`,
      totalFound: expiredEvents.length,
      expiredCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Cron expire-events error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// Also support GET for Vercel Cron Jobs
export async function GET(req: NextRequest) {
  return POST(req);
}
