import type { APIRoute } from "astro";
import { clearAdminCookie } from "../../../lib/admin";

export const POST: APIRoute = async ({ cookies, url }) => {
  clearAdminCookie(cookies, url.protocol === "https:");
  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL("/admin", url).toString()
    }
  });
};
