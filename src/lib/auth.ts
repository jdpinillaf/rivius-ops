import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "ops-session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.OPS_SECRET;
  if (!secret || secret.length < 8) {
    throw new Error("OPS_SECRET env var must be set (min 8 chars)");
  }
  return secret;
}

function getPassword(): string {
  const password = process.env.OPS_PASSWORD;
  if (!password || password.length < 4) {
    throw new Error("OPS_PASSWORD env var must be set (min 4 chars)");
  }
  return password;
}

function sign(value: string): string {
  const secret = getSecret();
  const hmac = crypto.createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${hmac}`;
}

function verify(token: string): boolean {
  const secret = getSecret();
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;
  const value = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("hex");
  return (
    sig.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  );
}

export function checkPassword(input: string): boolean {
  const password = getPassword();
  return input === password;
}

export async function createSession(): Promise<void> {
  const payload = `ops:${Date.now()}`;
  const token = sign(payload);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verify(token);
}

/** For middleware (sync check using raw cookie value) */
export function verifyToken(token: string): boolean {
  try {
    return verify(token);
  } catch {
    return false;
  }
}
