"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Clock, PoundSterling, Heart } from "lucide-react";
import { Event, getCategoryColor } from "@/data/events";
import { Button } from "@/components/ui/button";
import { safeFormatDate, safeConvertTo12Hour } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface EventCardProps {
  event: Event;
}

const EventCard = ({ event }: EventCardProps) => {
  const {
    isAdminAuthenticated,
    isOrganiserAuthenticated,
    isSiteUserAuthenticated,
    siteUserFavourites,
    toggleFavourite,
  } = useAuth();
  const router = useRouter();

  const isLoggedIn = isAdminAuthenticated || isOrganiserAuthenticated || isSiteUserAuthenticated;
  const isOnDemand = event.format === "On Demand";
  const isFavourited = siteUserFavourites.includes(event.id);

  const formattedDate =
    event.startDate && event.endDate
      ? event.startDate === event.endDate
        ? safeFormatDate(event.startDate, "EEEE, MMMM d, yyyy")
        : `${safeFormatDate(event.startDate, "MMM d, yyyy")} - ${safeFormatDate(event.endDate, "MMM d, yyyy")}`
      : event.date
        ? safeFormatDate(event.date, "EEEE, MMMM d, yyyy")
        : "";
  const formattedStartTime = safeConvertTo12Hour(event.startTime);
  const formattedEndTime = safeConvertTo12Hour(event.endTime);

  const handleFavouriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSiteUserAuthenticated) {
      router.push(`/register?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    await toggleFavourite(event.id);
  };

  return (
    <div className="group bg-card rounded-lg overflow-hidden border border-transparent hover:border-primary/20 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 h-fit">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span
            className={`px-3 py-1 text-xs font-semibold text-primary-foreground rounded-full ${getCategoryColor(event.category)}`}
          >
            {event.category}
          </span>
          {isOnDemand && (
            <span className="px-3 py-1 text-xs font-semibold bg-secondary text-secondary-foreground rounded-full">
              On Demand
            </span>
          )}
        </div>
        {/* Favourite Heart - only for site users */}
        {isSiteUserAuthenticated && (
          <button
            onClick={handleFavouriteClick}
            className={`absolute top-3 right-3 p-1.5 rounded-full transition-colors ${
              isFavourited
                ? "bg-white/90 hover:bg-white"
                : "bg-black/30 hover:bg-black/50"
            }`}
            aria-label={isFavourited ? "Remove from favourites" : "Add to favourites"}
          >
            <Heart
              className={`h-4 w-4 ${
                isFavourited
                  ? "text-red-500 fill-red-500"
                  : "text-white"
              }`}
            />
          </button>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold text-lg text-card-foreground line-clamp-2 group-hover:text-primary transition-colors break-words">
            {event.title}
          </h3>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 break-words">
          {event.description}
        </p>

        <div className="space-y-2">
          {!isOnDemand && (
            <>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                <span>{formattedDate}</span>
              </div>
              {isLoggedIn && (
                <>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    <span>
                      {formattedStartTime} - {formattedEndTime}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                    <span className="line-clamp-1 break-all min-w-0">
                      {event.location}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <PoundSterling className="h-4 w-4 mr-2 text-primary" />
                    {event.isFree ? (
                      <span className="px-2 py-0.5 text-xs font-medium bg-success/10 text-success rounded-full">
                        Free
                      </span>
                    ) : event.priceFrom != null && event.priceTo != null ? (
                      <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        £{event.priceFrom} - £{event.priceTo}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        £{event.price ?? event.priceFrom ?? event.priceTo}
                      </span>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {event.phases && event.phases.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {event.phases.slice(0, 2).map((phase) => (
              <span
                key={phase}
                className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full"
              >
                {phase}
              </span>
            ))}
            {event.phases.length > 2 && (
              <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                +{event.phases.length - 2}
              </span>
            )}
          </div>
        )}

        <Link href={`/event/${event.slug || event.id}`} className="mt-4 block">
          <Button
            variant="outline"
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default EventCard;
