"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import SubjectTagInput from "@/components/SubjectTagInput";
import { SubjectArea } from "@/data/events";

export default function SiteUserAccountPage() {
  const { isSiteUserAuthenticated, isLoading, siteUser, refreshSiteUser } =
    useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [subjectInterests, setSubjectInterests] = useState<SubjectArea[]>([]);
  const [role, setRole] = useState("");
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && !isSiteUserAuthenticated) {
      router.push("/login");
      return;
    }
    if (siteUser) {
      setName(siteUser.name);
      setSubjectInterests((siteUser.subjectInterests || []) as SubjectArea[]);
      setRole(siteUser.role);
    }
  }, [isSiteUserAuthenticated, isLoading, siteUser, router]);

  if (isLoading || !isSiteUserAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Required";
    else if (name.trim().length > 100)
      errors.name = "Name must be 100 characters or less";

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await fetch("/api/site-user/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subjectInterests,
          role,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Profile updated successfully.");
        await refreshSiteUser();
      } else {
        if (data.errors) setProfileErrors(data.errors);
        else toast.error(data.message || "Failed to update");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.currentPassword = "Required";
    if (!newPassword) errors.newPassword = "Required";
    else if (newPassword.length < 8)
      errors.newPassword = "Password must be at least 8 characters";
    if (!confirmPassword) errors.confirmPassword = "Required";
    else if (newPassword !== confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsSavingPassword(true);
    try {
      const response = await fetch("/api/site-user/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        if (data.errors) setPasswordErrors(data.errors);
        else toast.error(data.message || "Failed to change password");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <Layout>
      <div className="container-tight py-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Account Settings
        </h1>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={name} onChange={(e) => { setName(e.target.value); if (profileErrors.name) setProfileErrors((p) => ({ ...p, name: "" })); }}
                maxLength={100} className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
              {profileErrors.name && <p className="text-red-500 text-xs mt-1">{profileErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" value={siteUser?.email || ""} readOnly
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Interests</label>
              <SubjectTagInput selectedSubjects={subjectInterests} onChange={setSubjectInterests} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="role" value="teacher" checked={role === "teacher"} onChange={(e) => setRole(e.target.value)} className="w-4 h-4 text-primary" />
                  <span className="text-sm text-gray-700">Teacher</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="role" value="other" checked={role === "other"} onChange={(e) => setRole(e.target.value)} className="w-4 h-4 text-primary" />
                  <span className="text-sm text-gray-700">Other</span>
                </label>
              </div>
            </div>

            <button type="submit" disabled={isSavingProfile}
              className={`bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-6 rounded-md transition-colors ${isSavingProfile ? "opacity-70 cursor-not-allowed" : ""}`}>
              {isSavingProfile ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <div className="relative">
                <input type={showCurrentPassword ? "text" : "password"} value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); if (passwordErrors.currentPassword) setPasswordErrors((p) => ({ ...p, currentPassword: "" })); }}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordErrors.currentPassword && <p className="text-red-500 text-xs mt-1">{passwordErrors.currentPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input type={showNewPassword ? "text" : "password"} placeholder="Minimum 8 characters" value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); if (passwordErrors.newPassword) setPasswordErrors((p) => ({ ...p, newPassword: "" })); }}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordErrors.newPassword && <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (passwordErrors.confirmPassword) setPasswordErrors((p) => ({ ...p, confirmPassword: "" })); }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
              {passwordErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={isSavingPassword}
              className={`bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-6 rounded-md transition-colors ${isSavingPassword ? "opacity-70 cursor-not-allowed" : ""}`}>
              {isSavingPassword ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
