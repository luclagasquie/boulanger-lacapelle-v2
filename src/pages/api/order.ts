import type { APIRoute } from "astro";
import { insertOrder, listActiveProducts, priceFromWeight } from "../../lib/db";
import { getReservationContext } from "../../lib/schedule";

export const POST: APIRoute = async ({ request }) => {
  const reservation = getReservationContext();

  if (!reservation.isOpen || !reservation.activeWindow) {
    return Response.redirect(new URL("/?status=closed", request.url), 303);
  }

  const formData = await request.formData();
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (firstName.length < 2 || lastName.length < 2 || phone.length < 8) {
    return Response.redirect(new URL("/?status=invalid", request.url), 303);
  }

  const products = await listActiveProducts();
  const items = products.flatMap((product) => {
      const rawValue = Number(formData.get(`qty_${product.id}`) || 0);
      const quantity = Number.isFinite(rawValue) ? Math.max(0, Math.min(20, Math.floor(rawValue))) : 0;
      const unitPriceCents = priceFromWeight(product.weight_grams, product.price_per_kg_cents);
      return quantity > 0
        ? [{
            productId: product.id,
            productTitle: product.title,
            weightGrams: product.weight_grams,
            pricePerKgCents: product.price_per_kg_cents,
            quantity,
            lineTotalCents: unitPriceCents * quantity
          }]
        : [];
    });

  if (items.length === 0) {
    return Response.redirect(new URL("/?status=empty", request.url), 303);
  }

  const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);

  try {
    await insertOrder({
      pickupDate: reservation.activeWindow.pickupDateISO,
      pickupLabel: reservation.activeWindow.pickupDateLabel,
      firstName,
      lastName,
      phone,
      totalCents,
      items
    });
  } catch {
    return Response.redirect(new URL("/?status=unavailable", request.url), 303);
  }

  return Response.redirect(new URL("/?status=success", request.url), 303);
};
