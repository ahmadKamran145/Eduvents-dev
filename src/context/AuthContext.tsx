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

interface RegisterData {
  name: string;
  email: string;
  password: string;
  organisationName: string;
}

interface AuthContextType {
  // Admin auth (backward compatible)
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  adminLogin: (email: string, pass: string) => Promise<boolean>;
  adminLogout: () => void;

  // Organiser auth
  organiser: OrganiserUser | null;
  isOrganiserAuthenticated: boolean;
  organiserLogin: (
    email: string,
    pass: string,
  ) => Promise<{ success: boolean; message?: string; errors?: Record<string, string> }>;
  organiserRegister: (
    data: RegisterData,
  ) => Promise<{ success: boolean; message?: string; errors?: Record<string, string> }>;
  organiserLogout: () => void;
  refreshOrganiser: () => Promise<void>;

  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [organiser, setOrganiser] = useState<OrganiserUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check organiser session via cookie
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

  useEffect(() => {
    const init = async () => {
      // Check admin auth from localStorage
      const storedAuth = localStorage.getItem("isAdminAuthenticated");
      if (storedAuth === "true") {
        setIsAdminAuthenticated(true);
      }

      // Check organiser auth from cookie
      await refreshOrganiser();

      setIsLoading(false);
    };
    init();
  }, [refreshOrganiser]);

  // Admin login (backward compatible)
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

  // Organiser login
  const organiserLogin = async (email: string, pass: string) => {
    try {
      const response = await fetch("/api/auth/organiser/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await response.json();

      if (data.success) {
        setOrganiser(data.organiser);
        toast.success(data.message || "Login successful.");
        return { success: true };
      } else {
        return {
          success: false,
          message: data.message,
          errors: data.errors,
        };
      }
    } catch (error) {
      console.error("Organiser login error:", error);
      return { success: false, message: "An error occurred during login" };
    }
  };

  // Organiser register
  const organiserRegister = async (registerData: RegisterData) => {
    try {
      const response = await fetch("/api/auth/organiser/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (data.success) {
        setOrganiser(data.organiser);
        toast.success(
          data.message || "Account created successfully. Welcome to EDUVENTS!",
        );
        return { success: true };
      } else {
        return {
          success: false,
          message: data.message,
          errors: data.errors,
        };
      }
    } catch (error) {
      console.error("Organiser register error:", error);
      return {
        success: false,
        message: "An error occurred during registration",
      };
    }
  };

  // Organiser logout
  const organiserLogout = async () => {
    try {
      await fetch("/api/auth/organiser/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setOrganiser(null);
    router.push("/");
    toast.info("Logged out");
  };

  return (
    <AuthContext.Provider
      value={{
        // Admin (backward compatible)
        isAuthenticated: isAdminAuthenticated,
        isAdminAuthenticated,
        login: adminLogin,
        logout: adminLogout,
        adminLogin,
        adminLogout,

        // Organiser
        organiser,
        isOrganiserAuthenticated: !!organiser,
        organiserLogin,
        organiserRegister,
        organiserLogout,
        refreshOrganiser,

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
