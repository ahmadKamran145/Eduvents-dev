"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import { safeFormatDate } from "@/lib/utils";

interface BookedEvent {
  id: string;
  title: string;
  slug: string;
  format: string;
  startDate: string;
  endDate: string;
  image: string;
  bookingUrl: string;
  status: string;
}

export default function BookedEventsPage() {
  const { isSiteUserAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [bookedEvents, setBookedEvents] = useState<BookedEvent[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isSiteUserAuthenticated) {
      router.push("/login");
      return;
    }
    if (isSiteUserAuthenticated) {
      fetch("/api/site-user/booked-events")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setBookedEvents(data.bookedEvents);
        })
        .catch(() => toast.error("Failed to load booked events"))
        .finally(() => setIsDataLoading(false));
    }
  }, [isSiteUserAuthenticated, isLoading, router]);

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
          My Booked Events
        </h1>

        {isDataLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : bookedEvents.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              You haven&apos;t booked any events yet.
            </p>
            <Link
              href="/events"
              className="inline-flex bg-primary text-white px-5 py-2.5 rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
            >
              Find Events
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookedEvents.map((event) => {
              const isExpired = event.status === "expired";
              return (
                <div
                  key={event.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full sm:w-24 h-24 object-cover rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {event.format === "On Demand"
                        ? "On Demand"
                        : event.startDate
                          ? safeFormatDate(event.startDate, "MMM d, yyyy")
                          : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${isExpired ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-800"}`}
                    >
                      {isExpired ? "Expired" : "Active"}
                    </span>
                    <a
                      href={event.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors whitespace-nowrap"
                    >
                      {event.format === "On Demand" ? "Watch Now" : "Book Now"}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
