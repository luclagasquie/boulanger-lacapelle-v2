import type { AstroCookies } from "astro";
import { createHash } from "node:crypto";
import { env } from "cloudflare:workers";
import { adminCookieName } from "./config";

export function isAdminConfigured() {
  return Boolean(env.ADMIN_PASSWORD);
}

function getRawAdminSessionSecret() {
  return env.ADMIN_SESSION_TOKEN || env.ADMIN_PASSWORD || "";
}

export function getAdminSessionToken() {
  const secret = getRawAdminSessionSecret();

  if (!secret) {
    return "";
  }

  // Store a stable hash in the cookie so any secret format remains safe for Set-Cookie.
  return createHash("sha256").update(secret).digest("hex");
}

export function isAdminAuthenticated(cookieValue?: string | null) {
  return Boolean(cookieValue) && cookieValue === getAdminSessionToken();
}

export function setAdminCookie(cookies: AstroCookies, secure: boolean) {
  cookies.set(adminCookieName, getAdminSessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export function clearAdminCookie(cookies: AstroCookies, secure: boolean) {
  cookies.set(adminCookieName, "", {
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: "/",
    maxAge: 0
  });
}
