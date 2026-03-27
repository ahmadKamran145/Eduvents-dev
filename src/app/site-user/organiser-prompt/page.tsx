"use client";

import Link from "next/link";
import Layout from "@/components/Layout";

export default function OrganiserPromptPage() {
  return (
    <Layout>
      <div className="container-tight py-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-800 mb-3">
              Organiser Account Required
            </h1>
            <p className="text-gray-500 mb-6">
              To list an event, you need an Organiser account. Please create a
              separate Organiser account to start listing events on EDUVENTS.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/organiser/register"
                className="bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-6 rounded-md transition-colors"
              >
                Create Organiser Account
              </Link>
              <Link
                href="/events"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-6 rounded-md transition-colors"
              >
                Back to Events
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
