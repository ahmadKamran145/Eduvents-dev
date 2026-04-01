"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Layout from "@/components/Layout";
import {
  CalendarDays,
  Eye,
  MousePointerClick,
  CheckCircle,
  Plus,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import EventEditDialog from "@/components/organiser/EventEditDialog";

interface DashboardEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  format: string;
  subjectAreas: string[];
  phases: string[];
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  organiser: string;
  organiserEmail: string;
  image: string;
  bookingUrl: string;
  isFree: boolean;
  priceFrom?: number;
  priceTo?: number;
  status: string;
  submissionDate: string;
  views: number;
  clicks: number;
  featured: boolean;
}

interface DashboardStats {
  totalEvents: number;
  totalViews: number;
  totalClicks: number;
  activeEvents: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-600",
};

export default function OrganiserDashboard() {
  const { isOrganiserAuthenticated, isLoading, organiser } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalViews: 0,
    totalClicks: 0,
    activeEvents: 0,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<DashboardEvent | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch("/api/organiser/events");
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);
        setStats(data.stats);
      } else {
        toast.error("Failed to load dashboard data");
      }
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isOrganiserAuthenticated) {
      router.push("/organiser/login");
      return;
    }
    if (isOrganiserAuthenticated) {
      fetchDashboardData();
    }
  }, [isOrganiserAuthenticated, isLoading, router, fetchDashboardData]);

  // Refetch data when the page regains focus (e.g. returning from event detail)
  useEffect(() => {
    const onFocus = () => {
      if (isOrganiserAuthenticated) fetchDashboardData();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isOrganiserAuthenticated, fetchDashboardData]);

  if (isLoading || !isOrganiserAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredEvents =
    statusFilter === "all"
      ? events
      : events.filter((e) => e.status === statusFilter);

  const statCards = [
    {
      label: "Total Events Listed",
      value: stats.totalEvents,
      icon: CalendarDays,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Views",
      value: stats.totalViews,
      icon: Eye,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Total Clicks",
      value: stats.totalClicks,
      icon: MousePointerClick,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Active Events",
      value: stats.activeEvents,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  const filterTabs = ["all", "pending", "approved", "rejected", "expired"];

  return (
    <Layout>
      <div className="container-tight py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 truncate max-w-md">
              Welcome, {organiser?.name}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage your events and track performance
            </p>
          </div>
          <Link
            href="/list-event"
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            <Plus className="h-4 w-4" />
            List New Event
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-lg border border-gray-200 p-5"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                statusFilter === tab
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab}
              {tab !== "all" && (
                <span className="ml-1.5">
                  ({events.filter((e) => e.status === tab).length})
                </span>
              )}
              {tab === "all" && (
                <span className="ml-1.5">({events.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Events Table */}
        {isDataLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">
              {statusFilter === "all"
                ? "You haven't listed any events yet."
                : `No ${statusFilter} events found.`}
            </p>
            {statusFilter === "all" && (
              <Link
                href="/list-event"
                className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
              >
                <Plus className="h-4 w-4" />
                List Your First Event
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event Title
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event Date
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clicks
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CTR (%)
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEvents.map((event) => {
                    const ctr =
                      event.views > 0
                        ? ((event.clicks / event.views) * 100).toFixed(1)
                        : "0.0";
                    const canEdit =
                      event.status === "pending" ||
                      event.status === "approved";

                    return (
                      <tr
                        key={event.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[250px]">
                            {event.title}
                          </p>
                          {event.status === "rejected" && (
                            <p className="text-xs text-red-500 mt-1">
                              This event was rejected and cannot be edited.
                              Please submit a new listing.
                            </p>
                          )}
                          {event.status === "expired" && (
                            <p className="text-xs text-gray-500 mt-1">
                              This event has expired and cannot be edited.
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[event.status] || "bg-gray-100 text-gray-600"}`}
                          >
                            {event.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {event.format === "On Demand"
                            ? "On Demand"
                            : event.startDate
                              ? new Date(event.startDate).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {event.views.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {event.clicks.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {ctr}%
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {event.submissionDate
                            ? new Date(
                                event.submissionDate,
                              ).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {canEdit ? (
                            <button
                              onClick={() => setEditingEvent(event)}
                              className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Event Modal */}
      {editingEvent && (
        <EventEditDialog
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSuccess={() => {
            setEditingEvent(null);
            fetchDashboardData();
          }}
        />
      )}
    </Layout>
  );
}
