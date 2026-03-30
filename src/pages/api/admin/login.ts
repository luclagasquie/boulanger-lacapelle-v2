import type { APIRoute } from "astro";
import { setAdminCookie } from "../../../lib/admin";
import { env } from "cloudflare:workers";

export const POST: APIRoute = async ({ request, cookies, url }) => {
  try {
    const formData = await request.formData();
    const password = String(formData.get("password") || "");

    if (!env.ADMIN_PASSWORD || password !== env.ADMIN_PASSWORD) {
      return Response.redirect(new URL("/admin?status=auth", url), 303);
    }

    setAdminCookie(cookies, url.protocol === "https:");
    // Cloudflare's Response.redirect() returns immutable headers, which prevents
    // the adapter from appending Set-Cookie afterwards.
    return new Response(null, {
      status: 303,
      headers: {
        Location: new URL("/admin", url).toString()
      }
    });
  } catch (error) {
    console.error("Admin login failed", error);
    return Response.redirect(new URL("/admin?status=server_error", url), 303);
  }
};
