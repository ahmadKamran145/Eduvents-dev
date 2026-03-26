import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Event, { generateUniqueSlug } from "@/models/Event";
import { getOrganiserFromCookie } from "@/lib/auth";
import { uploadToS3 } from "@/lib/s3";
import { geocodeAddress } from "@/lib/geocode";
import { sendEventEditNotificationToAdmin } from "@/lib/email";
import path from "path";
import fs from "fs";
import os from "os";
import { v4 as uuidv4 } from "uuid";

async function verifyOwnership(eventId: string, organiserId: string, organiserEmail: string) {
  const event = await Event.findById(eventId);
  if (!event) return null;
  const isOwner =
    (event.organiserId && event.organiserId.toString() === organiserId) ||
    event.organiserEmail === organiserEmail;
  return isOwner ? event : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const organiser = await getOrganiserFromCookie();
    if (!organiser) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    await dbConnect();
    const { id } = await params;
    const event = await verifyOwnership(id, organiser._id!.toString(), organiser.email);

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found or access denied" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, event: event.toJSON() });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const organiser = await getOrganiserFromCookie();
    if (!organiser) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    await dbConnect();
    const { id: eventId } = await params;
    const existingEvent = await verifyOwnership(eventId, organiser._id!.toString(), organiser.email);

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, message: "Event not found or access denied" },
        { status: 404 },
      );
    }

    // Check if event can be edited
    if (existingEvent.status === "rejected") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This event was rejected and cannot be edited. Please submit a new listing.",
        },
        { status: 400 },
      );
    }
    if (existingEvent.status === "expired") {
      return NextResponse.json(
        {
          success: false,
          message: "This event has expired and cannot be edited.",
        },
        { status: 400 },
      );
    }

    const wasApproved = existingEvent.status === "approved";
    const formData = await req.formData();

    // Extract fields
    const updateData: any = {};
    const fields = [
      "title",
      "description",
      "category",
      "format",
      "startDate",
      "endDate",
      "startTime",
      "endTime",
      "location",
      "organiser",
      "organiserEmail",
      "bookingUrl",
      "isFree",
      "priceFrom",
      "priceTo",
    ];

    fields.forEach((field) => {
      const val = formData.get(field);
      if (val !== null) {
        if (field === "isFree") updateData[field] = val === "true";
        else if (field === "priceFrom" || field === "priceTo") {
          const num =
            (val as string) === "" ? null : parseFloat(val as string);
          updateData[field] = num;
        } else updateData[field] = val;
      }
    });

    const subjectAreas = formData.get("subjectAreas");
    if (subjectAreas)
      updateData.subjectAreas = JSON.parse(subjectAreas as string);

    const phases = formData.get("phases");
    if (phases) updateData.phases = JSON.parse(phases as string);

    // Handle Image Update
    const file = formData.get("image") as File;
    if (file && typeof file !== "string") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${uuidv4()}-${file.name}`;
      const uploadDir = path.join(os.tmpdir(), "uploads");
      if (!fs.existsSync(uploadDir))
        fs.mkdirSync(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);

      const uploadResult = await uploadToS3(filePath, "events");
      updateData.image = uploadResult.url;
    }

    // Regenerate slug if title changed
    if (updateData.title) {
      updateData.slug = await generateUniqueSlug(updateData.title, eventId);
    }

    // Handle On Demand format
    let unsetFields: any = {};
    const finalFormat = updateData.format || existingEvent.format;
    if (updateData.format === "On Demand") {
      unsetFields = {
        startDate: 1,
        endDate: 1,
        startTime: 1,
        endTime: 1,
        location: 1,
        priceFrom: 1,
        priceTo: 1,
        lat: 1,
        lng: 1,
      };
      for (const key of Object.keys(unsetFields)) {
        delete updateData[key];
      }
      updateData.isFree = true;
    } else if (finalFormat === "In-Person" || finalFormat === "Hybrid") {
      const locationChanged =
        updateData.location &&
        updateData.location !== existingEvent.location;
      const formatChanged =
        updateData.format && updateData.format !== existingEvent.format;
      if (locationChanged || formatChanged) {
        const locationToGeocode =
          updateData.location || existingEvent.location;
        if (locationToGeocode) {
          const coords = await geocodeAddress(locationToGeocode);
          if (coords) {
            updateData.lat = coords.lat;
            updateData.lng = coords.lng;
          }
        }
      }
    }

    // If event was approved, revert to pending
    if (wasApproved) {
      updateData.status = "pending";
    }

    const mongoUpdate: any = { $set: updateData };
    if (Object.keys(unsetFields).length > 0)
      mongoUpdate.$unset = unsetFields;

    const updatedEvent = await Event.findByIdAndUpdate(eventId, mongoUpdate, {
      new: true,
    });

    // Notify admin if approved event was edited
    if (wasApproved) {
      sendEventEditNotificationToAdmin(
        updatedEvent!.title,
        organiser.name,
      ).catch((err) =>
        console.error("Admin edit notification error:", err),
      );
    }

    const message = wasApproved
      ? "Event updated successfully. Your event is now pending re-approval."
      : "Event updated successfully.";

    return NextResponse.json({
      success: true,
      message,
      event: updatedEvent?.toJSON(),
    });
  } catch (error: any) {
    console.error("Event edit error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
