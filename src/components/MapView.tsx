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
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [infoPosition, setInfoPosition] = useState<{ lat: number; lng: number } | null>(null);

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
    markersRef.current.forEach((m) => m.setMap(null));
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

      // Standard map pin SVG path (like Google Maps default red pin)
      const pinPath =
        "M12 0C5.372 0 0 5.372 0 12c0 9 12 24 12 24s12-15 12-24c0-6.628-5.372-12-12-12zm0 16.8a4.8 4.8 0 1 1 0-9.6 4.8 4.8 0 0 1 0 9.6z";

      const marker = new google.maps.Marker({
        position,
        map: mapRef.current!,
        title: event.title,
        icon: {
          path: pinPath,
          fillColor: "#16A34A",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 1.5,
          scale: 1.4,
          anchor: new google.maps.Point(12, 36),
          labelOrigin: new google.maps.Point(12, 12),
        },
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
    <div className="w-64 font-sans">
      {event.image && (
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-32 object-cover rounded mb-2"
        />
      )}
      <span
        className="inline-block px-2 py-0.5 text-xs font-semibold text-white rounded-full mb-1"
        style={{ backgroundColor: color }}
      >
        {event.category}
      </span>
      <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
        {event.title}
      </h3>
      {!isOnDemand && (
        <div className="space-y-1 text-xs text-gray-600 mb-2">
          {formattedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-blue-500 flex-shrink-0" />
              <span>{formattedDate}</span>
            </div>
          )}
          {startTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-500 flex-shrink-0" />
              <span>
                {startTime} – {endTime}
              </span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-blue-500 flex-shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <PoundSterling className="h-3 w-3 text-blue-500 flex-shrink-0" />
            {event.isFree ? (
              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Free
              </span>
            ) : (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {event.priceFrom != null && event.priceTo != null
                  ? `£${event.priceFrom} – £${event.priceTo}`
                  : `£${event.price ?? event.priceFrom ?? event.priceTo}`}
              </span>
            )}
          </div>
        </div>
      )}
      <Link href={`/event/${event.slug || event.id}`}>
        <button
          className="w-full text-xs py-1.5 px-3 border border-gray-300 rounded hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors font-medium"
        >
          View Details
        </button>
      </Link>
    </div>
  );
}
