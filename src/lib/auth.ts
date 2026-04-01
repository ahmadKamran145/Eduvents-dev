import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import dbConnect from "./mongodb";
import mongoose from "mongoose";
import Admin, { IAdmin } from "@/models/Admin";
import Organiser, { IOrganiser } from "@/models/Organiser";
import SiteUser, { ISiteUser } from "@/models/SiteUser";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";
const AUTH_COOKIE = "auth_token";
const TOKEN_EXPIRY = "7d";

// Legacy cookie names — cleared on login to prevent stale conflicts
const LEGACY_COOKIES = ["admin_token", "organiser_token", "siteuser_token"];

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
  role: "admin" | "organiser" | "siteuser";
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

// --- Single Auth Cookie ---

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

async function clearLegacyCookies() {
  const cookieStore = await cookies();
  for (const name of LEGACY_COOKIES) {
    cookieStore.set(name, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  }
}

async function setAuthCookie(payload: TokenPayload) {
  const token = signToken(payload);
  const cookieStore = await cookies();
  await clearLegacyCookies();
  cookieStore.set(AUTH_COOKIE, token, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60,
  });
  return token;
}

async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  await clearLegacyCookies();
}

async function getAuthPayload(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

// --- Admin ---

export async function setAdminCookie(email: string) {
  return setAuthCookie({ id: "admin", email, role: "admin" });
}

export async function clearAdminCookie() {
  return clearAuthCookie();
}

export async function getAdminFromCookie(): Promise<{ email: string } | null> {
  const payload = await getAuthPayload();
  if (!payload || payload.role !== "admin") return null;
  return { email: payload.email };
}

// --- Organiser ---

export async function setOrganiserCookie(organiserId: string, email: string) {
  return setAuthCookie({ id: organiserId, email, role: "organiser" });
}

export async function clearOrganiserCookie() {
  return clearAuthCookie();
}

export async function getOrganiserFromCookie(): Promise<
  (mongoose.Document & IOrganiser) | null
> {
  const payload = await getAuthPayload();
  if (!payload || payload.role !== "organiser") return null;

  await dbConnect();
  return Organiser.findById(payload.id);
}

// --- Site User ---

export async function setSiteUserCookie(siteUserId: string, email: string) {
  return setAuthCookie({ id: siteUserId, email, role: "siteuser" });
}

export async function clearSiteUserCookie() {
  return clearAuthCookie();
}

export async function getSiteUserFromCookie(): Promise<
  (mongoose.Document & ISiteUser) | null
> {
  const payload = await getAuthPayload();
  if (!payload || payload.role !== "siteuser") return null;

  await dbConnect();
  return SiteUser.findById(payload.id);
}

// --- Shared Helpers ---

export async function getAdminByEmail(
  email: string,
): Promise<(mongoose.Document & IAdmin) | null> {
  await dbConnect();
  return Admin.findOne({ email: email.trim().toLowerCase() });
}

export async function verifyAdminPassword(
  email: string,
  password: string,
): Promise<(mongoose.Document & IAdmin) | null> {
  const admin = await getAdminByEmail(email);
  if (!admin) return null;
  const match = await bcrypt.compare(password, admin.password);
  return match ? admin : null;
}

export async function isEmailTaken(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  await dbConnect();

  // Check Admin collection
  const existingAdmin = await Admin.findOne({ email: normalizedEmail });
  if (existingAdmin) return true;

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
