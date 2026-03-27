"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Users, Calendar } from "lucide-react";

export default function RegisterPage() {
  const { isOrganiserAuthenticated, isSiteUserAuthenticated, isLoading } =
    useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isOrganiserAuthenticated) router.push("/organiser/dashboard");
      else if (isSiteUserAuthenticated) router.push("/events");
    }
  }, [isOrganiserAuthenticated, isSiteUserAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="EDUVENTS"
            className="h-21 w-auto object-contain mx-auto mb-4"
          />
          <h1 className="text-2xl font-semibold text-gray-800">
            Create your EDUVENTS account
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Choose the type of account that best fits your needs
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Attending Events */}
          <Link
            href="/site-user/register"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:border-primary hover:shadow-md transition-all group text-center"
          >
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Attending Events?
            </h2>
            <p className="text-sm text-gray-500">
              Browse events, save favourites, and track your bookings
            </p>
          </Link>

          {/* Manage Events */}
          <Link
            href="/organiser/register"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:border-primary hover:shadow-md transition-all group text-center"
          >
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-green-100 transition-colors">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Organising Events?
            </h2>
            <p className="text-sm text-gray-500">
              List events, manage listings, and track performance
            </p>
          </Link>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary hover:underline font-medium"
          >
            Login
          </Link>
        </p>

        <div className="text-center mt-4">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
