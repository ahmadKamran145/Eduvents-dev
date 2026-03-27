"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function OrganiserRegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { organiserRegister, isOrganiserAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isOrganiserAuthenticated) {
      router.push("/organiser/dashboard");
    }
  }, [isOrganiserAuthenticated, isLoading, router]);

  if (isLoading || isOrganiserAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Required";
    else if (name.trim().length > 50)
      newErrors.name = "Name must be 50 characters or less";

    if (!email.trim()) newErrors.email = "Required";
    else if (!email.includes("@"))
      newErrors.email = "Incorrect email format. Email must contain @";

    if (!password) newErrors.password = "Required";
    else if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

    if (!organisationName.trim()) newErrors.organisationName = "Required";
    else if (organisationName.trim().length > 50)
      newErrors.organisationName =
        "Organisation Name must be 50 characters or less";

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await organiserRegister({
        name: name.trim(),
        email: email.trim(),
        password,
        organisationName: organisationName.trim(),
      });

      if (result.success) {
        router.push("/organiser/dashboard");
      } else {
        if (result.errors) {
          setErrors(result.errors);
        } else if (result.message) {
          setErrors({ general: result.message });
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

          <h1 className="text-xl font-semibold text-center text-gray-800 mb-2">
            Welcome to EDUVENTS
          </h1>
          <p className="text-center text-gray-500 text-sm mb-6">
            To start listing events, please create an account.
          </p>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                }}
                maxLength={50}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <p className={`text-xs mt-1 ${name.length >= 50 ? "text-red-500 font-medium" : "text-gray-400"}`}>
                {name.length}/50 characters
              </p>
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
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
                  if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password)
                      setErrors((p) => ({ ...p, password: "" }));
                  }}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Organisation Name */}
            <div>
              <label
                htmlFor="organisationName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Organisation Name
              </label>
              <input
                id="organisationName"
                type="text"
                placeholder="Your organisation"
                value={organisationName}
                onChange={(e) => {
                  setOrganisationName(e.target.value);
                  if (errors.organisationName)
                    setErrors((p) => ({ ...p, organisationName: "" }));
                }}
                maxLength={50}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <p className={`text-xs mt-1 ${organisationName.length >= 50 ? "text-red-500 font-medium" : "text-gray-400"}`}>
                {organisationName.length}/50 characters
              </p>
              {errors.organisationName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.organisationName}
                </p>
              )}
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isSubmitting ? "Creating Account..." : "Register"}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{" "}
              <Link
                href="/organiser/login"
                className="text-primary hover:underline font-medium"
              >
                Login
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
