import type { APIRoute } from "astro";
import { adminCookieName } from "../../../../lib/config";
import { isAdminAuthenticated } from "../../../../lib/admin";
import { isDatabaseConfigured, resetOrdersForPickupDate } from "../../../../lib/db";

export const POST: APIRoute = async ({ request, cookies, url }) => {
  if (!isAdminAuthenticated(cookies.get(adminCookieName)?.value)) {
    return Response.redirect(new URL("/admin?status=auth", url), 303);
  }

  if (!isDatabaseConfigured()) {
    return Response.redirect(new URL("/admin?status=storage", url), 303);
  }

  const formData = await request.formData();
  const pickupDate = String(formData.get("pickupDate") || "").trim();

  if (!pickupDate) {
    return Response.redirect(new URL("/admin?status=invalid", url), 303);
  }

  try {
    await resetOrdersForPickupDate(pickupDate);
  } catch {
    return Response.redirect(new URL("/admin?status=storage", url), 303);
  }

  return Response.redirect(new URL(`/admin?status=orders_reset&pickup=${pickupDate}`, url), 303);
};
