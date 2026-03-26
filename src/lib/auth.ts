import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import dbConnect from "./mongodb";
import mongoose from "mongoose";
import Organiser, { IOrganiser } from "@/models/Organiser";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";
const COOKIE_NAME = "organiser_token";
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
  role: "organiser";
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

export async function setOrganiserCookie(organiserId: string, email: string) {
  const token = signToken({ id: organiserId, email, role: "organiser" });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
  return token;
}

export async function clearOrganiserCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getOrganiserFromCookie(): Promise<(mongoose.Document & IOrganiser) | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    await dbConnect();
    const organiser = await Organiser.findById(payload.id);
    return organiser;
  } catch {
    return null;
  }
}

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
