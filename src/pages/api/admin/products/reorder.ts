import type { APIRoute } from "astro";
import { adminCookieName } from "../../../../lib/config";
import { isAdminAuthenticated } from "../../../../lib/admin";
import { isDatabaseConfigured, reorderProducts } from "../../../../lib/db";

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAdminAuthenticated(cookies.get(adminCookieName)?.value)) {
    return Response.json({ ok: false, error: "auth" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return Response.json({ ok: false, error: "storage" }, { status: 503 });
  }

  const formData = await request.formData();
  const productIds = formData
    .getAll("productIds[]")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  if (productIds.length === 0) {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  try {
    await reorderProducts(productIds);
  } catch {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  return Response.json({ ok: true });
};
