import type { APIRoute } from "astro";
import { adminCookieName } from "../../../../lib/config";
import { isAdminAuthenticated } from "../../../../lib/admin";
import { createProduct, isDatabaseConfigured } from "../../../../lib/db";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const POST: APIRoute = async ({ request, cookies, url }) => {
  if (!isAdminAuthenticated(cookies.get(adminCookieName)?.value)) {
    return Response.redirect(new URL("/admin?status=auth", url), 303);
  }

  if (!isDatabaseConfigured()) {
    return Response.redirect(new URL("/admin?status=storage", url), 303);
  }

  const formData = await request.formData();
  const title = String(formData.get("title") || "").trim();
  const slug = slugify(String(formData.get("slug") || "").trim() || title);
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  const weightGrams = Number(formData.get("weightGrams") || 0);
  const pricePerKg = Number(formData.get("pricePerKg") || 0);
  const sortOrderValue = String(formData.get("sortOrder") || "").trim();
  const sortOrder = sortOrderValue ? Number(sortOrderValue) : undefined;
  const isActive = formData.get("isActive") ? 1 : 0;

  if (
    !title ||
    !slug ||
    !imageUrl ||
    weightGrams <= 0 ||
    pricePerKg <= 0 ||
    (typeof sortOrder === "number" && (!Number.isFinite(sortOrder) || sortOrder < 0))
  ) {
    return Response.redirect(new URL("/admin?status=invalid", url), 303);
  }

  try {
    await createProduct({
      slug,
      title,
      weightGrams: Math.round(weightGrams),
      pricePerKgCents: Math.round(pricePerKg * 100),
      imageUrl,
      isActive,
      sortOrder: typeof sortOrder === "number" ? Math.round(sortOrder) : undefined
    });
  } catch {
    return Response.redirect(new URL("/admin?status=invalid", url), 303);
  }

  return Response.redirect(new URL("/admin?status=product_saved", url), 303);
};
