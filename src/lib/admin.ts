import type { AstroCookies } from "astro";
import { env } from "cloudflare:workers";
import { adminCookieName } from "./config";

export function isAdminConfigured() {
  return Boolean(env.ADMIN_PASSWORD);
}

export function getAdminSessionToken() {
  return env.ADMIN_SESSION_TOKEN || env.ADMIN_PASSWORD || "";
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
