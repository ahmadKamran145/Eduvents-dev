"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Link from "next/link";
import { Heart, MapPin, Clock, PoundSterling } from "lucide-react";
import { toast } from "sonner";
import { safeFormatDate, safeConvertTo12Hour } from "@/lib/utils";

interface FavouriteEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  format: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  image: string;
  bookingUrl: string;
  isFree: boolean;
  priceFrom?: number;
  priceTo?: number;
  status: string;
  organiser: string;
}

export default function FavouritesPage() {
  const { isSiteUserAuthenticated, isLoading, toggleFavourite } = useAuth();
  const router = useRouter();
  const [favourites, setFavourites] = useState<FavouriteEvent[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isSiteUserAuthenticated) {
      router.push("/login");
      return;
    }
    if (isSiteUserAuthenticated) {
      fetch("/api/site-user/favourites")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setFavourites(data.favourites);
        })
        .catch(() => toast.error("Failed to load favourites"))
        .finally(() => setIsDataLoading(false));
    }
  }, [isSiteUserAuthenticated, isLoading, router]);

  const handleUnfavourite = async (eventId: string) => {
    await toggleFavourite(eventId);
    setFavourites((prev) => prev.filter((e) => e.id !== eventId));
  };

  if (isLoading || !isSiteUserAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container-tight py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          My Favourites
        </h1>

        {isDataLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : favourites.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              You haven&apos;t favourited any events yet.
            </p>
            <Link
              href="/events"
              className="inline-flex bg-primary text-white px-5 py-2.5 rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
            >
              Find Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favourites.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-primary text-white text-xs font-medium px-2.5 py-1 rounded-full">
                    {event.category}
                  </span>
                  {event.status === "expired" && (
                    <span className="absolute top-3 right-12 bg-gray-600 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                      Expired
                    </span>
                  )}
                  <button
                    onClick={() => handleUnfavourite(event.id)}
                    className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
                  >
                    <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <p>
                      {event.format === "On Demand"
                        ? "On Demand"
                        : event.startDate
                          ? safeFormatDate(event.startDate, "MMM d, yyyy")
                          : ""}
                    </p>
                    {event.startTime && (
                      <p className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {safeConvertTo12Hour(event.startTime)}
                      </p>
                    )}
                    {event.location && (
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location}
                      </p>
                    )}
                    <p className="flex items-center gap-1">
                      <PoundSterling className="h-3.5 w-3.5" />
                      {event.isFree
                        ? "Free"
                        : event.priceFrom
                          ? `£${event.priceFrom}${event.priceTo ? ` - £${event.priceTo}` : ""}`
                          : "Paid"}
                    </p>
                  </div>
                  <Link
                    href={`/event/${event.slug}`}
                    className="block w-full text-center bg-primary text-white text-sm font-medium py-2 rounded-md hover:bg-primary/90 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
