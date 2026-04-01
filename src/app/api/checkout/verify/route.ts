import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import { sendEventConfirmationEmail, sendAdminNewEventNotification } from '@/lib/email';
import { getOrganiserFromCookie } from '@/lib/auth';

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia' as any,
    })
    : null;

export async function POST(req: NextRequest) {
    try {
        if (!stripe) {
            return NextResponse.json({ success: false, message: 'Stripe is not configured' }, { status: 500 });
        }

        await dbConnect();
        const { sessionId, eventId } = await req.json();

        if (!sessionId || !eventId) {
            return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Verify the requesting organiser owns this event
        const currentOrganiser = await getOrganiserFromCookie();
        if (!currentOrganiser) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        if (session.payment_status === 'paid') {
            const event = await Event.findById(eventId);
            if (!event) {
                return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
            }

            if (event.organiserId && event.organiserId.toString() !== currentOrganiser._id.toString()) {
                return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
            }

            if (event.paymentStatus !== 'paid') {
                event.paymentStatus = 'paid';
                event.stripeSessionId = sessionId;
                await event.save();

                // Now send the confirmation email
                await sendEventConfirmationEmail(event.organiserEmail, event.organiser, event.title);

                // Also notify admin about the new paid submission
                await sendAdminNewEventNotification(event);
            }

            return NextResponse.json({ success: true, event });
        } else {
            return NextResponse.json({ success: false, message: 'Payment not completed' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Verify Payment Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
