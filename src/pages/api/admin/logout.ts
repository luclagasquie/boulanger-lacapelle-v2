import type { APIRoute } from "astro";
import { clearAdminCookie } from "../../../lib/admin";

export const POST: APIRoute = async ({ cookies, url }) => {
  clearAdminCookie(cookies, url.protocol === "https:");
  return Response.redirect(new URL("/admin", url), 303);
};
