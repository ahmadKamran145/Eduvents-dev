"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    unifiedLogin,
    isAdminAuthenticated,
    isOrganiserAuthenticated,
    isSiteUserAuthenticated,
    isLoading,
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAdminAuthenticated) router.push("/admin");
      else if (isOrganiserAuthenticated) router.push("/organiser/dashboard");
      else if (isSiteUserAuthenticated) router.push("/events");
    }
  }, [
    isAdminAuthenticated,
    isOrganiserAuthenticated,
    isSiteUserAuthenticated,
    isLoading,
    router,
  ]);

  if (
    isLoading ||
    isAdminAuthenticated ||
    isOrganiserAuthenticated ||
    isSiteUserAuthenticated
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    if (!email) setEmailError("Required");
    if (!password) setPasswordError("Required");
    if (!email || !password) return;

    if (!email.includes("@")) {
      setEmailError("Incorrect email format. Email must contain @");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await unifiedLogin(email, password);
      if (result.success) {
        if (result.role === "admin") router.push("/admin");
        else if (result.role === "organiser")
          router.push("/organiser/dashboard");
        else if (result.role === "siteuser") router.push("/events");
      } else {
        if (result.errors) {
          if (result.errors.email) setEmailError(result.errors.email);
          if (result.errors.password) setPasswordError(result.errors.password);
        } else {
          setGeneralError(result.message || "Invalid email or password");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="EDUVENTS"
              className="h-21 w-auto object-contain"
            />
          </div>

          <h1 className="text-2xl font-semibold text-center text-gray-800 mb-2">
            Sign In
          </h1>
          <p className="text-center text-gray-500 text-sm mb-6">
            Use your email and password to sign in
          </p>

          {generalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{generalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                  if (generalError) setGeneralError("");
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              />
              {emailError && (
                <p className="text-red-500 text-xs mt-1">{emailError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                    if (generalError) setGeneralError("");
                  }}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-red-500 text-xs mt-1">{passwordError}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Link
                href="/organiser/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-primary hover:underline font-medium"
              >
                Register
              </Link>
            </p>

            <div className="text-center">
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
          </form>
        </div>
      </div>
    </div>
  );
}
