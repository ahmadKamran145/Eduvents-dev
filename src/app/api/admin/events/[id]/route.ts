import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Event, { generateUniqueSlug } from '@/models/Event';
import { uploadToS3 } from '@/lib/s3';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

import { sendStatusUpdateEmail } from '@/lib/email';
import { geocodeAddress } from '@/lib/geocode';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const eventDoc = await Event.findById(id);
        if (!eventDoc) return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
        return NextResponse.json({ success: true, event: eventDoc.toJSON() });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const { status, featured } = body;

        const updateData: any = {};
        if (status) updateData.status = status;
        if (typeof featured === 'boolean') updateData.featured = featured;

        const eventDoc = await Event.findByIdAndUpdate(id, updateData, { new: true });
        if (!eventDoc) return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });

        // Trigger status update email
        if (status === 'approved' || status === 'rejected') {
            await sendStatusUpdateEmail(eventDoc.organiserEmail, eventDoc.organiser, eventDoc.title, status, eventDoc.slug);
        }

        return NextResponse.json({ success: true, event: eventDoc.toJSON() });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id: eventId } = await params;
        const formData = await req.formData();

        const existingEvent = await Event.findById(eventId);
        if (!existingEvent) return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });

        // Extract fields
        const updateData: any = {};
        const fields = [
            'title', 'description', 'category', 'format',
            'date', 'startDate', 'endDate', 'startTime', 'endTime', 'location', 'organiser',
            'organiserEmail', 'bookingUrl', 'isFree', 'priceFrom', 'priceTo'
        ];

        fields.forEach(field => {
            const val = formData.get(field);
            if (val !== null) {
                if (field === 'isFree') updateData[field] = val === 'true';
                else if (field === 'priceFrom' || field === 'priceTo') {
                    const num = (val as string) === "" ? null : parseFloat(val as string);
                    updateData[field] = num;
                }
                else updateData[field] = val;
            }
        });

        const subjectAreas = formData.get('subjectAreas');
        if (subjectAreas) updateData.subjectAreas = JSON.parse(subjectAreas as string);

        const phases = formData.get('phases');
        if (phases) updateData.phases = JSON.parse(phases as string);

        // Handle Image Update
        const file = formData.get('image') as File;
        if (file && typeof file !== 'string') {
            const buffer = Buffer.from(await file.arrayBuffer());
            const fileName = `${uuidv4()}-${file.name}`;
            const uploadDir = path.join(os.tmpdir(), 'uploads');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);

            const uploadResult = await uploadToS3(filePath, 'events');
            updateData.image = uploadResult.url;
        }

        // Regenerate slug if title changed
        if (updateData.title) {
            updateData.slug = await generateUniqueSlug(updateData.title, eventId);
        }

        // When switching to On Demand, $unset date/time/location/price fields so they're
        // actually removed from the document (setting to undefined is ignored by Mongoose $set)
        let unsetFields: any = {};
        const finalFormat = updateData.format || existingEvent.format;
        if (updateData.format === 'On Demand') {
            unsetFields = { startDate: 1, endDate: 1, startTime: 1, endTime: 1, location: 1, priceFrom: 1, priceTo: 1, lat: 1, lng: 1 };
            updateData.isFree = true;
        } else if (finalFormat === 'In-Person' || finalFormat === 'Hybrid') {
            // Re-geocode if location or format changed
            const locationChanged = updateData.location && updateData.location !== existingEvent.location;
            const formatChanged = updateData.format && updateData.format !== existingEvent.format;
            if (locationChanged || formatChanged) {
                const locationToGeocode = updateData.location || existingEvent.location;
                if (locationToGeocode) {
                    const coords = await geocodeAddress(locationToGeocode);
                    if (coords) {
                        updateData.lat = coords.lat;
                        updateData.lng = coords.lng;
                    }
                }
            }
        }

        const mongoUpdate: any = { $set: updateData };
        if (Object.keys(unsetFields).length > 0) mongoUpdate.$unset = unsetFields;

        const updatedEvent = await Event.findByIdAndUpdate(eventId, mongoUpdate, { new: true });

        return NextResponse.json({
            success: true,
            message: "Event Updated Successfully.",
            event: updatedEvent?.toJSON()
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const event = await Event.findByIdAndDelete(id);
        if (!event) return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
        return NextResponse.json({ success: true, message: 'Event deleted' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
