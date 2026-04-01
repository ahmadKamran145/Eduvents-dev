"use client";

import Link from "next/link";
import { Users, Calendar, X } from "lucide-react";

interface AccountTypePromptProps {
  isOpen: boolean;
  onClose: () => void;
  redirectUrl?: string;
}
//ok
const AccountTypePrompt = ({
  isOpen,
  onClose,
  redirectUrl,
}: AccountTypePromptProps) => {
  if (!isOpen) return null;

  const redirect = redirectUrl
    ? `?redirect=${encodeURIComponent(redirectUrl)}`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl p-8 max-w-lg w-full mx-4 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
          Create an Account
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          Choose the type of account that best fits your needs
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href={`/site-user/register${redirect}`}
            onClick={onClose}
            className="border border-gray-200 rounded-lg p-6 hover:border-primary hover:shadow-sm transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-800 mb-1">
              Attending Events?
            </h3>
            <p className="text-xs text-gray-500">
              Browse, save favourites & track bookings
            </p>
          </Link>

          <Link
            href={`/organiser/register${redirect}`}
            onClick={onClose}
            className="border border-gray-200 rounded-lg p-6 hover:border-primary hover:shadow-sm transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-green-100 transition-colors">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-800 mb-1">
              Organising Events?
            </h3>
            <p className="text-xs text-gray-500">
              List events & track performance
            </p>
          </Link>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link
            href="/login"
            onClick={onClose}
            className="text-primary hover:underline font-medium"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AccountTypePrompt;
