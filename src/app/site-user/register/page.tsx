"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import SubjectTagInput from "@/components/SubjectTagInput";
import { SubjectArea } from "@/data/events";
import { Suspense } from "react";

function SiteUserRegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subjectInterests, setSubjectInterests] = useState<SubjectArea[]>([]);
  const [role, setRole] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { siteUserRegister, isSiteUserAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    if (!isLoading && isSiteUserAuthenticated) {
      router.push(redirect || "/events");
    }
  }, [isSiteUserAuthenticated, isLoading, router, redirect]);

  if (isLoading || isSiteUserAuthenticated) {
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
    if (!role) newErrors.role = "Required";
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
      const result = await siteUserRegister({
        name: name.trim(),
        email: email.trim(),
        password,
        subjectInterests,
        role,
      });
      if (result.success) {
        router.push(redirect || "/events");
      } else {
        if (result.errors) setErrors(result.errors);
        else if (result.message) setErrors({ general: result.message });
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

          <h1 className="text-lg font-semibold text-center text-gray-800 mb-2">
            Welcome to EDUVENTS
          </h1>
          <p className="text-center text-gray-500 text-sm mb-4">
            In order for us to tailor recommendations to you, tell us a bit
            about yourself.
          </p>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-700 text-xs">
              You will need to create an Organiser account if you plan to list
              an event on EDUVENTS.
            </p>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                }}
                maxLength={50}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className={`text-xs mt-1 ${name.length >= 50 ? "text-red-500 font-medium" : "text-gray-400"}`}>
                {name.length}/50 characters
              </p>
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password)
                      setErrors((p) => ({ ...p, password: "" }));
                  }}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Which subjects are you interested in?
              </label>
              <SubjectTagInput
                selectedSubjects={subjectInterests}
                onChange={setSubjectInterests}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Are you a:
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={role === "teacher"}
                    onChange={(e) => {
                      setRole(e.target.value);
                      if (errors.role) setErrors((p) => ({ ...p, role: "" }));
                    }}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm text-gray-700">Teacher</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="other"
                    checked={role === "other"}
                    onChange={(e) => {
                      setRole(e.target.value);
                      if (errors.role) setErrors((p) => ({ ...p, role: "" }));
                    }}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm text-gray-700">Other</span>
                </label>
              </div>
              {errors.role && (
                <p className="text-red-500 text-xs mt-1">{errors.role}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-4 rounded-md transition-colors ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isSubmitting ? "Creating Account..." : "Register"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"}
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

export default function SiteUserRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <SiteUserRegisterForm />
    </Suspense>
  );
}
