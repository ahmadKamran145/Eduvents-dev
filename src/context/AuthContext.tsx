"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface OrganiserUser {
  id: string;
  name: string;
  email: string;
  organisationName: string;
}

export interface SiteUserUser {
  id: string;
  name: string;
  email: string;
  subjectInterests: string[];
  role: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  organisationName: string;
}

interface SiteUserRegisterData {
  name: string;
  email: string;
  password: string;
  subjectInterests: string[];
  role: string;
}

interface AuthResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
}

interface UnifiedLoginResult extends AuthResult {
  role?: "admin" | "organiser" | "siteuser";
}

interface AuthContextType {
  // Admin auth
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  adminLogin: (email: string, pass: string) => Promise<boolean>;
  adminLogout: () => void;

  // Organiser auth
  organiser: OrganiserUser | null;
  isOrganiserAuthenticated: boolean;
  organiserLogin: (email: string, pass: string) => Promise<AuthResult>;
  organiserRegister: (data: RegisterData) => Promise<AuthResult>;
  organiserLogout: () => void;
  refreshOrganiser: () => Promise<void>;

  // Site User auth
  siteUser: SiteUserUser | null;
  isSiteUserAuthenticated: boolean;
  siteUserLogin: (email: string, pass: string) => Promise<AuthResult>;
  siteUserRegister: (data: SiteUserRegisterData) => Promise<AuthResult>;
  siteUserLogout: () => void;
  refreshSiteUser: () => Promise<void>;

  // Unified login
  unifiedLogin: (
    email: string,
    pass: string,
  ) => Promise<UnifiedLoginResult>;

  // Favourites & Booked Events (site user)
  siteUserFavourites: string[];
  toggleFavourite: (eventId: string) => Promise<boolean>;
  addBookedEvent: (eventId: string) => Promise<boolean>;

  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [organiser, setOrganiser] = useState<OrganiserUser | null>(null);
  const [siteUser, setSiteUser] = useState<SiteUserUser | null>(null);
  const [siteUserFavourites, setSiteUserFavourites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshOrganiser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/organiser/me");
      const data = await response.json();
      if (data.success && data.organiser) {
        setOrganiser(data.organiser);
      } else {
        setOrganiser(null);
      }
    } catch {
      setOrganiser(null);
    }
  }, []);

  const refreshSiteUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/site-user/me");
      const data = await response.json();
      if (data.success && data.siteUser) {
        setSiteUser(data.siteUser);
        // Load favourites
        const favResponse = await fetch("/api/site-user/favourites");
        const favData = await favResponse.json();
        if (favData.success) {
          setSiteUserFavourites(
            favData.favourites.map((f: any) => f.id),
          );
        }
      } else {
        setSiteUser(null);
        setSiteUserFavourites([]);
      }
    } catch {
      setSiteUser(null);
      setSiteUserFavourites([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const storedAuth = localStorage.getItem("isAdminAuthenticated");
      if (storedAuth === "true") {
        setIsAdminAuthenticated(true);
      }
      await Promise.all([refreshOrganiser(), refreshSiteUser()]);
      setIsLoading(false);
    };
    init();
  }, [refreshOrganiser, refreshSiteUser]);

  // Admin login
  const adminLogin = async (email: string, pass: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("isAdminAuthenticated", "true");
        setIsAdminAuthenticated(true);
        toast.success("Login Successful");
        return true;
      } else {
        toast.error(data.message || "Login Failed");
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
      return false;
    }
  };

  const adminLogout = () => {
    localStorage.removeItem("isAdminAuthenticated");
    setIsAdminAuthenticated(false);
    router.push("/");
    toast.info("Logged out");
  };

  // Unified login
  const unifiedLogin = async (
    email: string,
    pass: string,
  ): Promise<UnifiedLoginResult> => {
    try {
      const response = await fetch("/api/auth/unified-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await response.json();

      if (data.success) {
        if (data.role === "admin") {
          localStorage.setItem("isAdminAuthenticated", "true");
          setIsAdminAuthenticated(true);
        } else if (data.role === "organiser") {
          setOrganiser(data.user);
          setSiteUser(null);
          setSiteUserFavourites([]);
        } else if (data.role === "siteuser") {
          setSiteUser(data.user);
          setOrganiser(null);
          // Load favourites
          const favResponse = await fetch("/api/site-user/favourites");
          const favData = await favResponse.json();
          if (favData.success) {
            setSiteUserFavourites(
              favData.favourites.map((f: any) => f.id),
            );
          }
        }
        toast.success(data.message || "Login successful.");
        return { success: true, role: data.role };
      } else {
        return {
          success: false,
          message: data.message,
          errors: data.errors,
        };
      }
    } catch (error) {
      console.error("Unified login error:", error);
      return { success: false, message: "An error occurred during login" };
    }
  };

  // Organiser login
  const organiserLogin = async (
    email: string,
    pass: string,
  ): Promise<AuthResult> => {
    try {
      const response = await fetch("/api/auth/organiser/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await response.json();
      if (data.success) {
        setOrganiser(data.organiser);
        setSiteUser(null);
        setSiteUserFavourites([]);
        toast.success(data.message || "Login successful.");
        return { success: true };
      } else {
        return { success: false, message: data.message, errors: data.errors };
      }
    } catch (error) {
      console.error("Organiser login error:", error);
      return { success: false, message: "An error occurred during login" };
    }
  };

  const organiserRegister = async (
    registerData: RegisterData,
  ): Promise<AuthResult> => {
    try {
      const response = await fetch("/api/auth/organiser/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
      const data = await response.json();
      if (data.success) {
        setOrganiser(data.organiser);
        setSiteUser(null);
        setSiteUserFavourites([]);
        toast.success(
          data.message || "Account created successfully. Welcome to EDUVENTS!",
        );
        return { success: true };
      } else {
        return { success: false, message: data.message, errors: data.errors };
      }
    } catch (error) {
      console.error("Organiser register error:", error);
      return {
        success: false,
        message: "An error occurred during registration",
      };
    }
  };

  const organiserLogout = async () => {
    try {
      await fetch("/api/auth/organiser/logout", { method: "POST" });
    } catch {}
    setOrganiser(null);
    router.push("/");
    toast.info("Logged out");
  };

  // Site User login
  const siteUserLogin = async (
    email: string,
    pass: string,
  ): Promise<AuthResult> => {
    try {
      const response = await fetch("/api/auth/unified-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await response.json();
      if (data.success && data.role === "siteuser") {
        setSiteUser(data.user);
        setOrganiser(null);
        const favResponse = await fetch("/api/site-user/favourites");
        const favData = await favResponse.json();
        if (favData.success) {
          setSiteUserFavourites(favData.favourites.map((f: any) => f.id));
        }
        toast.success(data.message || "Login successful.");
        return { success: true };
      } else if (data.success) {
        return {
          success: false,
          message: "This email is not registered as a site user account.",
        };
      } else {
        return { success: false, message: data.message, errors: data.errors };
      }
    } catch (error) {
      console.error("Site user login error:", error);
      return { success: false, message: "An error occurred during login" };
    }
  };

  const siteUserRegister = async (
    registerData: SiteUserRegisterData,
  ): Promise<AuthResult> => {
    try {
      const response = await fetch("/api/auth/site-user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
      const data = await response.json();
      if (data.success) {
        setSiteUser(data.siteUser);
        setOrganiser(null);
        setSiteUserFavourites([]);
        toast.success(
          data.message || "Account created successfully. Welcome to EDUVENTS!",
        );
        return { success: true };
      } else {
        return { success: false, message: data.message, errors: data.errors };
      }
    } catch (error) {
      console.error("Site user register error:", error);
      return {
        success: false,
        message: "An error occurred during registration",
      };
    }
  };

  const siteUserLogout = async () => {
    try {
      await fetch("/api/auth/site-user/logout", { method: "POST" });
    } catch {}
    setSiteUser(null);
    setSiteUserFavourites([]);
    router.push("/");
    toast.info("Logged out");
  };

  // Favourites
  const toggleFavourite = async (eventId: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/site-user/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await response.json();
      if (data.success) {
        if (data.isFavourited) {
          setSiteUserFavourites((prev) => [...prev, eventId]);
        } else {
          setSiteUserFavourites((prev) => prev.filter((id) => id !== eventId));
        }
        toast.success(data.message);
        return data.isFavourited;
      }
      return false;
    } catch {
      toast.error("Failed to update favourite");
      return false;
    }
  };

  // Booked Events
  const addBookedEvent = async (eventId: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/site-user/booked-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await response.json();
      return data.success;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isAdminAuthenticated,
        isAdminAuthenticated,
        login: adminLogin,
        logout: adminLogout,
        adminLogin,
        adminLogout,

        organiser,
        isOrganiserAuthenticated: !!organiser,
        organiserLogin,
        organiserRegister,
        organiserLogout,
        refreshOrganiser,

        siteUser,
        isSiteUserAuthenticated: !!siteUser,
        siteUserLogin,
        siteUserRegister,
        siteUserLogout,
        refreshSiteUser,

        unifiedLogin,

        siteUserFavourites,
        toggleFavourite,
        addBookedEvent,

        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
