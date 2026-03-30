"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import EventCard from "@/components/EventCard";
import { Event } from "@/data/events";

export default function BookedEventsPage() {
  const { isSiteUserAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [bookedEvents, setBookedEvents] = useState<Event[]>([]);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
