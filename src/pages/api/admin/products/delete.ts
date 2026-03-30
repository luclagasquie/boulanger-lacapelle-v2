import type { APIRoute } from "astro";
import { adminCookieName } from "../../../../lib/config";
import { isAdminAuthenticated } from "../../../../lib/admin";
import { deleteProduct } from "../../../../lib/db";

export const POST: APIRoute = async ({ request, cookies, url }) => {
  if (!isAdminAuthenticated(cookies.get(adminCookieName)?.value)) {
    return Response.redirect(new URL("/admin?status=auth", url), 303);
  }

  const formData = await request.formData();
  const id = Number(formData.get("id") || 0);

  if (id <= 0) {
    return Response.redirect(new URL("/admin?status=invalid", url), 303);
  }

  await deleteProduct(id);
  return Response.redirect(new URL("/admin?status=product_deleted", url), 303);
};
