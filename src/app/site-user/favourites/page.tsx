"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Link from "next/link";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import EventCard from "@/components/EventCard";
import { Event } from "@/data/events";

export default function FavouritesPage() {
  const { isSiteUserAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [favourites, setFavourites] = useState<Event[]>([]);
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
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
