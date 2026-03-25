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
  Webinar: "#166fce",
  Podcast: "#af56db",
  Conference: "#153455",
  "CPD Training": "#21af4e",
  "Awards Show": "#f49e0a",
  Festival: "#e2366f",
  Exhibition: "#f97415",
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
            options={{ maxWidth: isMobile ? 260 : 320, disableAutoPan: false }}
          >
            <MapEventCard event={selectedEvent} isMobile={isMobile} />
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

function MapEventCard({ event, isMobile }: { event: Event; isMobile: boolean }) {
  const color = CATEGORY_COLORS[event.category] || "#3B82F6";
  const categoryClass = getCategoryColor(event.category);
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
    <div className={`w-full font-sans overflow-hidden ${isMobile ? "max-w-[220px]" : "max-w-72"}`}>
      {/* Image with category badge overlay */}
      <div className="relative -mx-2 -mt-2 mb-2 sm:mb-3">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className={`w-full object-cover ${isMobile ? "h-24" : "h-36"}`}
          />
        ) : (
          <div
            className={`w-full ${isMobile ? "h-16" : "h-24"}`}
            style={{
              background: `linear-gradient(135deg, ${color}20, ${color}40)`,
            }}
          />
        )}
        <span
          className={`absolute top-2 left-2 font-semibold text-white rounded-full shadow-sm ${categoryClass} ${isMobile ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-1 text-[11px]"}`}
        >
          {event.category}
        </span>
      </div>

      {/* Title */}
      <h3 className={`font-bold leading-snug text-gray-900 mb-1.5 line-clamp-2 ${isMobile ? "text-[13px]" : "text-[15px] mb-2"}`}>
        {event.title}
      </h3>

      {/* Event details */}
      {!isOnDemand && (
        <div className={`text-muted-foreground mb-2 ${isMobile ? "space-y-1 text-[11px]" : "space-y-1.5 text-[13px] mb-3"}`}>
          {formattedDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className={`flex-shrink-0 text-primary ${isMobile ? "h-3 w-3" : "h-3.5 w-3.5"}`} />
              <span className="truncate">{formattedDate}</span>
            </div>
          )}
          {startTime && (
            <div className="flex items-center gap-1.5">
              <Clock className={`flex-shrink-0 text-primary ${isMobile ? "h-3 w-3" : "h-3.5 w-3.5"}`} />
              <span>
                {startTime} – {endTime}
              </span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className={`flex-shrink-0 text-primary ${isMobile ? "h-3 w-3" : "h-3.5 w-3.5"}`} />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <PoundSterling className={`flex-shrink-0 text-primary ${isMobile ? "h-3 w-3" : "h-3.5 w-3.5"}`} />
            {event.isFree ? (
              <span className={`bg-success/10 text-success rounded-full font-semibold ${isMobile ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"}`}>
                Free
              </span>
            ) : (
              <span className={`bg-primary/10 text-primary rounded-full font-semibold ${isMobile ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"}`}>
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
          className={`w-full rounded-lg font-semibold text-white transition-all hover:opacity-90 shadow-sm ${categoryClass} ${isMobile ? "text-xs py-1.5 px-3" : "text-sm py-2 px-4"}`}
        >
          View Details
        </button>
      </Link>
    </div>
  );
}
