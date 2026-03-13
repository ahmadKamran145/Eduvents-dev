import { Metadata } from "next";
import { cache } from "react";
import dbConnect from "@/lib/mongodb";
import Event from "@/models/Event";
import Script from "next/script";

// Revalidate every hour so JSON-LD stays fresh without hitting DB on every request
export const revalidate = 3600;

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

// Deduplicate DB calls between generateMetadata and the layout component
const getEvent = cache(async (slug: string) => {
  try {
    await dbConnect();
    const eventDoc = await Event.findOne({ slug });
    return eventDoc ? eventDoc.toJSON() : null;
  } catch (error) {
    console.error("Error fetching event for layout:", error);
    return null;
  }
});

function getAttendanceMode(format: string): string {
  switch (format) {
    case "In-Person":
      return "https://schema.org/OfflineEventAttendanceMode";
    case "Virtual":
    case "On Demand":
      return "https://schema.org/OnlineEventAttendanceMode";
    case "Hybrid":
      return "https://schema.org/MixedEventAttendanceMode";
    default:
      return "https://schema.org/OfflineEventAttendanceMode";
  }
}

function getLocation(format: string, location: string, bookingUrl: string) {
  if (format === "Virtual" || format === "On Demand") {
    return {
      "@type": "VirtualLocation",
      url: bookingUrl,
    };
  }
  if (format === "Hybrid") {
    return [
      {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          streetAddress: location,
        },
      },
      {
        "@type": "VirtualLocation",
        url: bookingUrl,
      },
    ];
  }
  // In-Person
  return {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      streetAddress: location,
    },
  };
}

function getOffers(isFree: boolean, priceFrom?: number, priceTo?: number, price?: number) {
  if (isFree) {
    return {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
    };
  }
  const ticketPrice = priceFrom ?? price ?? priceTo ?? 0;
  return {
    "@type": "Offer",
    price: String(ticketPrice),
    priceCurrency: "GBP",
    availability: "https://schema.org/InStock",
  };
}

function isOnDemand(format: string): boolean {
  return format === "On Demand";
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const eventData = await getEvent(slug);

  if (eventData && eventData.status === "approved") {
    return {
      title: `${eventData.title} | EDUVENTS`,
      description: eventData.description,
      openGraph: {
        title: eventData.title,
        description: eventData.description,
        images: [eventData.image],
      },
    };
  }

  return {};
}

export default async function EventLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const eventData = await getEvent(slug);

  let jsonLd: object | null = null;

  // Only generate Schema.org markup for approved events
  if (eventData && eventData.status === "approved") {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://eduvents.co.uk";
    const onDemand = isOnDemand(eventData.format);

    const structuredData: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: eventData.title,
      description: eventData.description,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: getAttendanceMode(eventData.format),
      location: getLocation(eventData.format, eventData.location, eventData.bookingUrl),
      image: eventData.image,
      organizer: {
        "@type": "Organization",
        name: eventData.organiser,
      },
      offers: getOffers(
        eventData.isFree,
        eventData.priceFrom,
        eventData.priceTo,
        eventData.price,
      ),
      url: `${baseUrl}/event/${eventData.slug}`,
    };

    // Only include dates for non-On Demand events
    if (!onDemand && eventData.startDate) {
      structuredData.startDate = eventData.startTime
        ? `${eventData.startDate}T${eventData.startTime}:00`
        : eventData.startDate;

      if (eventData.endDate && eventData.endTime) {
        structuredData.endDate = `${eventData.endDate}T${eventData.endTime}:00`;
      } else if (eventData.endDate) {
        structuredData.endDate = eventData.endDate;
      }
    }

    jsonLd = structuredData;
  }

  return (
    <>
      {jsonLd && (
        <Script
          id="event-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          strategy="beforeInteractive"
        />
      )}
      {children}
    </>
  );
}
