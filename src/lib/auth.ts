import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import dbConnect from "./mongodb";
import mongoose from "mongoose";
import Organiser, { IOrganiser } from "@/models/Organiser";
import SiteUser, { ISiteUser } from "@/models/SiteUser";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";
const ORGANISER_COOKIE = "organiser_token";
const SITEUSER_COOKIE = "siteuser_token";
const TOKEN_EXPIRY = "7d";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

interface TokenPayload {
  id: string;
  email: string;
  role: "organiser" | "siteuser";
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// --- Organiser Cookie ---

export async function setOrganiserCookie(organiserId: string, email: string) {
  const token = signToken({ id: organiserId, email, role: "organiser" });
  const cookieStore = await cookies();
  // Clear site user cookie for mutual exclusion
  cookieStore.set(SITEUSER_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  cookieStore.set(ORGANISER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return token;
}

export async function clearOrganiserCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ORGANISER_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getOrganiserFromCookie(): Promise<
  (mongoose.Document & IOrganiser) | null
> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ORGANISER_COOKIE)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload || payload.role !== "organiser") return null;

    await dbConnect();
    const organiser = await Organiser.findById(payload.id);
    return organiser;
  } catch {
    return null;
  }
}

// --- Site User Cookie ---

export async function setSiteUserCookie(siteUserId: string, email: string) {
  const token = signToken({ id: siteUserId, email, role: "siteuser" });
  const cookieStore = await cookies();
  // Clear organiser cookie for mutual exclusion
  cookieStore.set(ORGANISER_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  cookieStore.set(SITEUSER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return token;
}

export async function clearSiteUserCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SITEUSER_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSiteUserFromCookie(): Promise<
  (mongoose.Document & ISiteUser) | null
> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SITEUSER_COOKIE)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload || payload.role !== "siteuser") return null;

    await dbConnect();
    const siteUser = await SiteUser.findById(payload.id);
    return siteUser;
  } catch {
    return null;
  }
}

// --- Shared Helpers ---

export function getAdminEmails(): string[] {
  try {
    const adminCredentialsJson = process.env.ADMIN_CREDENTIALS;
    if (!adminCredentialsJson) return [];
    const adminCredentials: Array<{ email: string; password: string }> =
      JSON.parse(adminCredentialsJson);
    return adminCredentials.map((a) => a.email.toLowerCase());
  } catch {
    return [];
  }
}

export async function isEmailTaken(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  await dbConnect();

  // Check admin credentials
  if (getAdminEmails().includes(normalizedEmail)) return true;

  // Check Organiser collection
  const existingOrganiser = await Organiser.findOne({
    email: normalizedEmail,
  });
  if (existingOrganiser) return true;

  // Check SiteUser collection
  const existingSiteUser = await SiteUser.findOne({ email: normalizedEmail });
  if (existingSiteUser) return true;

  return false;
}
