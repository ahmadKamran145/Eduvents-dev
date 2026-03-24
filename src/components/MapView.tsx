"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, InfoWindow } from "@react-google-maps/api";
import { Event, getCategoryColor } from "@/data/events";
import { safeFormatDate, safeConvertTo12Hour } from "@/lib/utils";
import Link from "next/link";
import { Calendar, Clock, MapPin, PoundSterling } from "lucide-react";
import { Button } from "@/components/ui/button";

const UK_CENTER = { lat: 54.5, lng: -2.1 };
const DEFAULT_ZOOM = 6;

const CATEGORY_COLORS: Record<string, string> = {
  Webinar: "#8B5CF6",
  Podcast: "#A855F7",
  Conference: "#3B82F6",
  "CPD Training": "#10B981",
  "Awards Show": "#F59E0B",
  Festival: "#F97316",
  Exhibition: "#EF4444",
};

const mapContainerStyle = { width: "100%", height: "600px" };

interface MapViewProps {
  events: Event[];
}

export default function MapView({ events }: MapViewProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["marker"],
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [infoPosition, setInfoPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const eventsWithCoords = events.filter(
    (e) =>
      e.lat != null &&
      e.lng != null &&
      (e.format === "In-Person" || e.format === "Hybrid"),
  );

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  // Clear old markers and draw new ones whenever eventsWithCoords changes
  useEffect(() => {
    if (!mapRef.current || !isLoaded || !mapReady) return;

    // Remove old markers
    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];

    if (eventsWithCoords.length === 0) {
      mapRef.current.setCenter(UK_CENTER);
      mapRef.current.setZoom(DEFAULT_ZOOM);
      return;
    }

    const bounds = new google.maps.LatLngBounds();

    eventsWithCoords.forEach((event) => {
      const position = { lat: event.lat!, lng: event.lng! };
      bounds.extend(position);

      const color = CATEGORY_COLORS[event.category] || "#3B82F6";

      const pin = new google.maps.marker.PinElement({
        background: color,
        borderColor: "#ffffff",
        glyphColor: "#ffffff",
        scale: 1.2,
      });

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map: mapRef.current!,
        title: event.title,
        content: pin,
      });

      marker.addListener("click", () => {
        setSelectedEvent(event);
        setInfoPosition(position);
      });

      markersRef.current.push(marker);
    });

    if (eventsWithCoords.length === 1) {
      mapRef.current.setCenter(bounds.getCenter());
      mapRef.current.setZoom(12);
    } else {
      mapRef.current.fitBounds(bounds);
    }
  }, [eventsWithCoords, isLoaded, mapReady]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-card rounded-lg border-2 border-dashed border-muted-foreground/20">
        <p className="text-muted-foreground">
          Map could not be loaded. Please try refreshing the page.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-card rounded-lg">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden shadow-card">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={UK_CENTER}
        zoom={DEFAULT_ZOOM}
        onLoad={onMapLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID",
        }}
        onClick={() => {
          setSelectedEvent(null);
          setInfoPosition(null);
        }}
      >
        {selectedEvent && infoPosition && (
          <InfoWindow
            position={infoPosition}
            onCloseClick={() => {
              setSelectedEvent(null);
              setInfoPosition(null);
            }}
            options={{ maxWidth: 320, disableAutoPan: false }}
          >
            <MapEventCard event={selectedEvent} />
          </InfoWindow>
        )}
      </GoogleMap>

      {eventsWithCoords.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 pointer-events-none">
          <p className="bg-card px-4 py-2 rounded shadow text-sm text-muted-foreground">
            No events with map coordinates found. Try a different search.
          </p>
        </div>
      )}
    </div>
  );
}

function MapEventCard({ event }: { event: Event }) {
  const color = CATEGORY_COLORS[event.category] || "#3B82F6";
  const isOnDemand = event.format === "On Demand";
  const formattedDate =
    event.startDate && event.endDate
      ? event.startDate === event.endDate
        ? safeFormatDate(event.startDate, "EEE, MMM d, yyyy")
        : `${safeFormatDate(event.startDate, "MMM d")} – ${safeFormatDate(event.endDate, "MMM d, yyyy")}`
      : "";
  const startTime = safeConvertTo12Hour(event.startTime);
  const endTime = safeConvertTo12Hour(event.endTime);

  return (
    <div className="w-full max-w-72 font-sans overflow-hidden">
      {/* Image with category badge overlay */}
      <div className="relative -mx-2 -mt-2 mb-3">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-36 object-cover"
          />
        ) : (
          <div
            className="w-full h-24"
            style={{
              background: `linear-gradient(135deg, ${color}20, ${color}40)`,
            }}
          />
        )}
        <span
          className="absolute top-2 left-2 px-2.5 py-1 text-[11px] font-semibold text-white rounded-md shadow-sm"
          style={{ backgroundColor: color }}
        >
          {event.category}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-bold text-[15px] leading-snug text-gray-900 mb-2 line-clamp-2">
        {event.title}
      </h3>

      {/* Event details */}
      {!isOnDemand && (
        <div className="space-y-1.5 text-[13px] text-gray-500 mb-3">
          {formattedDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" style={{ color }} />
              <span>{formattedDate}</span>
            </div>
          )}
          {startTime && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" style={{ color }} />
              <span>
                {startTime} – {endTime}
              </span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color }} />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <PoundSterling className="h-3.5 w-3.5 flex-shrink-0" style={{ color }} />
            {event.isFree ? (
              <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-xs font-semibold">
                Free
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">
                {event.priceFrom != null && event.priceTo != null
                  ? `£${event.priceFrom} – £${event.priceTo}`
                  : `£${event.price ?? event.priceFrom ?? event.priceTo}`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* View Details button */}
      <Link href={`/event/${event.slug || event.id}`}>
        <button
          className="w-full text-sm py-2 px-4 rounded-lg font-semibold text-white transition-all hover:opacity-90 shadow-sm"
          style={{ backgroundColor: color }}
        >
          View Details
        </button>
      </Link>
    </div>
  );
}
